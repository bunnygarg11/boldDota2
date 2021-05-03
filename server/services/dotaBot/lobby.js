const util = require("util");
const Promise = require("bluebird");

const logger = require("./logger");
const shuffle = require("./util/shuffle");
const combinations = require("./util/combinations");
const templateString = require("./util/templateString");
const capitalize = require("./util/capitalize");
const CONSTANTS = require("./constants");
const Db = require("./db");
const Fp = require("./util/fp");

const getLobby = (lobbyOrState) => {
  
  return Db.findLobbyById(lobbyOrState._id);
};

const getPlayers = (lobbyOrState) => Db.getLobbyPlayers(lobbyOrState).then(e=>e.players);

const getPlayerByUserId = (lobbyOrState, id) =>
  Db.getLobbyPlayers(lobbyOrState, { players: id });

const getPlayerBySteamId = (lobbyOrState, steamId64) =>
  Db.getLobbyPlayers(lobbyOrState, { players: steamId64 });

const removePlayer = async (lobbyOrState, user) =>
  Db.removePlayer(lobbyOrState, user);

const unassignBotFromLobby = async (lobbyState) => {
  if (lobbyState.botId) {
    await Db.unassignBotFromLobby(lobbyState,lobbyState.botId);
  }
  return { ...lobbyState, botId: null, dotaLobbyId: null };
};

const assignBotToLobby = async (lobbyState, botId) => {
  await Db.assignBotToLobby(lobbyState, botId);
  return { ...lobbyState, botId };
};

const checkPlayers = async (lobbyState) => {
  const players = await getPlayers(lobbyState);
  if (players.length != (process.env.PLAYER_COUNT_FOR_LOBBY || 2)) {
    return {
      ...lobbyState,
      state: CONSTANTS.STATE_FAILED,
      failReason: `checkPlayers: invalid player count ${players.length}`,
    };
  }
  return { ...lobbyState };
};

const validateLobbyPlayers = async (_lobbyState) => {
  let lobbyState;
  switch (_lobbyState.state) {
    case CONSTANTS.STATE_WAITING_FOR_PLAYERS:
    // falls through
    case CONSTANTS.STATE_BOT_STARTED:
    // falls through
    case CONSTANTS.STATE_BOT_FAILED:
    // falls through
    case CONSTANTS.STATE_BOT_ASSIGNED:
    // falls through
    case CONSTANTS.STATE_WAITING_FOR_BOT:
    // falls through
    case CONSTANTS.STATE_TEAMS_SELECTED:
    // falls through
    case CONSTANTS.STATE_AUTOBALANCING:
    // falls through
    case CONSTANTS.STATE_DRAFTING_PLAYERS:
    // falls through
    case CONSTANTS.STATE_SELECTION_PRIORITY:
    // falls through
    case CONSTANTS.STATE_ASSIGNING_CAPTAINS:
      // remove lobby players and add them back as active queuers
      lobbyState = await checkPlayers(_lobbyState);
      if (lobbyState.state === CONSTANTS.STATE_FAILED) {
        logger.debug(
          `validateLobbyPlayers ${lobbyState._id} failed, returning players to queue`
        );
        lobbyState.state = CONSTANTS.STATE_WAITING_FOR_QUEUE;
        await Db.updateLobby(lobbyState);
      }
      break;
    case CONSTANTS.STATE_CHECKING_READY:
    // falls through
    case CONSTANTS.STATE_BEGIN_READY:
      // remove lobby players and set queuers active
      lobbyState = await checkPlayers(_lobbyState);
      if (lobbyState.state === CONSTANTS.STATE_FAILED) {
        logger.debug(
          `validateLobbyPlayers ${lobbyState._id} failed, returning players to queue`
        );
        // await returnPlayersToQueue(lobbyState);
        lobbyState.state = CONSTANTS.STATE_WAITING_FOR_QUEUE;
        await Db.updateLobby(lobbyState);
      }
      break;
    case CONSTANTS.STATE_WAITING_FOR_QUEUE:
    // falls through
    case CONSTANTS.STATE_NEW:
    // falls through
    default:
      logger.debug(
        `validateLobbyPlayers ${_lobbyState._id} default ${_lobbyState.state}`
      );
      return { ..._lobbyState };
  }
  logger.debug(
    `validateLobbyPlayers ${lobbyState._id} end ${_lobbyState.state} to ${lobbyState.state}`
  );
  return lobbyState;
};

const assignLobbyName = async (lobbyState) => {
  let lobbyName = templateString("Inhouse Lobby ${lobbyId}")({
    lobbyId: lobbyState._id.toString(),
  });
  lobbyName = lobbyName
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^0-9a-z-]/gi, "");
  return { ...lobbyState, lobbyName };
};

