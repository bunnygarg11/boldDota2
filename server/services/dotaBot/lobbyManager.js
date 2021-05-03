const Dota2 = require("dota2");
const assert = require("assert").strict;
const Promise = require("bluebird");
const { EventEmitter } = require("events");
const path = require("path");
const util = require("util");
const logger = require("./logger");
const MatchTracker = require("./matchTracker");
const CONSTANTS = require("./constants");
const Db = require("./db");
const Lobby = require("./lobby");
// const Ihl = require("./ihl");
const Fp = require("./util/fp");
const equalsLong = require("./util/equalsLong");
const DotaBot = require("./dotaBot");
const LobbyStateHandlers = require("./lobbyStateHandlers");
const EventListeners = require("./eventListeners");

Promise.config({ cancellation: true });

const setMatchPlayerDetails = (matchOutcome) => (members) => async (_lobby) => {
  const lobby = await Lobby.getLobby(_lobby);
  const players = await Lobby.getPlayers(lobby);
  let winner = 0;
  const tasks = [];
  for (const playerData of members) {
    const steamId64 = playerData.id.toString();
    const player = players.find((p) => p== steamId64);
    if (player) {
      const data = {
        // win: 0,
        // lose: 0,
        heroId: playerData.hero_id,
        // kills: 0,
        // deaths: 0,
        // assists: 0,
        // gpm: 0,
        // xpm: 0,
      };
      if (
        (playerData.team === Dota2.schema.DOTA_GC_TEAM.DOTA_GC_TEAM_GOOD_GUYS &&
          matchOutcome ===
            Dota2.schema.EMatchOutcome.k_EMatchOutcome_RadVictory) ||
        (playerData.team === Dota2.schema.DOTA_GC_TEAM.DOTA_GC_TEAM_BAD_GUYS &&
          matchOutcome ===
            Dota2.schema.EMatchOutcome.k_EMatchOutcome_DireVictory)
      ) {
        data.win = 1;
        // winner = player.LobbyPlayer.faction;
      } else {
        data.lose = 1;
      }
      tasks.push(Lobby.updateLobbyPlayerBySteamId(data,_lobby,steamId64));
    }
  }
  await Fp.allPromise(tasks);
  // await Db.updateLobbyWinner(lobby,winner);
};

class LobbyManager extends EventEmitter {
  constructor() {
    super();

    this.lobbyTimeoutTimers = {};
    this.bots = {};
    this.matchTracker = null;
    this.attachListeners();
    this.eventQueue = [];
    this.blocking = false;
    this._runningLobby = false;
    this.onClientReady();
  }

  /**
   * Discord client ready handler.
   * @async
   * @fires module:ihlManager~ready
   */
  onClientReady() {
    // logger.debug(
    //   `LobbyManager onClientReady logged in as ${this.client.user.tag}`
    // );

    this.matchTracker = new MatchTracker.MatchTracker(parseInt(5000));
    this.matchTracker.on(CONSTANTS.EVENT_MATCH_STATS, (lobby) =>
      this[CONSTANTS.EVENT_MATCH_STATS](lobby).catch((e) => logger.error(e))
    );
    this.matchTracker.on(CONSTANTS.EVENT_MATCH_NO_STATS, (lobby) =>
      this[CONSTANTS.EVENT_MATCH_NO_STATS](lobby).catch((e) => logger.error(e))
    );

    // await Db.setAllBotsOffline();
  }

  /**
   * Creates and registers a ready up timer for a lobby state.
   * @param {module:lobby.LobbyState} lobbyState - An inhouse lobby state.
   */
  registerLobbyTimeout(lobbyState) {
    this.unregisterLobbyTimeout(lobbyState);
    const delay = Math.max(
      0,
      lobbyState.readyCheckTime +
        lobbyState.inhouseState.readyCheckTimeout -
        Date.now()
    );
    logger.debug(
      `LobbyManager registerLobbyTimeout ${lobbyState._id} ${lobbyState.readyCheckTime} ${lobbyState.readyCheckTimeout}. timeout ${delay}ms`
    );
    this.lobbyTimeoutTimers[lobbyState._id.toString()] = setTimeout(() => {
      logger.debug(
        `LobbyManager registerLobbyTimeout ${lobbyState._id} timed out`
      );
      this.queueEvent(this.onLobbyTimedOut, [lobbyState]);
    }, delay);
    // this[CONSTANTS.MSG_READY_CHECK_START](lobbyState).catch((e) =>
    //   logger.error(e)
    // );
  }

