var MongoConsole = require('./mongoConsole');

module.exports = {
	start: function(URI, port) {
		new MongoConsole(URI, port);
	}
}
new MongoConsole();