const resetLobbyState = async (_lobbyState) => {
  const lobbyState = { ..._lobbyState };
  switch (lobbyState.state) {
    case CONSTANTS.STATE_MATCH_IN_PROGRESS:
      if (!lobbyState.leagueid) {
        lobbyState.state = CONSTANTS.STATE_MATCH_NO_STATS;
        logger.debug(
          `resetLobbyState ${_lobbyState._id} ${_lobbyState.state} to ${lobbyState.state}`
        );
        break;
      }
    // falls through
    case CONSTANTS.STATE_WAITING_FOR_PLAYERS:
    // falls through
    case CONSTANTS.STATE_BOT_STARTED:
      lobbyState.state = CONSTANTS.STATE_WAITING_FOR_BOT;
      logger.debug(
        `resetLobbyState ${_lobbyState._id} ${_lobbyState.state} to ${lobbyState.state}`
      );
      break;
    case CONSTANTS.STATE_CHECKING_READY:
      lobbyState.state = CONSTANTS.STATE_BEGIN_READY;
      logger.debug(
        `resetLobbyState ${_lobbyState._id} ${_lobbyState.state} to ${lobbyState.state}`
      );
      break;
    default:
      lobbyState.state = lobbyState.state || CONSTANTS.STATE_NEW;
      break;
  }
  await Db.updateLobby(lobbyState);
  return lobbyState;
};

const formatNameForLobby = (input) =>
  input.replace(/[^0-9a-z]/gi, "").substring(0, 15);

const assignGameMode = async (lobbyState) => ({
  ...lobbyState,
  gameMode: CONSTANTS.DOTA_GAMEMODE_1V1MID,
});

const addPlayer = (lobbyOrState, player) => Db.addPlayer(lobbyOrState, player);
const updateLobbyPlayerBySteamId = async(data, lobbyOrState, steamId64) => {
  // if (lobbyOrState.players.indexOf(steamId64==-1)){return false}
   return await Db.findOrCreateLobbyPlayer({
      ...data,
      lobbyId: lobbyOrState._id,
      steamId64,
      lobbyName: lobbyOrState.lobbyName,
    });
};
module.exports = {
  
  updateLobbyPlayerBySteamId,
  getLobby,
  getPlayers,
  getPlayerByUserId,
  getPlayerBySteamId,
  // getPlayerByDiscordId,
  // getNoFactionPlayers,
  // getFaction1Players,
  // getFaction2Players,
  // getRadiantPlayers,
  // getDirePlayers,
  // getNotReadyPlayers,
  // getReadyPlayers,
  // mapPlayers,
  addPlayer,
  removePlayer,
  // updateLobbyPlayer,
  // updateLobbyPlayerBySteamId,
  // setPlayerReady,
  // setPlayerFaction,
  // sortQueuersAsc,
  // getQueuers,
  // getActiveQueuers,
  // getQueuerByUserId,
  // getQueuerBySteamId,
  // getQueuerByDiscordId,
  // mapQueuers,
  // mapActiveQueuers,
  // hasQueuer,
  // hasActiveQueuer,
  // addQueuer,
  // removeQueuer,
  // addQueuers,
  // addRoleToQueuers,
  // updateLobbyQueuer,
  // updateLobbyQueuerBySteamId,
  // setQueuerActive,
  // removeUserFromQueues,
  // removeQueuers,
  // removePlayers,
  // lobbyQueuerToPlayer,
  // returnPlayerToQueue,
  // returnPlayersToQueue,
  // isUserInGuild,
  // cleanMissingPlayers,
  // cleanMissingQueuers,
  checkPlayers,
  validateLobbyPlayers,
  // calcBalanceTeams,
  // setTeams,
  // getPlayerRatingFunction,
  // selectCaptainPairFromTiers,
  // sortPlayersByCaptainPriority,
  // roleToCaptainPriority,
  // getCaptainPriorityFromRoles,
  // playerToCaptainPriority,
  // getPlayersWithCaptainPriority,
  // getActiveQueuersWithCaptainPriority,
  // checkQueueForCaptains,
  // assignCaptains,
  // calcDefaultGameMode,
  // autoBalanceTeams,
  assignGameMode,
  // getDraftingFaction,
  // getFactionCaptain,
  // isPlayerDraftable,
  // isCaptain,
  // isFactionCaptain,
  formatNameForLobby,
  // getLobbyNameFromCaptains,
  resetLobbyState,
  // createChallengeLobby,
  // forceLobbyDraft,
  // removeLobbyPlayersFromQueues,
  assignLobbyName,
  // reducePlayerToTeamCache,
  // createLobbyStateMessage,
  // setLobbyTopic,
  assignBotToLobby,
  unassignBotFromLobby,
};
