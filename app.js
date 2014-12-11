var PORT = 1337;
var DB_URI = 'mongodb://127.0.0.1:27017';

var express = require('express')
  , path = require('path')
  , app = express()
  , http = require('http').Server(app)
  , mongoDB = require('./mongo')
  , io = require('socket.io')(http);

var ObjectId = require('mongoose').Types.ObjectId;

// Connect to the mongoDB server
var mongo = new mongoDB(DB_URI);

app.configure(function() {
  app.set('port', process.env.PORT || PORT);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.bodyParser());
  app.use(app.router);
});

app.get('/', function(req, res) {
    res.render('index.html');
});

function editEntry(msg) {
  console.log('EDIT %j', msg);
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
  console.log('DELETE %j', msg);
  mongo.remove({_id: new ObjectId(msg.id)}, msg.collection, function(err, result) {
    if(err) {
      console.log('MONGO DEL ERR: ', err);
    }
  });
}

function getEntries(msg) {
  console.log('%j', msg);
  mongo.findAll(msg.collection, function(err, results) {
    if(!err) {
      io.emit('entries', results);
    }
    else {
      console.log('MONGO ERR: ', err);
    }
  });
}

function getCollections() {
  console.log('Getting all collections');
  mongo.getCollectionNames(function(err, results) {
    if(!err) {
      console.log('%j', results);
      var collections = [];
      for(var i = 0; i < results.length; i++) {
        collections[i] = results[i].name.split(/\.(.+)?/)[1];
      }
      io.emit('collections', collections);
    }
    else {
      console.log('MONGO ERR: ', err);
    }
  });
}

function getDatabases(msg) {
  console.log('Getting all db names');
  mongo.getDatabaseNames(function(err, results) {
    if(!err) {
      console.log('DBs: %j', results);
      io.emit('databases', results);
    }
    else {
      console.log('MONGO ERR: ', err);
    }
  });
}

function switchDB(msg) {
  console.log('Switching to db: ', msg.dbName);
  mongo.switchDB(msg.dbName, function(err) {
    if(err){
      console.log('Error switching to DB: ', msg.dbName);
    }
    else {
      getCollections();
    }
  });
}

function getStats() {
  mongo.stats(function(err, result){
    console.log(result);
    io.emit('stats', result);
  });
}

io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
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
/*  socket.on('error', function(err) {
    console.log("SOCKET.IO ERR: ", err);
  });*/
});

// Start the web server
http.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});