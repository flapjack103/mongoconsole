function uploadFile() {
  var file = document.getElementById("fileSelection").files[0];
  if (file) {
    // User feedback
    $('#infoAlert').html('Adding docs to collection. Please wait...');
    $('#infoAlert').show();

    // Read the file
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = importFileContents;
    reader.onerror = fileReadError;
  }
}

var importFileContents = function(event) {
  var fileContents = event.target.result;
  var entries = [];
  // First try parsing the whole file as an array of JSON objects
  try {
    entries = JSON.parse(fileContents);
    socket.emit('add', {collection: currCollection, multi:true, entries:entries});
  }
  catch(e) {
    // User error feedback
    $('#infoAlert').hide();
    $('#errorMessage').html('Invalid JSON detected. Please check your file and try again.');
    $('#errorAlert').show().delay(3000).fadeOut("slow");
  }
}

var fileReadError = function(event) {
  alert("Error reading file.");
}

function exportSelectionToFile(entries) {

  var filename = $('#exportFileName').val() + '.json';
  if(filename == '.json') {
    filename = defaultExportFilename;
  }

  // http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries)));
  pom.setAttribute('download', filename);
  pom.click();

  // Clean up
  $('#exportModal').modal('hide');
  $('#exportFileName').val('');
  $('#' + collectionTableID).bootstrapTable('uncheckAll');
}

