function switchToDB(name) {
  if(name != '' && name != 'dbList') {
    socket.emit('switch_db', {dbName:name});
    makeDBActive(name);
  }
}

function makeDBActive(name) {
  $('.dbLogo').removeClass('active');
  $('#' + name).addClass('active');
  $('#table').hide();
}

function makeCollectionActive(name) {
  // Hide the table until reload
  $('#table').hide();

  // Show loading message
  $('#infoAlert').html('Loading table. Please wait...');
  $('#infoAlert').show();

  collectionName = name.replace(/\-/g, '.');
  socket.emit('entries', {action:'display', collection:collectionName});
  currCollection = collectionName;

  $('#collectionTitle').html('\'' + collectionName + '\'' + ' Collection');
}

function createNewCollection(name) {
 if(name) {
    if(name.indexOf(' ') > 0) {
      $('#errorMessage').html("Collection name cannot contain spaces.");
      $('#errorAlert').show().delay(3000).fadeOut("slow");
    }
    else {
      socket.emit('new_collection', {name:name});
    }
  }
  else {
    $('#newCollection').remove();
    $('#addNewCollection').show();
  }
}

function dropCollection(name) {
  collectionName = name.replace(/\-/g, '.');
  socket.emit('drop_collection', {name:collectionName});
  $('#table').hide();
}

function addCollectionToDropdown(name, dropdownElement) {
  var dropdownItem = '<option value="' + name + '"">';
  dropdownItem += name;
  dropdownItem += '</option>';
  $('#' + dropdownElement).append(dropdownItem);
}

function clearCollections() {
  // Clear our collection export dropdown
  $('#exportCollectionDropdown').html('');

  // Clear our collection list
  $('#collections').html('<li class="active"><a href="">Collections</a></li>');

  // Add our link to create a new collection
  var addNewCollectionHTML = '<li id="addNewCollection"><a href="#">Add Collection<i class="list-item-add glyphicon glyphicon-plus"></i></a></li>';
  $('#collections').append(addNewCollectionHTML);
  $('#addNewCollection').click(addNewCollection);
}

function populateStatsTable(stats) {
  var data = [];
  var i = 0;
  for (var key in stats) {      
    if (stats.hasOwnProperty(key)) {
      data[i]= {type:key, value:stats[key]};
      i++;
    } 
  }
  // Ignore the last two stats
  data.pop();
  data.pop();

  loadStatsTable(data);
}

function populateCollectionTable(entries) {
  var data = [];
  var len = entries.length;
  for(var i = 0; i < len; i++) {
    var entry = entries[i];
    var slimEntry = {};

    for (var key in entry) {
      // Only get the properties of the entry itself      
      if (entry.hasOwnProperty(key)) {
        slimEntry[key] = entry[key];
      } 
    }

    // Move the _id property to the upper level of the entry's JSON
    delete slimEntry['_id'];
    data[i] = {id:entry['_id'], json: JSON.stringify(slimEntry)};
  }

  // Populate and show the table
  loadCollectionTable(data);
  $('#infoAlert').hide();
  $('#table').show();
  smoothScroll($('#table'));
}

function generateDatabaseList(dbs) {

  var len = dbs.length;

  for(var i = 0; i < len; i++) {
    var db = dbs[i];
    var dbSize = convertSize(db.sizeOnDisk); // Convert this to human readable
    var dbItem = '<a href="#" id ="' + db.name + '"'; 
    dbItem += '<div class="col-xs-6 col-sm-3 placeholder dbLogo">';
    dbItem += '<img src="img/mongodb.png" class="img-responsive" alt="DB icon thumbnail">';
    dbItem += '<h4>' + db.name + ' database</h4>';
    dbItem += '<span class="text-muted">Size: ' + dbSize;
    dbItem += db.empty ? ' (empty) </span></div></a>' : '</span></div></a>';
    $('#dbList').append(dbItem);

    // Add click event to change DB
    $('#' + db.name).click(function(event) {
      switchToDB(event.target.parentElement.id);
    });
  }

  // Default DB is 'admin'
  makeDBActive('admin');
}


