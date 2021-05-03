const Db = require("../../../services/dotaBot").Db;
const lobbyManager = require("../../../services/dotaBot").lobbyManager;
const CONSTANTS = require("../../../services/dotaBot").CONSTANTS;
const Lobby = require("../../../services/dotaBot").Lobby;
const logger = require("../../../services/dotaBot").logger;
const dotaLobbyModel = require("../../../models/dotaLobby.model");
const dotaBotModel = require("../../../models/dotaBot.model");
const dotaLobbyPlayerModel = require("../../../models/dotaLobbyPlayer.model");
var Services = require("../../../services/network");

const _bpractice = async (req, res, next) => {
  try {
    // let lobby = await dotaLobbyModel.findOne({
    //   gameMode: "DOTA_GAMEMODE_1V1MID",
    // }).lean(true).exec();
    // let bot = await dotaBotModel.findOne({ status: "BOT_IDLE" }).lean(true).exec();

    // console.log("lobbyState", lobby);

    // console.log("dotaState", bot);

  let flag=Object.keys(lobbyManager.bots)  

  console.log(flag);
  console.log(lobbyManager.bots);

    return Services._response(
      res,
      // { lobby, bot },
      {},
      "Invitation sent. Please open your dota client to play the game"
    );
  } catch (error) {
    logger.error(error);
    Services._handleError(res, "Error");
  }
};

module.exports = { _bpractice };
