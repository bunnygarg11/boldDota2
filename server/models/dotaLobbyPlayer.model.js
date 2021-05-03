let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const paginate = require("mongoose-paginate-v2");

let dotaLobbyPlayer = new Schema({
  win: {
    type: Boolean,
    default: false,
  },
  lose: {
    // allowNull: false,
    type: Boolean,
    default: false,
  },
  heroId: {
    // allowNull: false,
    type: Number,
    default: -1,
  },
  kills: {
    // allowNull: false,
    type: Number,
    default: 0,
  },
  deaths: {
    // allowNull: false,
    type: Number,
    default: 0,
  },
  assists: {
    // allowNull: false,
    type: Number,
    default: 0,
  },
  gpm: {
    // allowNull: false,
    type: Number,
    default: 0,
  },
  xpm: {
    // allowNull: false,
    type: Number,
    default: 0,
  },

  lobbyId: {
    type: Schema.Types.ObjectId,
    ref: "dotaLobby",
  },

  steamId64: String,
  lobbyName: String,

  /*************************************************************/
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

dotaLobbyPlayer.plugin(paginate);

module.exports = mongoose.model("dotaLobbyPlayer", dotaLobbyPlayer);
