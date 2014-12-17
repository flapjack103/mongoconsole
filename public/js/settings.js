var socket = io();

socket.emit('settings', {});

socket.on('settings', function(msg) {
	console.log('Got settings for DB');
	generateSettingsView(msg);
});