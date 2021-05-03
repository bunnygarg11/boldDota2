var path = require("path");
const express = require("express");
const cors = require("cors");
// var compression = require("compression");
require("dotenv").config(path.resolve(process.cwd(), "./.env"));



var Services = require("./services/network");
// require("./config").config;
require("./config").db();
const port = process.env.PORT || 3210;

const app = express();

app.use(cors());
// app.use(compression());

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

require("./routes")(app);
// require("./api/user/controllers/blobby1")
// require("./api/user/controllers/blobby11")
// require("./api/user/controllers/blobby111");

app.all("*", function (req, res) {
  return Services._validationError(res, "Page not found", "Page not found");
});

app.use((err, req, res, next) => {
  return Services._handleError(res, err, err.message);
});

app.listen(port, () => {
  console.log("Server is running at port " + port);
});
exports = module.exports = app;