  /**
   * Clears and unregisters the ready up timer for a lobby state.
   * @param {module:lobby.LobbyState} lobbyState - An inhouse lobby state.
   */
  unregisterLobbyTimeout(lobbyState) {
    logger.debug(`LobbyManager unregisterLobbyTimeout ${lobbyState._id}`);
    if (this.lobbyTimeoutTimers[lobbyState._id.toString()]) {
      clearTimeout(this.lobbyTimeoutTimers[lobbyState._id.toString()]);
    }
    delete this.lobbyTimeoutTimers[lobbyState._id.toString()];
  }

  /**
   * Sets a bot status.
   * @async
   * @param {string} steamId64 - Bot steam id.
   * @param {string} status - Bot status.
   */
  async onSetBotStatus(steamId64, status) {
    logger.debug(`LobbyManager onSetBotStatus ${steamId64} ${status}`);
    await Db.updateBot(steamId64, status);
  }

  /**
   * Processes and executes a lobby state if it matches any of the given states.
   * If no states to match against are given, the lobby state is run by default.
   * @async
   * @param {module:lobby.LobbyState} _lobbyState - An inhouse lobby state.
   * @param {string[]} states - A list of valid lobby states.
   */
  async runLobby(_lobbyState, states = []) {
    logger.debug(
      `LobbyManager runLobby ${_lobbyState._id} ${
        _lobbyState.state
      } ${states.join(",")}`
    );
    let lobbyState;
    try {
      assert.equal(this._runningLobby, false, "Already running a lobby.");
      this._runningLobby = true;
      const lobby = await Lobby.getLobby(_lobbyState);
      logger.debug(`LobbyManager runLobby lobby.state ${lobby.state}`);
      if (!states.length || states.indexOf(lobby.state) !== -1) {
        lobbyState = await Fp.pipeP(
          // Lobby.createLobbyState(_lobbyState.inhouseState)(_lobbyState),
          Lobby.validateLobbyPlayers,
          this.validateLobbyStateBot.bind(this)
        )(lobby);
        let beginState = -1;
        let endState = lobbyState.state;
        while (beginState !== endState) {
          beginState = lobbyState.state;
          // eslint-disable-next-line no-await-in-loop
          lobbyState = await this[beginState](lobbyState);
          endState = lobbyState.state;
          logger.debug(
            `runLobby ${lobbyState._id} ${beginState} to ${endState}`
          );
          this.emit(beginState, lobbyState); // test hook event
        }
        try {
          // await Lobby.setLobbyTopic(lobbyState);
        } catch (e) {
          logger.error(e);
        }
      }
    } catch (e) {
      logger.error(e);
      if (lobbyState) {
        await Db.updateLobbyState(lobbyState, CONSTANTS.STATE_FAILED);
      }
      process.exit(1);
    } finally {
      this._runningLobby = false;
    }
  }

  /**
   * Sets a lobby state.
   * @async
   * @param {module:lobby.LobbyState} _lobbyState - The lobby state being changed.
   * @param {string} state - The state to set the lobby to.
   */
  async onSetLobbyState(_lobbyState, state) {
    logger.debug(`LobbyManager onSetLobbyState ${_lobbyState._id} ${state}`);
    const lobbyState = { ..._lobbyState, state };
    await Db.updateLobbyState(lobbyState, state);
    this[CONSTANTS.EVENT_RUN_LOBBY](lobbyState, [state]).catch((e) =>
      logger.error(e)
    );
  }

  /**
   * Runs lobbies waiting for bots.
   * @async
   */
  async onBotAvailable() {
    const lobbies = await Db.findAllLobbiesInState(
      CONSTANTS.STATE_WAITING_FOR_BOT
    );
    logger.debug(`LobbyManager onBotAvailable ${lobbies.length}`);
    // const lobbyStates = await Fp.mapPromise(
    //   Ihl.loadLobbyState(this.client.guilds)
    // )(lobbies);
    lobbies.forEach((lobbyState) =>
      this[CONSTANTS.EVENT_RUN_LOBBY](lobbyState, [
        CONSTANTS.STATE_WAITING_FOR_BOT,
      ]).catch((e) => logger.error(e))
    );
  }

