const express = require("express");
const app = express();

app.get("/callback", (req, res) => {
  const code = req.query.code;
  res.send(`Spotify code received: ${code}`);
});

module.exports = app;
