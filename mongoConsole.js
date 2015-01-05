var DEFAULT_PORT = 1337;
var DEFAULT_URI = 'mongodb://127.0.0.1:27017';

var express = require('express')
  , path = require('path')
  , app = express()
  , http = require('http').Server(app)
  , mongoDB = require('./lib/mongo')
  , io = require('socket.io')(http)
  , ObjectId = require('mongoose').Types.ObjectId
  , mongoURI = null;

function MongoConsole(port, uri) {
  mongoURI = uri ? uri : DEFAULT_URI;
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

  // Start a new connection to mongoDB instance per mongoconsole connection
  socket.mongo = new mongoDB(mongoURI);

  socket.on('disconnect', function() {
  });
  socket.on('add', function(msg) {
    addEntry(msg, socket);
  });
  socket.on('edit', function(msg) {
    editEntry(msg, socket);
  });
  socket.on('delete', function(msg) {
    deleteEntry(msg, socket);
  });
  socket.on('entries', function(msg) {
    getEntries(msg, socket);
  });
  socket.on('collections', function(msg) {
    getCollections(socket);
  });
  socket.on('databases', function(msg) {
    getDatabases(msg, socket);
  });
  socket.on('switch_db', function(msg) {
    switchDB(msg, socket);
  });
  socket.on('stats', function(msg) {
    getStats(socket);
  });
  socket.on('new_collection', function(msg) {
    addCollection(msg, socket);
  });
  socket.on('drop_collection', function(msg) {
    deleteCollection(msg, socket);
  })
  socket.on('settings', function(msg) {
    getSettings(socket);
  });
  socket.on('error', function(err) {
    console.log("ERR: ", err);
    socket.emit('err', {err:"Connection Error"});
  });
});

/* WebSocket Request Helper Functions */
function addEntry(msg, socket) {
  socket.mongo.add(msg.entry, msg.collection, function(err, result) {
    if(err) {
      console.log('MONGO ADD ERR: ', err);
      socket.emit('err', {err:"Add Error: " + err});
    }
    else {
      socket.emit('success', {ok:'Successfully added doc(s) to ' + msg.collection + ' collection.'});
      getEntries({collection:msg.collection, action:'display'}, socket);
    }
  });
}

function editEntry(msg, socket) {
  socket.mongo.update({_id: new ObjectId(msg.id)}, msg.json, msg.collection, function(err, result){
    if(err) {
      console.log('MONGO UPDATE ERR: ', err);
      socket.emit('err', {err:"Update Error: " + err});
    }
  });
}

function deleteEntry(msg, socket) {
  socket.mongo.remove({_id: new ObjectId(msg.id)}, msg.collection, function(err, result) {
    if(err) {
      console.log('MONGO DEL ERR: ', err);
      socket.emit('err', {err:"Delete Error: " + err});
    }
    if(result === 0) {
      socket.emit('err', {err:"Error removing doc " + msg.id + " from " + msg.collection + " collection"});
    }
  });
}

function getEntries(msg, socket) {
  socket.mongo.findAll(msg.collection, function(err, results) {
    if(!err) {
      socket.emit('entries', {action:msg.action, results:results});
    }
    else {
      console.log('MONGO FIND ERR: ', err);
      socket.emit('err', {err:"Fetch Error: " + err});
    }
  });
}

function getCollections(socket) {  
  socket.mongo.getCollectionNames(function(err, results) {
    if(!err) {
      var collections = [];
      for(var i = 0; i < results.length; i++) {
        collections[i] = results[i].name.split(/\.(.+)?/)[1];
      }
      socket.emit('collections', collections);
    }
    else {
      console.log('MONGO GET COLLECTIONS ERR: ', err);
    }
  });
}

function getDatabases(msg, socket) {
  socket.mongo.getDatabaseNames(function(err, results) {
    if(!err) {
      socket.emit('databases', results);
    }
    else {
      console.log('MONGO GET DBs ERR: ', err);
    }
  });
}

function switchDB(msg, socket) {
  socket.mongo.switchDB(msg.dbName, function(err) {
    if(err){
      console.log('ERR switching to DB ' + msg.dbName + ': ' + err);
    }
    else {
      getCollections(socket);
    }
  });
}

function getStats(socket) {
  socket.mongo.stats(function(err, result){
    if(err) {
      console.log('MONGO GET STATS ERR: ', err);
    }
    socket.emit('stats', result);
  });
}

function addCollection(msg, socket) {
  socket.mongo.createCollection(msg.name, function(err, result) {
    if(err) {
      socket.emit('err', {err:"Error creating collection: " + err});
    }
    else {
      socket.emit('success', {ok:"Created " + msg.name + " collection"});
      getCollections(socket);
      broadcastCollectionUpdate(socket);
    }
  });
}

function deleteCollection(msg, socket) {
  socket.mongo.deleteCollection(msg.name, function(err, result) {
    if(err) {
      socket.emit('err', {err:"Error removing collection: " + err});
    }
    else {
      socket.emit('success', {ok:"Dropped " + msg.name + " collection"});
      getCollections(socket);
      broadcastCollectionUpdate(socket);
    }
  });
}

function getSettings(socket) {
  //TODO
}

function broadcastCollectionUpdate(socket) {
  socket.mongo.getCollectionNames(function(err, results) {
    if(!err) {
      var collections = [];
      for(var i = 0; i < results.length; i++) {
        collections[i] = results[i].name.split(/\.(.+)?/)[1];
      }
      io.emit('collections', collections);
    }
    else {
      console.log('MONGO GET COLLECTIONS ERR: ', err);
    }
  });
}

module.exports = MongoConsole;