  /**
   * Set bot idle then call onBotAvailable to run lobbies waiting for bots.
   * @async
   */
  async onBotLobbyLeft(botId) {
    await Db.updateBotStatus(CONSTANTS.BOT_IDLE, botId);
    return this.onBotAvailable();
  }

  /**
   * Runs a lobby state when its ready up timer has exihlManager queueEventpired.
   * Checks for STATE_CHECKING_READY lobby state
   * @async
   * @param {module:lobby.LobbyState} lobbyState - An inhouse lobby state.
   */
  async onLobbyTimedOut(lobbyState) {
    logger.debug(`LobbyManager onLobbyTimedOut ${lobbyState._id}`);
    delete this.lobbyTimeoutTimers[lobbyState._id.toString()];
    this[CONSTANTS.EVENT_RUN_LOBBY](lobbyState, [
      CONSTANTS.STATE_CHECKING_READY,
    ]).catch((e) => logger.error(e));
  }

  /**
   * Runs a lobby state when a player has readied up and update their player ready state.
   * Checks for STATE_CHECKING_READY lobby state
   * @async
   * @param {module:lobby.LobbyState} lobbyState - An inhouse lobby state.
   * @param {module:db.User} user - An inhouse user.
   */
  async onPlayerReady(lobbyState, user) {
    logger.debug(
      `LobbyManager onPlayerReady ${lobbyState._id} ${user || "user"}`
    );
    await Lobby.setPlayerReady(true)(lobbyState)(user.id);
    this[CONSTANTS.EVENT_RUN_LOBBY](lobbyState, [
      CONSTANTS.STATE_CHECKING_READY,
    ]).catch((e) => logger.error(e));
  }

  async onStartDotaLobby(_lobbyState, _dotaBot) {
    const lobbyState = { ..._lobbyState };
    logger.debug(
      `LobbyManager onStartDotaLobby ${lobbyState._id} ${lobbyState.botId} ${lobbyState.state}`
    );
    if (lobbyState.state !== CONSTANTS.STATE_WAITING_FOR_PLAYERS) return false;
    const dotaBot = _dotaBot || this.getBot(lobbyState.botId);
    if (dotaBot) {
      lobbyState.state = CONSTANTS.STATE_MATCH_IN_PROGRESS;
      lobbyState.startedAt = Date.now();
      lobbyState.matchId = await DotaBot.startDotaLobby(dotaBot);
      logger.debug(
        `LobbyManager onStartDotaLobby matchId ${lobbyState.matchId} leagueid `
      );
      if (lobbyState.leagueid) {
        await this.botLeaveLobby(lobbyState);
      }
      // await Lobby.removeQueuers(lobbyState);
      await Db.updateLobby(lobbyState);
      this.matchTracker.addLobby(lobbyState);
      if (!this.matchTracker.enabled) this.matchTracker.enable();
      this.matchTracker.run();
      // this[CONSTANTS.MSG_LOBBY_STARTED](lobbyState);
      logger.debug("ihlManager onStartDotaLobby true");
    }
    logger.debug("ihlManager onStartDotaLobby false");
    return lobbyState;
  }

  /**
   * Swap teams in the dota lobby.
   * @async
   * @param {module:lobby.LobbyState} lobbyState - An inhouse lobby state.
   */
  // async onLobbySwapTeams(lobbyState) {
  //   if (lobbyState.state !== CONSTANTS.STATE_WAITING_FOR_PLAYERS) return false;
  //   const dotaBot = this.getBot(lobbyState.botId);
  //   if (dotaBot) {
  //     await Db.updateLobbyRadiantFaction(lobbyState)(
  //       3 - lobbyState.radiantFaction
  //     );
  //     await dotaBot.flipLobbyTeams();
  //     return true;
  //   }
  //   return false;
  // }

