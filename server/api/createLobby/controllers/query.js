const Db = require("../../../services/dotaBot").Db;
const CONSTANTS = require("../../../services/dotaBot").CONSTANTS;
var Services = require("../../../services/network");


const _bupdateQuery = async (req, res, next) => {
  //   const db = await coreDB.openDBConnnection();
  try {
    const { steamId = "76561198177128005" } = req.query;

    let lobbyState = await Db.updateQuery();

   


   

      
    
    return Services._response(
      res,
      lobbyState,
      "waiting for the other player"
    );
  } catch (error) {
    logger.error(error);
    Services._handleError(res, "Error");
  }
};

module.exports = { _bupdateQuery };