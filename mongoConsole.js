var DEFAULT_PORT = 1337;
var DEFAULT_URI = 'mongodb://127.0.0.1:27017';

var express = require('express')
  , path = require('path')
  , app = express()
  , http = require('http').Server(app)
  , mongoDB = require('./lib/mongo')
  , io = require('socket.io')(http)
  , ObjectId = require('mongoose').Types.ObjectId
  , mongo = null;

function MongoConsole(port, uri) {
  mongo = uri ? new mongoDB(uri) : new mongoDB(DEFAULT_URI);
  port = port || DEFAULT_PORT;

  // Start the web server
  http.listen(port, function(){
    console.log("MongoConsole server listening on port " + port);
  });
}

app.configure(function() {
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.bodyParser());
  app.use(app.router);
});

app.get('/', function(req, res) {
  res.render('index.html');
});

app.get('/settings', function(req, res) {
  res.sendfile(__dirname + '/public/settings.html');
});

io.on('connection', function(socket) {

  socket.on('disconnect', function() {
  });
  socket.on('add', function(msg) {
    addEntry(msg);
  });
  socket.on('edit', function(msg) {
    editEntry(msg);
  });
  socket.on('delete', function(msg) {
    deleteEntry(msg);
  });
  socket.on('entries', function(msg) {
    getEntries(msg);
  });
  socket.on('collections', function(msg) {
    getCollections();
  });
  socket.on('databases', function(msg) {
    getDatabases(msg);
  });
  socket.on('switch_db', function(msg) {
    switchDB(msg);
  });
  socket.on('stats', function(msg) {
    getStats();
  });
  socket.on('settings', function(msg) {
    getSettings();
  });
  socket.on('error', function(err) {
    console.log("ERR: ", err);
  });
});

/* WebSocket Request Helper Functions */
function addEntry(msg) {
  console.log(msg);
  mongo.add(msg.entry, msg.collection, function(err, result) {
    if(err) {
      console.log('MONGO ADD ERR: ', err);
    }
    else {
      getEntries({collection:msg.collection});
    }
  });
}

function editEntry(msg) {
  mongo.update({_id: new ObjectId(msg.id)}, msg.json, msg.collection, function(err, result){
    if(err) {
      console.log('MONGO UPDATE ERR: ', err);
    }
    else {
      console.log(result);
    }
  });
}

function deleteEntry(msg) {
  mongo.remove({_id: new ObjectId(msg.id)}, msg.collection, function(err, result) {
    if(err) {
      console.log('MONGO DEL ERR: ', err);
    }
  });
}

function getEntries(msg) {
  mongo.findAll(msg.collection, function(err, results) {
    if(!err) {
      io.emit('entries', results);
    }
    else {
      console.log('MONGO FIND ERR: ', err);
    }
  });
}

function getCollections() {
  mongo.getCollectionNames(function(err, results) {
    if(!err) {
      var collections = [];
      for(var i = 0; i < results.length; i++) {
        collections[i] = results[i].name.split(/\.(.+)?/)[1];
      }
      io.emit('collections', collections);
    }
    else {
      console.log('MONGO COLLECTION NAME ERR: ', err);
    }
  });
}

function getDatabases(msg) {
  mongo.getDatabaseNames(function(err, results) {
    if(!err) {
      console.log('DBs: %j', results);
      io.emit('databases', results);
    }
    else {
      console.log('MONGO GET DBs ERR: ', err);
    }
  });
}

function switchDB(msg) {
  mongo.switchDB(msg.dbName, function(err) {
    if(err){
      console.log('ERR switching to DB ' + msg.dbName + ': ' + err);
    }
    else {
      getCollections();
    }
  });
}

function getStats() {
  mongo.stats(function(err, result){
    if(err) {
      console.log('MONGO GET STATS ERR: ', err);
    }
    io.emit('stats', result);
  });
}

function getSettings() {
  //TODO
}

module.exports = MongoConsole;