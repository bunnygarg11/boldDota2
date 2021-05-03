var dotaBotModel = require("../../models/dotaBot.model");
var dotaLobbyModel = require("../../models/dotaLobby.model");
var dotaLobbyPlayerModel = require("../../models/dotaLobbyPlayer.model");
const util = require("util");

const logger = require("./logger");
const CONSTANTS = require("./constants");
const { hri } = require("human-readable-ids");

//***********TEST QUERY*************************************************************************************************************************************************************************** */
//***********TEST QUERY*************************************************************************************************************************************************************************** */
//***********TEST QUERY*************************************************************************************************************************************************************************** */

module.exports.updateQuery = () =>
  dotaLobbyModel.findOneAndUpdate(
    { gameMode: "DOTA_GAMEMODE_1V1MID" },
    {
      botId: null,
      state: "STATE_WAITING_FOR_QUEUE",
      $pull: {
        players: "76561198177128005",
      },
    },
    {
      new: true,
    }
  );

module.exports.testFindAllActiveLobbies = () =>
  dotaLobbyModel
    .find({
      state: {
        $in: [
          "STATE_BOT_ASSIGNED",
          "STATE_BOT_CREATED",
          "STATE_BOT_STARTED",
          "STATE_BOT_CONNECTED",
          "STATE_WAITING_FOR_PLAYERS",
          "STATE_MATCH_IN_PROGRESS",
        ],
      },
    })
    .lean(true)
    .exec();

module.exports.testFindActiveBots = () =>
  dotaBotModel
    .find({
      status: {
        $in: [
          "BOT_LOADING",
          "BOT_ONLINE",
          "BOT_IDLE",
          "BOT_IN_LOBBY",
          "BOT_OFFLINE",
          "BOT_FAILED",
        ],
      },
    })
    .lean(true)
    .exec();

//**************TEST QUERY************************************************************************************************************************************************************************ */
//**************TEST QUERY************************************************************************************************************************************************************************ */
//**************TEST QUERY************************************************************************************************************************************************************************ */

