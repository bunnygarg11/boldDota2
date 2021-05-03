const logger = require("./logger");
const CONSTANTS = require("./constants");
const Fp = require("./util/fp");
const equalsLong = require("./util/equalsLong");
const getRandomInt = require("./util/getRandomInt");
// const SnowflakeUtil = require("discord.js/src/util/Snowflake");
const util=require("util")

const LobbyStateTransitions = {
  [CONSTANTS.STATE_CHECKING_READY]: {
    [CONSTANTS.QUEUE_TYPE_DRAFT]: CONSTANTS.STATE_SELECTION_PRIORITY,
    [CONSTANTS.QUEUE_TYPE_CHALLENGE]: CONSTANTS.STATE_SELECTION_PRIORITY,
    [CONSTANTS.QUEUE_TYPE_AUTO]: CONSTANTS.STATE_AUTOBALANCING,
  },
};

const lobbyStateNoOp = async (_lobbyState) => ({ ..._lobbyState });

/**
 * This provides methods used for ihlManager lobby state handling.
 * @mixin
 * @memberof module:ihlManager
 */
const LobbyStateHandlers = ({ DotaBot, Db,  Lobby, MatchTracker }) => ({
  async [CONSTANTS.STATE_NEW](_lobbyState) {
    await Db.updateLobbyState(_lobbyState)(CONSTANTS.STATE_WAITING_FOR_QUEUE);
    return { ..._lobbyState, state: CONSTANTS.STATE_WAITING_FOR_QUEUE };
  },
  async [CONSTANTS.STATE_WAITING_FOR_QUEUE](_lobbyState) {
    logger.debug(`STATE_WAITING_FOR_QUEUE ${_lobbyState._id}`);
    const lobbyState = this[_lobbyState.queueType](_lobbyState);
    await Db.updateLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_BEGIN_READY](_lobbyState) {
    let lobbyState = { ..._lobbyState };
    logger.debug(`STATE_BEGIN_READY ${_lobbyState._id}`);
    lobbyState = await Fp.pipeP(
      Lobby.assignLobbyName,
      Lobby.assignGameMode
    )(lobbyState);
    logger.debug(`STATE_BEGIN_READY ${lobbyState._id} ${lobbyState.lobbyName}`);
    lobbyState.channel = await Guild.setChannelName(lobbyState.lobbyName)(
      lobbyState.channel
    );
    lobbyState.role = await Guild.setRoleName(lobbyState.lobbyName)(
      lobbyState.role
    );
    await Guild.setChannelViewable(lobbyState.inhouseState.guild)(false)(
      lobbyState.channel
    );
    await Guild.setChannelViewableForRole(lobbyState.inhouseState.adminRole)(
      true
    )(lobbyState.channel);
    await Guild.setChannelViewableForRole(lobbyState.role)(true)(
      lobbyState.channel
    );
    await Lobby.addRoleToPlayers(lobbyState);

    // destroy any accepted challenges for players
    await Lobby.mapPlayers(Db.destroyAllAcceptedChallengeForUser)(lobbyState);

    if (!lobbyState.readyCheckTime) {
      lobbyState.readyCheckTime = Date.now();
    }
    this.registerLobbyTimeout(lobbyState);
    lobbyState.state = CONSTANTS.STATE_CHECKING_READY;

    await Db.updateLobby(lobbyState);
    await this.onCreateLobbyQueue(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_CHECKING_READY](_lobbyState) {
    const lobbyState = { ..._lobbyState };
    const playersNotReady = await Lobby.getNotReadyPlayers()(lobbyState);
    logger.debug(
      `STATE_CHECKING_READY ${lobbyState._id} playersNotReady ${playersNotReady.length}`
    );
    logger.debug(
      `STATE_CHECKING_READY ${lobbyState._id} readyCheckTimeout ${
        lobbyState.inhouseState.readyCheckTimeout
      } elapsed ${Date.now() - lobbyState.readyCheckTime}`
    );
    if (playersNotReady.length === 0) {
      await Lobby.removeLobbyPlayersFromQueues(lobbyState);
      lobbyState.state =
        LobbyStateTransitions[lobbyState.state][lobbyState.queueType];
      this.unregisterLobbyTimeout(lobbyState);
      // this[CONSTANTS.MSG_PLAYERS_READY](lobbyState);
    } else if (Lobby.isReadyCheckTimedOut(lobbyState)) {
      logger.debug(
        `STATE_CHECKING_READY ${lobbyState._id} isReadyCheckTimedOut true`
      );
      await Fp.allPromise(
        playersNotReady.map((player) => {
          logger.debug(
            `STATE_CHECKING_READY ${lobbyState._id} removing player not ready ${player.id}`
          );
          if (lobbyState.captain1UserId === player.id) {
            lobbyState.captain1UserId = null;
          }
          if (lobbyState.captain2UserId === player.id) {
            lobbyState.captain2UserId = null;
          }
          return Fp.allPromise([
            Lobby.removeUserFromQueues(player),
            Lobby.removePlayer(lobbyState,player),
          ]);
        })
      );
      await Lobby.returnPlayersToQueue(lobbyState);
      // this[CONSTANTS.MSG_READY_CHECK_FAILED](lobbyState, playersNotReady);
      lobbyState.state = CONSTANTS.STATE_WAITING_FOR_QUEUE;
      lobbyState.readyCheckTime = null;
    } else {
      logger.debug(
        `STATE_CHECKING_READY ${lobbyState._id} isReadyCheckTimedOut false`
      );
    }
    await Db.updateLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_ASSIGNING_CAPTAINS](_lobbyState) {
    const lobbyState = { ..._lobbyState };
    if (
      lobbyState.captain1UserId == null ||
      lobbyState.captain2UserId == null
    ) {
      const [captain1, captain2] = await Lobby.assignCaptains(lobbyState);
      logger.debug(
        `lobby run assignCaptains captain1 ${!!captain1} captain2 ${!!captain2}`
      );
      lobbyState.captain1UserId = captain1 ? captain1.id : null;
      lobbyState.captain2UserId = captain2 ? captain2.id : null;
      if (captain1 && captain2) {
        lobbyState.state = CONSTANTS.STATE_SELECTION_PRIORITY;
        // this[CONSTANTS.MSG_ASSIGNED_CAPTAINS](lobbyState);
      } else {
        lobbyState.state = CONSTANTS.STATE_AUTOBALANCING;
        // this[CONSTANTS.MSG_AUTOBALANCING](lobbyState);
      }
    } else {
      logger.debug(
        `lobby run assignCaptains captains exist ${lobbyState.captain1UserId}, ${lobbyState.captain2UserId}`
      );
      lobbyState.state = CONSTANTS.STATE_SELECTION_PRIORITY;
      // this[CONSTANTS.MSG_ASSIGNED_CAPTAINS](lobbyState);
    }
    await Db.updateLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_SELECTION_PRIORITY](_lobbyState) {
    const lobbyState = { ..._lobbyState };
    await Lobby.setPlayerFaction(1)(lobbyState)(lobbyState.captain1UserId);
    await Lobby.setPlayerFaction(2)(lobbyState)(lobbyState.captain2UserId);
    if (!lobbyState.playerFirstPick) {
      if (!lobbyState.selectionPriority) {
        lobbyState.selectionPriority = getRandomInt(2) + 1;
        await Db.updateLobby(lobbyState);
      }
      const captain = await Db.findUserById(
        lobbyState[`captain${3 - lobbyState.selectionPriority}UserId`]
      );
      // this[CONSTANTS.MSG_PLAYER_DRAFT_PRIORITY](lobbyState, captain);
    } else if (!lobbyState.firstPick && !lobbyState.radiantFaction) {
      const captain = await Db.findUserById(
        lobbyState[`captain${lobbyState.selectionPriority}UserId`]
      );
      // this[CONSTANTS.MSG_SELECTION_PRIORITY](lobbyState, captain);
    } else if (!lobbyState.firstPick && lobbyState.radiantFaction) {
      const captain = await Db.findUserById(
        lobbyState[`captain${3 - lobbyState.selectionPriority}UserId`]
      );
      // this[CONSTANTS.MSG_SELECTION_PICK](lobbyState, captain);
    } else if (lobbyState.firstPick && !lobbyState.radiantFaction) {
      const captain = await Db.findUserById(
        lobbyState[`captain${3 - lobbyState.selectionPriority}UserId`]
      );
      // this[CONSTANTS.MSG_SELECTION_SIDE](lobbyState, captain);
    } else {
      lobbyState.state = CONSTANTS.STATE_DRAFTING_PLAYERS;
      await Db.updateLobby(lobbyState);
    }
    logger.debug(
      `lobby run STATE_SELECTION_PRIORITY selectionPriority ${lobbyState.selectionPriority} playerFirstPick ${lobbyState.playerFirstPick} first pick ${lobbyState.firstPick} radiantFaction ${lobbyState.radiantFaction}`
    );
    return lobbyState;
  },
  async [CONSTANTS.STATE_DRAFTING_PLAYERS](_lobbyState) {
    const lobbyState = { ..._lobbyState };
    const faction = await Lobby.getDraftingFaction(
      lobbyState.inhouseState.draftOrder
    )(lobbyState);
    const captain = await Lobby.getFactionCaptain(lobbyState)(faction);
    logger.debug(
      `lobby run STATE_DRAFTING_PLAYERS ${faction} ${captain} ${lobbyState.playerFirstPick} ${lobbyState.firstPick} ${lobbyState.radiantFaction}`
    );
    if (captain) {
      // this[CONSTANTS.MSG_DRAFT_TURN](lobbyState, captain);
    } else {
      lobbyState.state = CONSTANTS.STATE_TEAMS_SELECTED;
    }
    await Db.updateLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_AUTOBALANCING](_lobbyState) {
    const lobbyState = { ..._lobbyState };
    const playersNoTeam = await Lobby.getNoFactionPlayers()(lobbyState);
    const unassignedCount = playersNoTeam.length;
    logger.debug(`Autobalancing unassigned count ${unassignedCount}`);
    if (unassignedCount) {
      logger.debug("Autobalancing...");
      const getPlayerRating = Lobby.getPlayerRatingFunction(
        lobbyState.inhouseState.matchmakingSystem
      );
      await Lobby.autoBalanceTeams(getPlayerRating)(lobbyState);
      logger.debug("Autobalancing... done");
    }
    lobbyState.firstPick = getRandomInt(2) + 1;
    lobbyState.radiantFaction = getRandomInt(2) + 1;
    lobbyState.state = CONSTANTS.STATE_TEAMS_SELECTED;
    await Db.updateLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_TEAMS_SELECTED](_lobbyState) {
    const lobbyState = {
      ..._lobbyState,
      state: CONSTANTS.STATE_WAITING_FOR_BOT,
    };
    // this[CONSTANTS.MSG_TEAMS_SELECTED](lobbyState);
    await Db.updateLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_WAITING_FOR_BOT](_lobbyState) {
    let lobbyState = { ..._lobbyState };
    logger.debug(`STATE_WAITING_FOR_BOT ${lobbyState._id} ${lobbyState.botId}`);
    if (lobbyState.botId == null) {
      // const bot = await Db.findUnassignedBot(lobbyState.inhouseState);
      let bot = await Db.findUnassignedBot();
      if(!bot){
        let steamId64=process.env.steamId64
         let accountName=process.env.accountName
         let personaName=process.env.personaName
         let password=process.env.password
        //  let steam_guard_code=process.env.steam_guard_code
        bot = await Db.findOrCreateBot(
          steamId64,
          accountName,
          personaName,
          password,
        ); 
      }

      if (bot) {
        logger.debug(`lobby run findUnassignedBot ${bot.steamId64}`);
        lobbyState.state = CONSTANTS.STATE_BOT_ASSIGNED;
        lobbyState = await Lobby.assignBotToLobby(
          lobbyState,
          bot._id.toString()
        );
      }
    } else {
      lobbyState.state = CONSTANTS.STATE_BOT_ASSIGNED;
    }
    await Db.updateLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_BOT_ASSIGNED](_lobbyState) {
    let lobbyState = { ..._lobbyState };
    if (lobbyState.botId != null) {
      const dotaBot = await this.loadBotById(lobbyState.botId);
      if (dotaBot) {
        // check if bot is in another lobby already
        if (dotaBot.dotaLobbyId && dotaBot.dotaLobbyId.isZero()) {
          // const tickets = await DotaBot.loadDotaBotTickets(dotaBot);
          // check if bot has ticket if needed

          const lobbyOptions = {
            ...lobbyState,
            // leagueid: lobbyState.inhouseState.leagueid,
          };
          try {
            const enterLobbyP = DotaBot.createDotaBotLobby(lobbyOptions)(
              dotaBot
            );
            const inLobby = await enterLobbyP;
            if (inLobby) {
              lobbyState.dotaLobbyId = dotaBot.dotaLobbyId.isZero()
                ? null
                : dotaBot.dotaLobbyId.toString();
              logger.debug(
                `enterLobbyP dotaLobbyId: ${lobbyState.dotaLobbyId}`
              );
              lobbyState.state = CONSTANTS.STATE_BOT_STARTED;
              await Db.updateLobby(lobbyState);
              logger.debug(
                `updateLobby done. ${lobbyState._id} ${lobbyState.state}`
              );
              logger.debug(
                `STATE_BOT_ASSIGNED to STATE_BOT_STARTED ${lobbyState._id} ${lobbyState.state}`
              );
            } else {
              lobbyState.state = CONSTANTS.STATE_WAITING_FOR_BOT;
              lobbyState = await Lobby.unassignBotFromLobby(lobbyState);
            }
          } catch (e) {
            logger.error(e);
            this.removeBot(lobbyState.botId);
            lobbyState.state = CONSTANTS.STATE_BOT_FAILED;
            await Db.updateLobby(lobbyState);
            lobbyState = await Lobby.unassignBotFromLobby(lobbyState);
          }
          return lobbyState;
        } else {
          logger.debug(
            `dotaLobbyId mismatch. lobbyState.dotaLobbyId ${lobbyState.dotaLobbyId} dotaBot.dotaLobbyId ${dotaBot.dotaLobbyId}`
          );
          lobbyState.state = CONSTANTS.STATE_WAITING_FOR_BOT;
          lobbyState = await Lobby.unassignBotFromLobby(lobbyState);
          await Db.updateBotStatusBySteamId(
            CONSTANTS.BOT_IN_LOBBY,
            dotaBot.steamId64
          );
          // this[CONSTANTS.MSG_BOT_UNASSIGNED](lobbyState, "In another lobby.");
        }
      }
      await Db.updateLobby(lobbyState);
      return lobbyState;
    }
    lobbyState.state = CONSTANTS.STATE_WAITING_FOR_BOT;
    await Db.updateLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_BOT_STARTED](_lobbyState) {
    const lobbyState = { ..._lobbyState };
    const dotaBot = this.getBot(lobbyState.botId);
    const players = await Lobby.getPlayers(lobbyState);

    logger.debug(
      `lobby run STATE_BOT_STARTED lobbyState ${util.inspect(
        lobbyState
      )} players ${util.inspect(players)} `
    );
    // dotaBot.teamCache = players.reduce(
    //   Lobby.reducePlayerToTeamCache(lobbyState.radiantFaction),
    //   {}
    // );

    dotaBot.teamCache = players
    // await Lobby.mapPlayers(DotaBot.invitePlayer(dotaBot))(lobbyState);
    lobbyState.players.map(async (e) => await DotaBot.invitePlayer(dotaBot)(e));
    lobbyState.state = CONSTANTS.STATE_WAITING_FOR_PLAYERS;
    await Db.updateLobby(lobbyState);
    // this[CONSTANTS.MSG_LOBBY_INVITES_SENT](lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_BOT_FAILED](_lobbyState) {
    // this[CONSTANTS.MSG_BOT_FAILED](_lobbyState);
    return { ..._lobbyState };
  },
  async [CONSTANTS.STATE_WAITING_FOR_PLAYERS](_lobbyState) {
    const lobbyState = { ..._lobbyState };
    const dotaBot = this.getBot(lobbyState.botId);
    if (dotaBot) {
      if (DotaBot.isDotaLobbyReady(dotaBot.teamCache, dotaBot.playerState)) {
        logger.debug("lobby run isDotaLobbyReady true");
        return this.onStartDotaLobby(lobbyState, dotaBot);
      }
    } else {
      lobbyState.state = CONSTANTS.STATE_WAITING_FOR_PLAYERS;
      await Db.updateLobby(lobbyState);
    }
    return lobbyState;
  },
  [CONSTANTS.STATE_MATCH_IN_PROGRESS]: lobbyStateNoOp,
  [CONSTANTS.STATE_MATCH_ENDED]: lobbyStateNoOp,
  async [CONSTANTS.STATE_MATCH_STATS](_lobbyState) {
    let lobbyState = { ..._lobbyState };
    // await MatchTracker.updatePlayerRatings(lobbyState);
    lobbyState.state = CONSTANTS.STATE_COMPLETED;
    await Db.updateLobby(lobbyState);
    await this.botLeaveLobby(lobbyState);
    lobbyState = await Lobby.unassignBotFromLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_MATCH_NO_STATS](_lobbyState) {
    let lobbyState = { ..._lobbyState };
    lobbyState.state = CONSTANTS.STATE_COMPLETED_NO_STATS;
    await Db.updateLobby(lobbyState);
    await this.botLeaveLobby(lobbyState);
    lobbyState = await Lobby.unassignBotFromLobby(lobbyState);
    return lobbyState;
  },
  async [CONSTANTS.STATE_PENDING_KILL](_lobbyState) {
    let lobbyState = { ..._lobbyState };
    if (lobbyState.botId != null) {
      await this.botLeaveLobby(lobbyState);
      lobbyState = await Lobby.unassignBotFromLobby(lobbyState);
    }
    // if (lobbyState.channel) {
    //   await lobbyState.channel.delete();
    //   lobbyState.channel = null;
    // }
    // if (lobbyState.role) {
    //   await lobbyState.role.delete();
    //   lobbyState.role = null;
    // }
    // await Lobby.removeQueuers(lobbyState);
    // await Lobby.removePlayers(lobbyState);
    // lobbyState.channelId = null;
    // lobbyState.roleId = null;
    let createLobby = false;
    if (
      [
        CONSTANTS.STATE_NEW,
        CONSTANTS.STATE_WAITING_FOR_QUEUE,
        CONSTANTS.STATE_BEGIN_READY,
      ].indexOf(lobbyState.state !== -1)
    ) {
      lobbyState.lobbyName = SnowflakeUtil.generate().toString();
      createLobby = true;
    }
    lobbyState.state = CONSTANTS.STATE_KILLED;
    await Db.updateLobby(lobbyState);
    if (createLobby) {
      await this.onCreateLobbyQueue(lobbyState);
    }
    return lobbyState;
  },
  [CONSTANTS.STATE_KILLED]: lobbyStateNoOp,
  [CONSTANTS.STATE_COMPLETED]: lobbyStateNoOp,
  [CONSTANTS.STATE_COMPLETED_NO_STATS]: lobbyStateNoOp,
  [CONSTANTS.STATE_FAILED]: lobbyStateNoOp,
});

module.exports = {
  LobbyStateTransitions,
  LobbyStateHandlers,
};