  async onLobbyKick(lobbyState, user) {
    logger.debug(
      `LobbyManager onLobbyKick ${lobbyState._id} ${user} ${lobbyState.botId} ${user}`
    );
    const dotaBot = this.getBot(lobbyState.botId);
    if (dotaBot) {
      DotaBot.kickPlayer(dotaBot)(user);
    }
  }

  /**
   * Invites a player to the dota lobby.
   * @async
   * @param {module:lobby.LobbyState} lobbyState - An inhouse lobby state.
   * @param {module:db.User} user - The player to invite
   */
  async onLobbyInvite(lobbyState, user) {
    logger.debug(
      `LobbyManager onLobbyInvite ${lobbyState._id} ${user} ${lobbyState.botId} ${user}`
    );
    const dotaBot = this.getBot(lobbyState.botId);
    if (dotaBot) {
      DotaBot.invitePlayer(dotaBot)(user);
    }
  }

  /**
   * Runs a lobby state when the lobby is ready (all players have joined and are in the right team slot).
   * Checks for STATE_WAITING_FOR_PLAYERS lobby state
   * @async
   * @param {string} dotaLobbyId - A dota lobby id.
   */
  async onLobbyReady(dotaLobbyId) {
    logger.debug(`LobbyManager onLobbyReady ${dotaLobbyId}`);
    // const lobbyState = await Ihl.loadLobbyStateFromDotaLobbyId(
    //   this.client.guilds
    // )(dotaLobbyId);

    const lobbyState = await Db.findLobbyByDotaLobbyId(dotaLobbyId);
    logger.debug(
      `LobbyManager onLobbyReady ${lobbyState._id} ${lobbyState.lobbyName}`
    );
    this[CONSTANTS.EVENT_RUN_LOBBY](lobbyState, [
      CONSTANTS.STATE_WAITING_FOR_PLAYERS,
    ]).catch((e) => logger.error(e));
  }

  /**
   * Puts a lobby state in STATE_PENDING_KILL and runs lobby.
   * @async
   * @param {module:lobby.LobbyState} lobbyState - An inhouse lobby state.
   */
  async onLobbyKill(lobbyState) {
    logger.debug(`LobbyManager onLobbyKill ${lobbyState._id}`);
    await Db.updateLobbyState(lobbyState, CONSTANTS.STATE_PENDING_KILL);
    this[CONSTANTS.EVENT_RUN_LOBBY](lobbyState, [
      CONSTANTS.STATE_PENDING_KILL,
    ]).catch((e) => logger.error(e));
  }

  /**
   * Handles match signed out bot event.
   * Updates STATE_MATCH_IN_PROGRESS lobby state to STATE_MATCH_ENDED
   * @async
   * @param {number} matchId - A dota match id.
   */
  async onMatchSignedOut(matchId) {
    // const lobbyState = await Ihl.loadLobbyStateFromMatchId(this.client.guilds)(
    //   matchId.toString()
    // );
    const lobbyState = await Db.findLobbyByMatchId(matchId.toString());

    logger.debug(
      `LobbyManager onMatchSignedOut ${matchId} ${lobbyState._id} ${lobbyState.state}`
    );
    if (lobbyState.state === CONSTANTS.STATE_MATCH_IN_PROGRESS) {
      await Db.updateLobbyState(lobbyState, CONSTANTS.STATE_MATCH_ENDED);
      logger.debug(
        "ihlManager onMatchSignedOut state set to STATE_MATCH_ENDED"
      );
      this[CONSTANTS.EVENT_RUN_LOBBY](lobbyState, [
        CONSTANTS.STATE_MATCH_ENDED,
      ]).catch((e) => logger.error(e));
    }
    await this.botLeaveLobby(lobbyState);
    await Lobby.unassignBotFromLobby(lobbyState);
  }

  async disableMatchTracker(){
    if(this.matchTracker.enabled){
      this.matchTracker.disable()
    }

  }

