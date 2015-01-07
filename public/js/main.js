// Initialize the websocket
socket = io();

// Define websocket handlers
socket.on('collections', function(msg) {
  generateCollectionList(msg);
});

socket.on('entries', function(msg) {
  if(msg.action == 'display') {
    populateCollectionTable(msg.results);
  }
  if(msg.action == 'export') {
    exportSelectionToFile(msg.results);
  }
});

socket.on('databases', function(msg) {
  generateDatabaseList(msg.databases);
});

socket.on('stats', function(msg) {
  populateStatsTable(msg);
});

socket.on('err', function(msg) {
  $('#errorMessage').html(msg.err);
  $('#errorAlert').show().delay(3000).fadeOut("slow");

});

socket.on('success', function(msg) {
  if($('#infoAlert').is(":visible")) {
    $('#infoAlert').html(msg.ok + " Loading table. Please wait...");
  }
  else {
    $('#successMessage').html(msg.ok);
    $('#successAlert').show().delay(3000).fadeOut("slow");
  }
});

// Bind all other event handlers
$('#exportModal').on('show.bs.modal', initExportModal); 

$('#statsModal').on('hidden.bs.modal', function (event) {
	$('#statsContent ul').html('');
});

$('#addModal').on('hidden.bs.modal', function (event) {
	$('#addContent').val('');
});

$('#stats').click(function(event) {
	socket.emit('stats', {});
});

$('#saveNew').click(addDocsToCollection);

$('#exportButton').click(exportDocsToFile);

$('#deleteButton').click(removeDocsFromCollection);

$('#textAreaAddTab').click(function(event) {
  $('#saveNew').html('Add');
});

$('#importFileTab').click(function(event) {
  $('#saveNew').html('Import');
});

$('#addNewCollection').click(addNewCollection);

// Query server for all dbs and collections
socket.emit('databases', {});
socket.emit('collections', {});