function generateCollectionList(collections) {
  var listItem, dropdownItem;

  clearCollections();

  // In case we have no collections in the DB
  if(collections.length == 0) {
    listItem = '<li><a href="#">No Collections Available</a></li>';
    $('#collections').append(listItem);
  }

  var len = collections.length;
  for(var i = 0; i < len; i++) {
    var collection = collections[i];
    var collectionID = createSafeID(collection);

    // Build our list item
    listItem = '<li id="';
    listItem += collectionID;
    listItem += '"><a href="#table">'; //scroll down to table
    listItem += collection;
    listItem += '<i id="' + collectionID + '-del';
    listItem += '" class="list-item-delete glyphicon glyphicon-remove-circle"></i></a></li>';

    // Append it to the collection list on the side nav
    $('#collections').append(listItem);

    // Make it clickable
    $('#' + collectionID).click(function(event) {
      makeCollectionActive(event.target.parentElement.id);
    });

    $('#' + collectionID + '-del').click(function(event) {
      event.stopPropagation();
      dropCollection(event.target.parentElement.parentElement.id);
    });

    // Add our collection as a dropdown option for export
    addCollectionToDropdown(collection, 'exportCollectionDropdown');
  }
}

/***** Event Handlers *****/
var addDocsToCollection = function() {
  if($('#addEntry').hasClass('active')) {
    var newJSON = $('#addContent').val();
    try {
      var obj = JSON.parse(newJSON);
      if(obj.length === undefined) {
        socket.emit('add', {collection: currCollection, multi:false, entry:obj});
      }
      else {
        socket.emit('add', {collection: currCollection, multi:true, entries:obj});
      }

      $('#addContent').val('');
    }
    catch(err) {
      alert('Not valid JSON');
    }
  }
  else {
    uploadFile();
  }
}

var exportDocsToFile = function() {
  // Determine if we're exporting from selection or collection
  if($('#selectionTab').hasClass('active')){
    var rows = $('#' + collectionTableID).bootstrapTable('getSelections');
    if(rows.length == 0 || rows.selector) {
      alert('Nothing to export');
    }
    else {
      exportSelectionToFile(rows);
    }
  }
  else {
    // Request contents of entire collection
    var selectedCollection = $('#exportCollectionDropdown').val();
    socket.emit('entries', {collection:selectedCollection, action:'export'});
  }
}

var removeDocsFromCollection = function() {
  var rows = $('#' + collectionTableID).bootstrapTable('getSelections');
  var len = rows.length;
  if(len === 0 || rows.selector) {
    return;
  }

  if(confirm('Are you sure you want to delete these ' + len + ' entries?')) {
    for(var i = 0; i < len; i++) {
      var row = rows[i];
      socket.emit('delete', {collection:currCollection, id:row.id});
      deleteRow(collectionTableID, row);
    }
  }
}

var addNewCollection = function() {
  $('#addNewCollection').hide();
  var newCollectionInput = '<li id="newCollection"><input class="nav-item" type="text"></input></li>';
  $('#collections li:eq(1)').before(newCollectionInput);
  $('#newCollection input').focus();

  // Remove input if we focus out
  $('#newCollection input').blur(function() {
    this.remove();
    $('#addNewCollection').show();
  });

  // Trigger add on enter keypress
  $('#newCollection input').keypress(function(event) {
    if(event.which == 13) {
      var name = $('#newCollection input').val();
      createNewCollection(name);
    }
  });
}

var initExportModal = function() {
  var rows = $('#' + collectionTableID).bootstrapTable('getSelections');
  var modal = $(this);

  // Indicate how many rows have been selected for export
  if(rows.length > 0 && !rows.selector)
    modal.find('.currentSelectionContent').html('<h4>Number of Selected Rows</h4> ' + rows.length);
  else 
    modal.find('.currentSelectionContent').html('No Rows Selected');

  // Switch between export tabs
  $('#selection a').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  });
  $('#collection a').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  });
}