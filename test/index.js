var assert = require('assert'),
	MongoConsole = require('../index');

describe('MongoConsole', function() {
  describe('#start()', function() {
    it('should start the server', function() {
     	assert.equal(1, MongoConsole.start());
    });
  });
});