//**********************************************************BOT MODEL***************************************************************************************************************************** */
//**********************************************************BOT MODEL***************************************************************************************************************************** */
//**********************************************************BOT MODEL***************************************************************************************************************************** */
module.exports.findOrCreateBot = async (
  steamId64,
  accountName,
  personaName,
  password
) => {
  try {
    let result = await dotaBotModel.create({
      steamId64,
      accountName,
      personaName,
      password,
    });

    logger.debug(
      `DB findOrCreateBot steamId64 ${steamId64} accountName ${accountName} personaName ${personaName} password ${password} --> ${util.inspect(
        result._doc
      )}`
    );

    return result._doc;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.updateBotStatusBySteamId = async (status, steamId64) => {
  try {
    const result = await dotaBotModel
      .findOneAndUpdate(
        {
          steamId64,
        },
        {
          status,
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(
      `DB updateBotStatusBySteamId status ${status} steamId64 ${steamId64}  --> ${util.inspect(
        result
      )}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.updateBotStatus = async (status, _id) => {
  try {
    const result = await dotaBotModel
      .findOneAndUpdate(
        {
          _id,
        },
        {
          status,
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(
      `DB updateBotStatus status ${status} _id ${_id}  --> ${util.inspect(
        result
      )}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findBot = async (_id) => {
  try {
    const result = await dotaBotModel
      .findOne({
        _id,
      })
      .lean(true)
      .exec();
    logger.debug(`DB findBot  _id ${_id}  --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findBotBySteamId64 = async (steamId64) => {
  try {
    const result = await dotaBotModel
      .findOne({
        steamId64,
      })
      .lean(true)
      .exec();
    logger.debug(
      `DB findBotBySteamId64 steamId64 ${steamId64}  --> ${util.inspect(
        result
      )}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findUnassignedBot = async () => {
  try {
    const result = await dotaBotModel
      .findOne({
        status: {
          $in: [CONSTANTS.BOT_OFFLINE, CONSTANTS.BOT_IDLE],
        },
        lobbyCount: {
          $lt: 5,
        },
      })
      .lean(true)
      .exec();
    logger.debug(`DB findUnassignedBot   --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.assignBotToLobby = async (lobby, botId) => {
  try {
    await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id: lobby._id,
        },
        {
          botId,
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    const result = await dotaBotModel
      .findOneAndUpdate(
        {
          _id: botId,
        },
        {
          $inc: {
            lobbyCount: 1,
          },
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(
      `DB assignBotToLobby lobby ${lobby} botId ${botId}  --> ${util.inspect(
        result
      )}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.setAllBotsOffline = async () => {
  try {
    const result = await dotaBotModel.updateMany(
      {
        status: {
          $nin: [CONSTANTS.BOT_OFFLINE,CONSTANTS.DELETED],
        },
      },
      {
        status: CONSTANTS.BOT_OFFLINE,
      }
    );
    logger.debug(`DB setAllBotsOffline  --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.updateBot = async (steamId64, values) => {
  try {
    const result = await dotaBotModel
      .findOneAndUpdate(
        {
          steamId64,
        },
        values,
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(
      `DB updateBot values ${util.inspect(
        values
      )} steamId64 ${steamId64}  --> ${util.inspect(result)}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.destroyBotBySteamID64 = async (steamId64) => {
  try {
    const result = await dotaBotModel.findOneAndDelete({
      steamId64,
    });
    logger.debug(
      `DB destroyBotBySteamID64  steamId64 ${steamId64}  --> ${util.inspect(
        result
      )}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

//**********************************************************LOBBY MODEL***************************************************************************************************************************** */
//**********************************************************LOBBY MODEL***************************************************************************************************************************** */
//**********************************************************LOBBY MODEL***************************************************************************************************************************** */

module.exports.findAllActiveLobbies = async () => {
  try {
    const result = await dotaLobbyModel
      .find({
        state: {
          $nin: [
            CONSTANTS.STATE_COMPLETED,
            CONSTANTS.STATE_COMPLETED_NO_STATS,
            CONSTANTS.STATE_KILLED,
            CONSTANTS.STATE_FAILED,
            CONSTANTS.DELETED,
          ],
        },
      })
      .lean(true)
      .exec();
    logger.debug(`DB findAllActiveLobbies  --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findActiveLobbiesForUser = async (userId) => {
  try {
    const result = await dotaLobbyModel
      .find({
        state: {
          $nin: [
            CONSTANTS.STATE_COMPLETED,
            CONSTANTS.STATE_COMPLETED_NO_STATS,
            CONSTANTS.STATE_KILLED,
            CONSTANTS.STATE_FAILED,
            CONSTANTS.DELETED,
          ],
        },
        players: userId,
      })
      .lean(true)
      .exec();
    logger.debug(
      `DB findActiveLobbiesForUser userId ${userId}  --> ${util.inspect(
        result
      )}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findPendingLobby = async () => {
  try {
    const result = await dotaLobbyModel
      .findOne({
        state: CONSTANTS.STATE_WAITING_FOR_QUEUE,
      })
      .lean(true)
      .exec();
    logger.debug(`DB findPendingLobby  --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findAllInProgressLobbies = async () => {
  try {
    const result = await dotaLobbyModel
      .find({
        state: CONSTANTS.STATE_MATCH_IN_PROGRESS,
      })
      .lean(true)
      .exec();
    logger.debug(`DB findAllInProgressLobbies  --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findLobbyByName = async (lobbyName) => {
  try {
    const result = await dotaLobbyModel
      .findOne({
        lobbyName,
      })
      .lean(true)
      .exec();
    logger.debug(
      `DB findLobbyByName lobbyName ${lobbyName}  --> ${util.inspect(result)}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findLobbyByMatchId = async (matchId) => {
  try {
    const result = await dotaLobbyModel
      .findOne({
        matchId,
      })
      .lean(true)
      .exec();
    logger.debug(
      `DB findLobbyByMatchId matchId ${matchId}   --> ${util.inspect(result)}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findOrCreateLobby = async (player) => {
  try {
    let result = await dotaLobbyModel.create({
      state: CONSTANTS.STATE_WAITING_FOR_QUEUE,
      password: hri.random(),
      // lobbyName,
      players: [player],
    });

    return result._doc;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findLobbyByDotaLobbyId = async (dotaLobbyId) => {
  try {
    const result = await dotaLobbyModel
      .findOne({
        dotaLobbyId,
      })
      .lean(true)
      .exec();
    logger.debug(
      `DB findLobbyByDotaLobbyId dotaLobbyId ${dotaLobbyId}   --> ${util.inspect(
        result
      )}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findLobbyById = async (_id) => {
  try {
    const result = await dotaLobbyModel
      .findOne({
        _id,
      })
      .lean(true)
      .exec();
    logger.debug(`DB findLobbyById _id ${_id}   --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.unassignBotFromLobby = async (lobby, botId) => {
  try {
    await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id: lobby._id,
        },
        {
          botId: null,
          dotaLobbyId: null,
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();

    const result = await dotaBotModel
      .findOneAndUpdate(
        {
          _id: botId,
        },
        {
          $inc: {
            lobbyCount: -1,
          },
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(
      `DB unassignBotFromLobby lobby ${lobby} botId ${botId}  --> ${util.inspect(
        result
      )}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.updateLobbyState = async (lobbyOrState, state) => {
  try {
    const result = await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id: lobbyOrState._id,
        },
        {
          state,
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();

    logger.debug(
      `DB updateLobbyState  state ${state} --> ${util.inspect(result)}`
    );

    // cache.Lobbies.delete(lobbyOrState.id);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.updateLobbyName = async (lobbyOrState, lobbyName) => {
  try {
    const result = await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id: lobbyOrState._id,
        },
        {
          lobbyName,
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();

    logger.debug(
      `DB updateLobbyName  lobbyName ${lobbyName} --> ${util.inspect(result)}`
    );
    // cache.Lobbies.delete(lobbyOrState.id);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.updateLobbyChannel = async (lobbyOrState, channel) => {
  try {
    const result = await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id: lobbyOrState.id,
        },
        {
          channel,
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(
      `DB updateLobbyChannel  channel ${channel} --> ${util.inspect(result)}`
    );

    // cache.Lobbies.delete(lobbyOrState.id);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

// module.exports.updateLobbyState = async (lobbyOrState, state) => {
//   try {
//     const result = await dotaLobbyModel
//       .findOneAndUpdate(
//         {
//           _id: lobbyOrState._id,
//         },
//         {
//           state,
//         },
//         {
//           new: true,
//         }
//       )
//       .lean(true)
//       .exec();

//     // cache.Lobbies.delete(lobbyOrState.id);
//     return result;
//   } catch (err) {
//     logger.error(err);
//     throw err.message;
//   }
// };

module.exports.updateLobbyWinner = async (lobbyOrState, winner) => {
  try {
    const result = await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id: lobbyOrState._id,
        },
        {
          winner,
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();

    logger.debug(
      `DB updateLobbyWinner  winner ${winner} --> ${util.inspect(result)}`
    );

    // cache.Lobbies.delete(lobbyOrState.id);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.updateLobby = async (lobbyOrState) => {
  try {
    const { _id, ...rest } = lobbyOrState;
    const result = await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id,
        },

        rest,

        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(`DB updateLobby  --> ${util.inspect(result)}`);
    // cache.Lobbies.delete(lobbyOrState.id);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.updateLobbyFailed = async (lobbyOrState, failReason) => {
  try {
    const result = await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id: lobbyOrState._id,
        },
        {
          state: CONSTANTS.STATE_FAILED,
          failReason,
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(`DB updateLobbyFailed --> ${util.inspect(result)}`);
    // cache.Lobbies.delete(lobbyOrState.id);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findAllMatchEndedLobbies = async () => {
  try {
    const result = await dotaLobbyModel
      .find({
        state: CONSTANTS.STATE_MATCH_ENDED,
      })
      .lean(true)
      .exec();
    logger.debug(`DB findAllMatchEndedLobbies  --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findAllLobbiesInState = async (state) => {
  try {
    const result = await dotaLobbyModel
      .find({
        state,
      })
      .lean(true)
      .exec();
    logger.debug(
      `DB findAllLobbiesInState state ${state}  --> ${util.inspect(result)}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.getLobbyPlayers = async (lobbyOrState, options) => {
  try {
    let condition = options
      ? {
          _id: lobbyOrState._id,
          ...options,
        }
      : {
          _id: lobbyOrState._id,
        };
    const result = await dotaLobbyModel
      .findOne(condition)
      .select("players")
      .lean(true)
      .exec();
    logger.debug(`DB getLobbyPlayers    --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.addPlayer = async (lobbyOrState, player) => {
  try {
    const result = await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id: lobbyOrState._id,
        },
        {
          $push: {
            players: player,
          },
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(`DB addPlayer  player ${player}  --> ${util.inspect(result)}`);
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.removePlayer = async (lobbyOrState, player) => {
  try {
    const result = await dotaLobbyModel
      .findOneAndUpdate(
        {
          _id: lobbyOrState._id,
        },
        {
          $pull: {
            players: player,
          },
        },
        {
          new: true,
        }
      )
      .lean(true)
      .exec();
    logger.debug(
      `DB removePlayer  player ${player}  --> ${util.inspect(result)}`
    );
    return result;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};

module.exports.findOrCreateLobbyPlayer = async (lobbyPlayer) => {
  try {
    let result = await dotaLobbyPlayerModel
      .findOneAndUpdate(
        {
          lobbyId: lobbyPlayer.lobbyId,
          steamId64: lobbyPlayer.steamId64,
        },
        lobbyPlayer,
        { new: true }
      )
      .lean(true)
      .exec();

    if (result) {
      return result;
    }

    result = await dotaLobbyPlayerModel.create(lobbyPlayer);

    return result._doc;
  } catch (err) {
    logger.error(err);
    throw err.message;
  }
};