  /**
   * Handles match outcome bot event.
   * Updates lobby winner and player stats.
   * Sends match stats message.
   * Puts lobby into STATE_MATCH_STATS state
   * @async
   * @param {string} dotaLobbyId - A dota lobby id.
   * @param {external:Dota2.schema.EMatchOutcome} matchOutcome - The dota match outcome
   * @param {external:Dota2.schema.CDOTALobbyMember[]} members - Array of dota lobby members
   */
  async onMatchOutcome(dotaLobbyId, matchOutcome, members) {
    // const lobbyState = await Ihl.loadLobbyStateFromDotaLobbyId(
    //   this.client.guilds
    // )(dotaLobbyId);
    const lobbyState = await Db.findLobbyByDotaLobbyId(dotaLobbyId);
    logger.debug(
      `LobbyManager onMatchOutcome ${dotaLobbyId} ${matchOutcome} ${lobbyState._id}`
    );
    await setMatchPlayerDetails(matchOutcome)(members)(lobbyState);
    // this[CONSTANTS.MSG_MATCH_STATS](lobbyState, lobbyState.inhouseState);
    await Db.updateLobbyState(lobbyState, CONSTANTS.STATE_MATCH_STATS);
    this[CONSTANTS.EVENT_RUN_LOBBY](lobbyState, [
      CONSTANTS.STATE_MATCH_STATS,
    ]).catch((e) => logger.error(e));
  }

  /**
   * Handles match tracker match stats event.
   * Sends match stats message.
   * Puts lobby into STATE_MATCH_STATS state
   * @async
   * @param {module:db.Lobby} lobby - A lobby database model
   */
  async onMatchStats(lobby) {
    logger.debug(`LobbyManager onMatchStats ${lobby._id}`);
    // const league = await Db.findLeagueById(lobby.leagueId);
    // const inhouseState = await Ihl.createInhouseState({
    //   league,
    //   guild: this.client.guilds.get(league.guildId),
    // });
    // const lobbyState = await Lobby.lobbyToLobbyState(inhouseState)(lobby);
    // this[CONSTANTS.MSG_MATCH_STATS](lobbyState, inhouseState);
    await Db.updateLobbyState(lobby, CONSTANTS.STATE_MATCH_STATS);
    this[CONSTANTS.EVENT_RUN_LOBBY](lobby, [
      CONSTANTS.STATE_MATCH_STATS,
    ]).catch((e) => logger.error(e));
  }

  /**
   * Handles match tracker match no stats event.
   * Sends match no stats message.
   * Puts lobby into STATE_MATCH_NO_STATS state
   * @async
   * @param {module:db.Lobby} lobby - A lobby database model
   */
  async onMatchNoStats(lobby) {
    logger.debug(`LobbyManager onMatchNoStats ${lobby._id}`);
    // const league = await Db.findLeagueById(lobby.leagueId);
    // const inhouseState = await Ihl.createInhouseState({
    //   league,
    //   guild: this.client.guilds.get(league.guildId),
    // });
    // const lobbyState = await Lobby.lobbyToLobbyState(inhouseState)(lobby);
    // this[CONSTANTS.MSG_MATCH_NO_STATS](lobbyState, inhouseState);
    await Db.updateLobbyState(lobby, CONSTANTS.STATE_MATCH_NO_STATS);
    this[CONSTANTS.EVENT_RUN_LOBBY](lobby, [
      CONSTANTS.STATE_MATCH_NO_STATS,
    ]).catch((e) => logger.error(e));
  }

  async processEventQueue() {
    if (this.blocking) return;
    if (this.eventQueue.length) {
      this.blocking = true;
      const [fn, args, resolve, reject] = this.eventQueue.shift();
      logger.debug(
        `LobbyManager processEventQueue ${fn.name} ${this.eventQueue.length}`
      );
      try {
        const value = await fn.apply(this, args);
        resolve(value);
      } catch (e) {
        logger.error(e);
        reject(e);
      }
      this.blocking = false;
      if (this.eventQueue.length) {
        await this.processEventQueue();
      } else {
        this.emit("empty"); // test hook event
      }
    }
  }

  async queueEvent(fn, args = []) {
    logger.debug(`LobbyManager queueEvent ${fn.name} ${args}`);
    return new Promise((resolve, reject) => {
      this.eventQueue.push([fn, args, resolve, reject]);
      this.processEventQueue().catch((e) => logger.error(e) && process.exit(1));
    }).timeout(100000);
  }

  /**
   * Gets a bot.
   * @param {number} botId - The bot id.
   * @returns {module:dotaBot.DotaBot}
   */

