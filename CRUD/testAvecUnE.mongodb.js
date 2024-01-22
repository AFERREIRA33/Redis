use('mflix');
db.users.find();

use('mflix');
var user = db.users.findOne({userName:player})

if (user === null) {
  db.users.insertOne({
    "name": player
  });
}
  