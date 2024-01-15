const express = require('express');
const axios = require('axios');
const redis = require('redis');

const app = express();
const client = redis.createClient(6379);

(async () => {
  client.on('error', (err) => {
    console.log('Redis Client Error', err);
  });
  client.on('ready', () => console.log('Redis is ready'));

  await client.connect();

  await client.ping();


})();

app.get('/', (req, res) => {

  res.send('Hello World!');
});


app.get('/users', async (req, res) => {
  const cacheKey = 'users';
  const data = await client.get(cacheKey);

  if (data != null) {
    // Données en cache disponibles
    res.send(JSON.parse(data));
  } else {
    // Données non disponibles dans le cache, effectuez la requête
    const users = await axios.get('https://jsonplaceholder.typicode.com/users');
    client.setEx(cacheKey, 3600, JSON.stringify(users.data)); // Mettez en cache pendant 1 heure

    res.send(users.data);
  }
});

app.get('/photos', async (req, res) => {
  const cacheKey = 'photos';
  const data = await client.get(cacheKey);

  if (data != null) {
    // Données en cache disponibles
    res.send(JSON.parse(data));
  } else {
    // Données non disponibles dans le cache, effectuez la requête
    const users = await axios.get('https://jsonplaceholder.typicode.com/photos');
    client.setEx(cacheKey, 3600, JSON.stringify(users.data)); // Mettez en cache pendant 1 heure
    res.send(users.data);
  }
});

// add a score with a player name
app.get('/addScore', async (req, res) => {
  const score = req.query.score;
  const player = req.query.player;
  client.ZADD('leaderboard', { score: score, value: player });
  res.send("OK");

});

// return all the player with her score
app.get('/rank', async (req, res) => {
  client.ZRANGE_WITHSCORES('leaderboard', 0, -1).then(function (result) {
    res.send(JSON.stringify(result));
  }).catch((err) => {
    res.send(err)
  });
});

//return the rank of a specific player
app.get('/playerRank', async (req, res) => {
  const player = req.query.player;
  await client.ZRANK('leaderboard', player).then(function (result) {
    console.log(result);
    res.send(JSON.stringify(result));
  }).catch((err) => {
    res.send(err)
  });
});

//return score of a specific player
app.get('/playerScore', async (req, res) => {
  const player = req.query.player;
  await client.ZSCORE('leaderboard', player).then(function (result) {
    console.log(result);
    res.send(JSON.stringify(result));
  }).catch((err) => {
    res.send(err)
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});