  getBot(botId) {
    logger.debug(
      `LobbyManager getBot ${botId} bot ${
        botId != null ? util.inspect(this.bots[botId]) : null
      }`
    );
    return botId != null ? this.bots[botId] : null;
  }

  /**
   * Gets a bot by steam id.
   * @param {number} steamId64 - The bot steam id.
   * @returns {module:dotaBot.DotaBot}
   */
  getBotBySteamId(steamId64) {
    logger.debug(`LobbyManager getBotBySteamId ${steamId64}`);
    for (const dotaBot of Object.values(this.bots)) {
      if (dotaBot.steamId64 === steamId64) return dotaBot;
    }
    return null;
  }

  /**
   * Start a dota bot by id.
   * @async
   * @param {number} botId - The bot id.
   * @returns {module:dotaBot.DotaBot}
   */
  async loadBotById(botId) {
    logger.debug(`LobbyManager loadBotById ${botId}`);
    const bot = await Db.findBot(botId);
    return this.loadBot(bot);
  }

  /**
   * Start a dota bot by steam id.
   * @async
   * @param {number} steamId64 - The bot steam id.
   * @returns {module:dotaBot.DotaBot}
   */
  async loadBotBySteamId(steamId64) {
    logger.debug(`LobbyManager loadBotBySteamId ${steamId64}`);
    const bot = await Db.findBotBySteamId64(steamId64);
    return this.loadBot(bot);
  }

  /**
   * Start a dota bot.
   * @async
   * @param {module:db.Bot} bot - The bot model.
   * @returns {module:dotaBot.DotaBot}
   */

  async loadBot(bot) {
    logger.debug(`LobbyManager loadBot ${bot._id}`);
    let dotaBot = this.getBot(bot._id.toString());
    if (!dotaBot) {
      await Db.updateBotStatus(CONSTANTS.BOT_LOADING, bot._id.toString());
      try {
        dotaBot = await Fp.pipeP(
          DotaBot.createDotaBot,
          DotaBot.connectDotaBot
        )(bot);
        // dotaBot.on(
        //   CONSTANTS.MSG_CHAT_MESSAGE,
        //   (channel, senderName, message, chatData) =>
        //     this[CONSTANTS.MSG_CHAT_MESSAGE](
        //       dotaBot.dotaLobbyId.toString(),
        //       channel,
        //       senderName,
        //       message,
        //       chatData
        //     )
        // );
        // dotaBot.on(CONSTANTS.MSG_LOBBY_PLAYER_JOINED, (member) =>
        //   this[CONSTANTS.MSG_LOBBY_PLAYER_JOINED](
        //     dotaBot.dotaLobbyId.toString(),
        //     member
        //   )
        // );
        // dotaBot.on(CONSTANTS.MSG_LOBBY_PLAYER_LEFT, (member) =>
        //   this[CONSTANTS.MSG_LOBBY_PLAYER_LEFT](
        //     dotaBot.dotaLobbyId.toString(),
        //     member
        //   )
        // );
        // dotaBot.on(CONSTANTS.MSG_LOBBY_PLAYER_CHANGED_SLOT, (state) =>
        //   this[CONSTANTS.MSG_LOBBY_PLAYER_CHANGED_SLOT](
        //     dotaBot.dotaLobbyId.toString(),
        //     state
        //   )
        // );
        dotaBot.on(CONSTANTS.EVENT_LOBBY_READY, () =>
          this[CONSTANTS.EVENT_LOBBY_READY](
            dotaBot.dotaLobbyId.toString()
          ).catch((e) => logger.error(e))
        );
        dotaBot.on(CONSTANTS.EVENT_BOT_LOBBY_LEFT, () =>
          this[CONSTANTS.EVENT_BOT_LOBBY_LEFT](bot._id.toString()).catch((e) =>
            logger.error(e)
          )
        );
        dotaBot.on(CONSTANTS.EVENT_MATCH_SIGNEDOUT, (matchId) =>
          this[CONSTANTS.EVENT_MATCH_SIGNEDOUT](matchId).catch((e) =>
            logger.error(e)
          )
        );
        dotaBot.on(
          CONSTANTS.EVENT_MATCH_OUTCOME,
          (dotaLobbyId, matchOutcome, members) =>
            this[CONSTANTS.EVENT_MATCH_OUTCOME](
              dotaLobbyId.toString(),
              matchOutcome,
              members
            ).catch((e) => logger.error(e))
        );
        this.bots[bot._id.toString()] = dotaBot;
        this.emit("bot-loaded", dotaBot); // test hook event
        logger.debug("ihlManager loadBot loaded");
      } catch (e) {
        logger.error(e);
        await Db.updateBotStatus(CONSTANTS.BOT_FAILED, bot._id.toString());
        return null;
      }
    }
    logger.debug("ihlManager loadBot done");
    return dotaBot;
  }

