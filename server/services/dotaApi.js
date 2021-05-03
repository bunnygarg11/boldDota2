const heroes = require("dotaconstants/build/heroes.json");
const itemIds = require("dotaconstants/build/item_ids.json");
const items = require("dotaconstants/build/items.json");
const Long = require("long");

const axios = require("axios").default;
const dotaApiKey =
  process.env.DOTA2_API_KEY ||
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI5NDUxNTZjMC1jMzZmLTAxMzgtOTQ0OC0xOTdlNDVlMjM0OWUiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNTk3NzQ4MjY5LCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6InZpa3JhbS1zaW5naC1tIn0.SXbOzb34VkRbQIUEn_A14qyMfubvjszTQBKcckxbjds";

const dotaApiKeyavailable = process.env.DOTA_API_KEY_AVAILABLE;

process.env.REACT_APP_IMAGE_CDN =
  process.env.REACT_APP_IMAGE_CDN || "https://steamcdn-a.akamaihd.net";

const baseconfig = {
  baseURL: "https://api.opendota.com/api/",
  timeout: 5000,
  headers: {
    "Accept-Encoding": "gzip",
  },
};

if (dotaApiKeyavailable) {
  baseconfig.headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip",
    Authorization: `Bearer ${dotaApiKey}`,
  };
}

const AxiosInstance = axios.create(baseconfig);

