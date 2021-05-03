let mongoose = require("mongoose");
const mongooseHistory = require("mongoose-history");

let Schema = mongoose.Schema;

let dotalobby = new Schema({
  // queueType: {
  //   // allowNull: false,
  //   type: String,
  // },

  lobbyName: {
    // allowNull: false,
    type: String,
  },

  // roleId: String,

  dotaLobbyId: String,

  password: String,

  readyCheckTime: Date,

  state: {
    // allowNull: false,
    type: String,
    defaultValue: "STATE_NEW",
  },

  gameMode: {
    // allowNull: false,
    type: String,
    default: "DOTA_GAMEMODE_1V1MID",
  },

  matchId: String,

  // selectionPriority: {
  //   // allowNull: false,
  //   type: Number,
  //   default: 0,
  // },

  // playerFirstPick: {
  //   // allowNull: false,
  //   type: Number,
  //   default: 0,
  // },

  // firstPick: {
  //   // allowNull: false,
  //   type: Number,
  //   default: 0,
  // },

  // radiantFaction: {
  //   // allowNull: false,
  //   type: Number,
  //   default: 0,
  // },

  winner: {
    // allowNull: false,
    type: Number,
    default: 0,
  },

  failReason: String,

  startedAt: Date,

  finishedAt: Date,

  valveData: Object,

  odotaData: Object,

  botId: {
    type: Schema.Types.ObjectId,
    ref: "dotabot",
    // unique: true,
  },

  players: [{ type: String }],

  // *****************************************//
  //   name: { type: String, required: true },
  //   slug: { type: String, required: true, unique: true },
  //   isTournamentAllowed: { type: Boolean },
  //   logo: { type: String, required: true },
  //   image: { type: String },
  //   activeTournament: { type: String, default: 0 },
  //   bracketTypes: { type: Schema.Types.Mixed },
  //   status: { type: Number, default: 1 },
  //   order: { type: Number, required: true, default: 0 },
  //   platforms: { type: Schema.Types.Mixed },
  //   platform: [
  //     {
  //       type: mongoose.Schema.ObjectId,
  //       ref: "platform",
  //     },
  //   ],
  //   createdBy: { type: String, required: true },
  //   updatedBy: { type: String },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
});

// dotalobby.plugin(mongooseHistory);

module.exports = mongoose.model("dotalobby", dotalobby);