  /**
   * Remove a dota bot.
   * @async
   * @param {number} botId - The bot id.
   */
  async removeBot(botId) {
    logger.debug(`LobbyManager removeBot ${botId}`);
    const dotaBot = this.getBot(botId);
    if (dotaBot) {
      try {
        delete this.bots[botId];
        await DotaBot.disconnectDotaBot(dotaBot);
        logger.debug("ihlManager removeBot removed");
      } catch (e) {
        logger.error(e);
        await Db.updateBotStatus(CONSTANTS.BOT_FAILED, botId);
      }
    }
  }

  /**
   * Disconnect a dota bot from its lobby.
   * The bot should eventually emit EVENT_BOT_LOBBY_LEFT.
   * @param {module:lobby.lobbyState} lobbyState - The lobby for the bot.
   * @returns {null|string} Null if the bot left the lobby or a string containing the error reason.
   */
  async botLeaveLobby(lobbyState) {
    logger.debug(
      `LobbyManager botLeaveLobby ${lobbyState._id} ${lobbyState.botId}`
    );
    if (!lobbyState.botId) return "No bot assigned to lobby.";
    const dotaBot = await this.loadBotById(lobbyState.botId);
    if (dotaBot) {
      if (equalsLong(lobbyState.dotaLobbyId, dotaBot.dotaLobbyId)) {
        await dotaBot.leavePracticeLobby();
        await dotaBot.abandonCurrentGame();
        await dotaBot.leaveLobbyChat();
        logger.debug(
          `LobbyManager botLeaveLobby bot ${lobbyState.botId} left lobby ${lobbyState.dotaLobbyId}`
        );
        return null;
      }
      return `Lobby ID mismatch. Expected: ${lobbyState.dotaLobbyId}. Actual: ${dotaBot.dotaLobbyId}.`;
    }
    return `Bot ID: ${lobbyState.botId} not found.`;
  }

  /**
   * Check if lobby is in a state to have a dota bot.
   * If invalid, makes bot leave lobby and unassigns bot.
   * @param {module:lobby.lobbyState} lobbyState - The lobby to check.
   * @returns {module:lobby.lobbyState} Updated lobbyState.
   */
  async validateLobbyStateBot(lobbyState) {
    if (
      lobbyState.botId &&
      DotaBot.validBotLobbyStates.indexOf(lobbyState.state) === -1
    ) {
      logger.debug(
        `validateLobbyStateBot invalid lobby state for bot detected. Bot ${lobbyState.botId} leaving lobbyState ${lobbyState._id} ${lobbyState.state}.`
      );
      await this.botLeaveLobby(lobbyState);
      return Lobby.unassignBotFromLobby(lobbyState);
    }
    return { ...lobbyState };
  }

  /**
   * Bind all events to their corresponding event handler functions
   */
  attachListeners() {
    for (const eventName of Object.keys(CONSTANTS)) {
      if (eventName.startsWith("EVENT_")) {
        this.on(CONSTANTS[eventName], this[eventName].bind(this));
      }
    }
  }
}
Object.assign(
  LobbyManager.prototype,
  LobbyStateHandlers.LobbyStateHandlers({
    DotaBot,
    Db,
    Lobby,
    MatchTracker,
  })
);
Object.assign(LobbyManager.prototype, EventListeners({ Db }));


// module.exports = {
//   findUser,
//   loadInhouseStates,
//   loadInhouseStatesFromLeagues,
//   createClient,
//   setMatchPlayerDetails,
//   IHLManager,
// };
module.exports = LobbyManager;