module.exports.getProfileByGamerId = (gamerId) => {
  let config = {
    method: "get",
    url: `players/${gamerId}`,
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getBymatchId = (matchId) => {
  let config = {
    method: "get",
    url: `matches/${matchId}`,
    // headers: {
    //   Accept: "application/json",
    //   "Content-Type": "application/json",
    //   Authorization: `Bearer ${dotaApiKey}`,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getPlayerMatches = (gamerId) => {
  let config = {
    method: "get",
    // url: `//api.opendota.com/api/matches/${matchId}`,
    url: `players/${gamerId}/recentMatches`,
    // headers: {
    //   Accept: "application/json",
    //   "Content-Type": "application/json",
    //   Authorization: `Bearer ${dotaApiKey}`,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        // throw new Error(error.response);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getHeroes = (gamerId) => {
  let config = {
    method: "get",
    url: `players/${gamerId}/heroes`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode:23,
    //   lobby_type:0,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.searchBypersonname = (personname) => {
  let config = {
    method: "get",
    // url: `players/${gamerId}/heroes`,
    url: "search",
    // url:
    //   "//api.opendota.com/api/players/<integer>/heroes?limit=<integer>&offset=<integer>&win=<integer>&patch=<integer>&game_mode=<integer>&lobby_type=<integer>&region=<integer>&date=<integer>&lane_role=<integer>&hero_id=<integer>&is_radiant=<integer>&included_account_id=<integer>&excluded_account_id=<integer>&with_hero_id=<integer>&against_hero_id=<integer>&significant=<integer>&having=<integer>&sort=<string>",
    // headers: {
    //   Accept: "application/json",
    //   "Content-Type": "application/json",
    //   Authorization: `Bearer ${dotaApiKey}`,
    // },
    params: {
      q: personname,
    },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getLive = () => {
  let config = {
    method: "get",
    // url: `players/${gamerId}/heroes`,
    // url: "search",
    url: "live",
    // url:
    //   "//api.opendota.com/api/players/<integer>/heroes?limit=<integer>&offset=<integer>&win=<integer>&patch=<integer>&game_mode=<integer>&lobby_type=<integer>&region=<integer>&date=<integer>&lane_role=<integer>&hero_id=<integer>&is_radiant=<integer>&included_account_id=<integer>&excluded_account_id=<integer>&with_hero_id=<integer>&against_hero_id=<integer>&significant=<integer>&having=<integer>&sort=<string>",
    // headers: {
    //   Accept: "application/json",
    //   "Content-Type": "application/json",
    //   Authorization: `Bearer ${dotaApiKey}`,
    // },
    // params: {
    //   q: personname,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getPlayerStats = (gamerId) => {
  let config = {
    method: "get",
    url: `players/${gamerId}/wl`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getPlayerPeers = (gamerId) => {
  let config = {
    method: "get",
    url: `players/${gamerId}/peers`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.proPlayersPlayedWith = (gamerId) => {
  let config = {
    method: "get",
    url: `players/${gamerId}/pros`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.aggOnBasisOfCat = (gamerId) => {
  let config = {
    method: "get",
    url: `players/${gamerId}/totals`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getPlayerRatings = (gamerId) => {
  let config = {
    method: "get",
    url: `players/${gamerId}/ratings`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getPlayerHistograms = (gamerId, field = "kills") => {
  let config = {
    method: "get",
    url: `players/${gamerId}/histograms/${field}`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getPlayerHeroesRanking = (gamerId) => {
  let config = {
    method: "get",
    url: `players/${gamerId}/rankings`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

//**************************************************************************************** */
//**************************************************************************************** */
//*******************TEAMS API********************************************************************* */
//********************TEAMS API******************************************************************** */
//*********************TEAMS API******************************************************************* */
//**********************TEAMS API****************************************************************** */

module.exports.getAllTeams = () => {
  let config = {
    method: "get",
    url: `teams`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getTeamDetails = (teamId) => {
  let config = {
    method: "get",
    url: `teams/${teamId}`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getTeamMatches = (teamId) => {
  let config = {
    method: "get",
    url: `teams/${teamId}/matches`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getTeamPlayers = (teamId) => {
  let config = {
    method: "get",
    url: `teams/${teamId}/players`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getTeamHeroes = (teamId) => {
  let config = {
    method: "get",
    url: `teams/${teamId}/heroes`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getAllLeagues = () => {
  let config = {
    method: "get",
    url: `leagues`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getConstants = (resource) => {
  let config = {
    method: "get",
    url: `constants/${resource}`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getAllHeroes = () => {
  let config = {
    method: "get",
    url: `heroes`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getHeroesMatches = (heroId) => {
  let config = {
    method: "get",
    url: `heroes/${heroId}/matches`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getHeroesMatchups = (heroId) => {
  let config = {
    method: "get",
    url: `heroes/${heroId}/matchups`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

module.exports.getHeroesPlayers = (heroId) => {
  let config = {
    method: "get",
    url: `heroes/${heroId}/players`,

    // params: {
    //   limit: 12345,
    //   offset: 12345,
    //   win: 12345,
    //   patch: 12345,
    //   game_mode,
    //   lobby_type,
    //   region,
    //   date,
    //   lane_role,
    //   hero_id,
    //   is_radiant,
    // },
  };

  return AxiosInstance(config)
    .then((resp) => resp.data)
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        return error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an AxiosInstance of XMLHttpRequest in the browser and an AxiosInstance of
        // http.ClientRequest in node.js
        console.log(error.request);
        return error.request;
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
        return error.message;
      }
      //   console.log(error.config);
    });
};

//********************************* */

//*********************DOTA UTILS******************************************************************* */
//**********************DOTA UTILS****************************************************************** */

module.exports.getHeroImage = (heroId) => {
  let hero = heroes[heroId] || false;
  if (hero) {
    return {
      heroImage: process.env.REACT_APP_IMAGE_CDN + hero.img,
      heroName: hero.localized_name,
    };
  }
};

module.exports.getHeroIcon = (heroId) => {
  let hero = heroes[heroId] || false;
  if (hero) {
    return {
      heroImage: process.env.REACT_APP_IMAGE_CDN + hero.icon,
      heroName: hero.localized_name,
    };
  }
};

module.exports.getItemImage = (itemId) => {
  let item = itemIds[itemId] ? items[itemIds[itemId]] : false;

  if (item) {
    return {
      itemImage: process.env.REACT_APP_IMAGE_CDN + item.img,
      itemName: item.dname,
    };
  }
};

module.exports.getGameMode = (gamemodeid) => {
  let strings = {
    game_mode_0: "Unknown",
    game_mode_1: "All Pick",
    game_mode_2: "Captains Mode",
    game_mode_3: "Random Draft",
    game_mode_4: "Single Draft",
    game_mode_5: "All Random",
    game_mode_6: "Intro",
    game_mode_7: "Diretide",
    game_mode_8: "Reverse Captains Mode",
    game_mode_9: "The Greeviling",
    game_mode_10: "Tutorial",
    game_mode_11: "Mid Only",
    game_mode_12: "Least Played",
    game_mode_13: "Limited Heroes",
    game_mode_14: "Compendium",
    game_mode_15: "Custom",
    game_mode_16: "Captains Draft",
    game_mode_17: "Balanced Draft",
    game_mode_18: "Ability Draft",
    game_mode_19: "Event",
    game_mode_20: "All Random Deathmatch",
    game_mode_21: "1v1 Solo Mid",
    game_mode_22: "All Draft",
    game_mode_23: "Turbo",
    game_mode_24: "Mutation",
  };
  if (gamemodeid) {
    return strings[`game_mode_${gamemodeid}`];
  }
};

module.exports.convert64to32 = (id) => {
  return Long.fromString(id).subtract("76561197960265728").toString();
};

module.exports.convert32to64 = (id) => {
  return Long.fromString(id).add("76561197960265728").toString();
};
