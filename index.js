const express = require("express");
const fetch = require("node-fetch"); // make sure to install node-fetch
const { MongoClient } = require("mongodb");

const app = express();
const client = new MongoClient(process.env.MONGO_URI); // your MongoDB URI
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const discordId = req.query.state; // Discord user ID sent in login link

    if (!code || !discordId) return res.send("Missing code or Discord ID.");

    // Exchange code for tokens
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        redirect_uri: "https://clara.click/callback",
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = data;

    // Store tokens in MongoDB
    await client.connect();
    const db = client.db("spotify_bot");
    await db.collection("users").updateOne(
      { discordId },
      {
        $set: {
          access_token,
          refresh_token,
          expires_at: Date.now() + expires_in * 1000,
        },
      },
      { upsert: true }
    );

    res.send("Spotify connected successfully! You can close this page.");
  } catch (err) {
    console.error(err);
    res.send("Error connecting to Spotify.");
  }
});

module.exports = app;
