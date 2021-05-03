const Db = require("../../../services/dotaBot").Db;
const lobbyManager = require("../../../services/dotaBot").lobbyManager;
const CONSTANTS = require("../../../services/dotaBot").CONSTANTS;
const Lobby = require("../../../services/dotaBot").Lobby;
const logger = require("../../../services/dotaBot").logger;
var Services = require("../../../services/network");
const dotaLobbyModel = require("../../../models/dotaLobby.model");
const dotaBotModel = require("../../../models/dotaBot.model");
const dotaLobbyPlayerModel = require("../../../models/dotaLobbyPlayer.model");

const _clearLobby = async (req, res, next) => {
  try {
    let flag = Object.keys(lobbyManager.bots);

    let lobbyState = await Db.testFindAllActiveLobbies();

    // lobbyState.forEach(async (e) => {
    //   await lobbyManager[CONSTANTS.EVENT_LOBBY_LEAVE](lobbyState);
    //   //  await lobbyManager.removeBot(lobbyState.botId);
    // });

    if (flag && flag.length) {
      if (lobbyState.length) {
        for (let e of lobbyState) {
          if (flag.indexOf(e.botId) != -1) {
            await lobbyManager[CONSTANTS.EVENT_LOBBY_LEAVE](e);
          }
        }
      }

      for (let e of flag) {
        await lobbyManager.removeBot(e);
      }
    }

    // Object.keys(lobbyManager.bots).forEach(async (e) => {
    //   await lobbyManager.removeBot(e);
    // });

    await dotaLobbyModel.updateMany({}, { state: CONSTANTS.DELETED }).exec();
    await dotaBotModel.updateMany({}, { status: CONSTANTS.DELETED }).exec();

    return Services._response(
      res,
      "Invitation sent. Please open your dota client to play the game",
      "Invitation sent. Please open your dota client to play the game"
    );
  } catch (error) {
    logger.error(error);
    Services._handleError(res, "Error");
  }
};

module.exports = { _clearLobby };
