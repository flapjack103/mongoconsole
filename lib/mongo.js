var mongodb = require('mongodb').MongoClient;
var TAG = 'mongo.js:';

function MongoDB(uri) {
	var self = this;
	this.uri = uri;
	mongodb.connect(uri, function(err, db) {
		if(err) {
			throw new Error(TAG + err + '- Do you have a MongoDB instance running?');
		}
		else {
			self.db = db;
			self.admin = require('mongodb').Admin(self.db);
		}
	});
}

MongoDB.prototype.switchDB = function(dbName, callback) {
	var self = this;
	mongodb.connect(this.uri + '/' + dbName, function(err, db) {
		if(err) {
			callback(err);
		}
		else {
			self.db = db;
			callback(null);
		}
	});
}

MongoDB.prototype.add = function(entry, collection, callback) {
	this.db.collection(collection).save(entry, function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});
};

MongoDB.prototype.remove = function(query, collection, callback) {
	this.db.collection(collection).remove(query, {multi:true}, function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});
};

MongoDB.prototype.update = function(query, update, collection, callback) {
	this.db.collection(collection).update(query, {$set: update}, function(err, result) {
    	if(err) {
    		callback(err, result);
    	}
    	else {
    		callback(null, result);
    	}
	});
};

MongoDB.prototype.find = function(query, collection, callback) {
	this.db.collection(collection).find(query, function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});	
};

MongoDB.prototype.findAll = function(collection, callback) {
	this.db.collection(collection).find({}).toArray(function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});
};

MongoDB.prototype.forEach = function(query, collection, callback) {
	this.db.collection(collection).find(query).forEach(function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});
};

MongoDB.prototype.getCollectionNames = function(callback) {
	this.db.collectionNames(function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});
};

MongoDB.prototype.getDatabaseNames = function(callback) {
	this.admin.listDatabases(function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});
};

MongoDB.prototype.createCollection = function(name, callback) {
	// use strict to prevent overwriting existing collection
	this.db.createCollection(name, {strict:true}, function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});
}

MongoDB.prototype.deleteCollection = function(name, callback) {
	this.db.dropCollection(name, function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});
}

MongoDB.prototype.stats = function(callback) {
	var scale = 1024; // Default to kbs
	this.db.stats(scale, function(err, result) {
		if(err) {
			callback(err, result);
		}
		else {
			callback(null, result);
		}
	});
}

module.exports = MongoDB;