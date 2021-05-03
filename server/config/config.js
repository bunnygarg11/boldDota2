/**
 * File managing configuration for the application
 * */
const dotenv = require("dotenv");
const fs = require("fs");
const path=require("path")
if (fs.existsSync(path.resolve(process.cwd(), "./.env"))) {
  dotenv.config(path.resolve(process.cwd(), "./.env"));
}

const defaults = {
  MONGO_URI:
    "mongodb+srv://mohit:Bunny@11@cluster0.bcqbn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  steamId64: "76561199139099147",
  accountName: "dynastyesports",
  personaName: "my*****Name",
  password: "St3@mAccountToBu!dlovelyAPI69",
  NODE_ENV: "development",
  STEAM_API_HOST: "api.steampowered.com", // comma separated list of hosts to fetch Steam API data from
  PORT: 3210,
  steam_guard_code: "3DW4R",
  PLAYER_COUNT_FOR_LOBBY: 2,
};
// ensure that process.env has all values in defaults, but prefer the process.env value
Object.keys(defaults).forEach((key) => {
  process.env[key] = key in process.env ? process.env[key] : defaults[key];
});


// now processes can use either process.env or config
module.exports = process.env;
