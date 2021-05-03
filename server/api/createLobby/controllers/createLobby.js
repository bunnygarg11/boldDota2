const Db = require("../../../services/dotaBot").Db;
const lobbyManager = require("../../../services/dotaBot").lobbyManager;
const CONSTANTS = require("../../../services/dotaBot").CONSTANTS;
const Lobby = require("../../../services/dotaBot").Lobby;
const logger = require("../../../services/dotaBot").logger;
var Services = require("../../../services/network");

const _createsteamlobby = async (req, res, next) => {
  //   const db = await coreDB.openDBConnnection();
  try {
    const { steamId = "76561198177128005" } = req.query;

    let lobbyState = await Db.findActiveLobbiesForUser(steamId);

    if (lobbyState && lobbyState.length) {
      return Services._validationError(res, "Already registered for lobby");
    }

    lobbyState = await Db.findPendingLobby();

    if (lobbyState && lobbyState._id) {
      lobbyState = await Db.addPlayer(lobbyState, steamId);
    } else {
      lobbyState = await Db.findOrCreateLobby(steamId);
      // lobbyState = await Fp.pipeP(
      //   Lobby.assignLobbyName,
      //   Lobby.assignGameMode
      // )(lobbyState);
      lobbyState = await Lobby.assignLobbyName(lobbyState);
      lobbyState = await Lobby.assignGameMode(lobbyState);
      await Db.updateLobby(lobbyState);
    }

    if (
      lobbyState.players.length == (process.env.PLAYER_COUNT_FOR_LOBBY || 2)
    ) {
      lobbyState.state = CONSTANTS.STATE_WAITING_FOR_BOT;
      await Db.updateLobby(lobbyState);

      // lobbyManager.runLobby(lobbyState, [CONSTANTS.STATE_WAITING_FOR_BOT]);
      await lobbyManager[CONSTANTS.EVENT_RUN_LOBBY](lobbyState, [
        CONSTANTS.STATE_WAITING_FOR_BOT,
      ]);

      return Services._response(
        res,
        "Invitation sent. Please open your dota client to play the game",
        "Invitation sent. Please open your dota client to play the game"
      );
    }
    return Services._response(
      res,
      "waiting for the other player",
      "waiting for the other player"
    );
  } catch (error) {
    logger.error(error)
    Services._handleError(res, "Error");
  }
};

module.exports = { _createsteamlobby };
