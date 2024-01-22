const express = require('express');
const axios = require('axios');
const redis = require('redis');
const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: String
});

const Player = mongoose.model('Player', PlayerSchema);

const app = express();
const client = redis.createClient(6379);


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

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

app.get('/AddPlayer', async (req, res) => {
  try {
    // Vérifie si le joueur existe déjà
    var existingPlayer = await Player.findOne({ "name": req.query.player });

    if (existingPlayer) {
      // Si le joueur existe déjà, renvoie un message approprié
      res.send(existingPlayer);
    } else {
      // Si le joueur n'existe pas, crée un nouveau joueur et l'enregistre
      const newPlayer = new Player({ "name": req.query.player });
      await newPlayer.save();



      // Envoie la liste des joueurs en réponse
      res.send("Player " + req.query.player + " was added");
    }
  } catch (error) {
    // Gère les erreurs éventuelles
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/GetAllPlayer', async (req,res)=>{

  var listPlayer = await Player.find();
  res.send(listPlayer);
})

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


app.get('/AddPlayer', async (req, res) => {
  const player = req.query.player;

  use('mflix');
  var user = db.users.findOne({ userName: player })

  if (user === null) {
    db.users.insertOne({
      "name": player
    });
  }
});



app.listen(3000, () => {
  console.log('Server is running on port 3000');
});