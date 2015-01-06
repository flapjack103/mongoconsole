MongoConsole
============

A web UI for interacting with MongoDB. 

## Installation

```shell
  npm install mongoconsole
```

## Usage

```js
  var MongoConsole = require('mongoconsole')

  // Starts webserver on port 1337, using local mongodb uri 'mongodb://127.0.0.1:27017'
  MongoConsole.start();

  // Or specify URI and port on which to run the webserver
  MongoConsole.start('mongodb://127.0.0.1:27017', 8001);

  // Now go to http://localhost:<port> to interact with your mongodb instances
```

## Release History

* 0.1.0 Initial release

* 0.1.3 Bug Fix and Feature Additions
	* Added stable dependency requirements
	* Can now delete multiple docs at once
	* Added 'about' info and disclaimer
	* Fixed refresh when adding new docs to collection

* 0.1.4 Feature Additions
  * Added error and success alerts
  * Delete and Add for collections
  * Support for multiple users (one db connection per user)