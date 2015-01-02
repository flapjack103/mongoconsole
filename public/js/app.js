var socket = io();
var currCollection = '';

socket.emit('databases', {});
socket.emit('collections', {});

socket.on('collections', function(msg) {
  console.log('Got collection list: ', msg);
  generateCollectionList(msg);
});

socket.on('entries', function(msg) {
  console.log('Got entries for collection');
  if(msg.action == 'display')
    generateEntryTable(msg.results);
  if(msg.action == 'export')
    exportSelection(msg.results);
});

socket.on('databases', function(msg) {
  console.log('Got database list: ', msg);
  generateDatabaseList(msg.databases);
});

socket.on('stats', function(msg) {
  console.log(msg);
  generateStatsContent(msg);
});

socket.on('error', function(msg) {
  $('#errorMessage').html(msg.err);
  $('#errorAlert').show().delay(3000).fadeOut("slow");

});

socket.on('success', function(msg) {
  $('#successMessage').html(msg.ok);
  $('#successAlert').show();
  $('#successAlert').delay(3000).fadeOut("slow");
});

initButtonEvents();

function initButtonEvents() {

  $('#exportModal').on('show.bs.modal', function (event) {
    var rows = $('#table-javascript').bootstrapTable('getSelections');
    console.log('selection:', rows);
    var modal = $(this);
    if(rows.length > 0 && !rows.selector) {
      modal.find('.currentSelectionContent').html('<h4>Number of Selected Rows</h4> ' + rows.length);
    }
    else {
      modal.find('.currentSelectionContent').html('No Rows Selected');
    }

    $('#selection a').click(function (e) {
      e.preventDefault()
      $(this).tab('show')
    });
    $('#collection a').click(function (e) {
      e.preventDefault()
      $(this).tab('show')
    });

  });

  $('#statsModal').on('hidden.bs.modal', function (event) {
    $('#statsContent ul').html('');
  });

  $('#addModal').on('hidden.bs.modal', function (event) {
    $('#addContent').val('');
  });

  $('#analytics').click(function(event) {
    socket.emit('stats', {});
  });
}

function exportSelection(entries) {

  var filename = $('#exportFileName').val() + '.json';
  if(filename == '.json') {
    filename = 'mongoData.json';
  }

  // http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries)));
  pom.setAttribute('download', filename);
  pom.click();

  // Clean up
  $('#exportModal').modal('hide');
  $('#exportFileName').val('');
  $('#table-javascript').bootstrapTable('uncheckAll');

}

function uploadFile() {
  var file = document.getElementById("fileSelection").files[0];
  if (file) {
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
      var fileJSON = evt.target.result;
      try {
        var entries = JSON.parse(fileJSON);
        for(var i = 0; i < entries.length; i++) {
          socket.emit('add', {collection: currCollection, entry:entries[i]});
        }
      }
      catch(e) {
        alert('Not a valid JSON file');
      }
    }
    reader.onerror = function (evt) {
      alert("error reading file");
    }
  }
}

function onCollectionSelect(event) {
  var collectionName = event.target.parentElement.id;
  collectionName = collectionName.replace(/\-/g, '.');
  socket.emit('entries', {action:'display', collection:collectionName});
  $('#collectionTitle').html('\'' + collectionName + '\'' + ' Collection');
  currCollection = collectionName;
}

function generateStatsContent(stats) {
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

function generateDatabaseList(dbs) {

  for(var i = 0; i < dbs.length; i++) {
    var dbItem = '<a href="#" id ="' + dbs[i].name + '"'; 
    dbItem += '<div class="col-xs-6 col-sm-3 placeholder dbLogo"><img src="img/mongodb.png" class="img-responsive" alt="DB icon thumbnail">';
    dbItem += '<h4>' + dbs[i].name + ' database</h4>';
    dbItem += '<span class="text-muted">Size: ' + dbs[i].sizeOnDisk+ '</span></div></a>';
    $('#dbList').append(dbItem);

    // Add click event to change DB
    $('#' + dbs[i].name).click(function(event) {
      var id = event.target.parentElement.id;
      if(id != '' && id != 'dbList') {
        console.log('Switching DB to: ', id);
        socket.emit('switch_db', {dbName:id});
        $('.dbLogo').removeClass('active');
        $('#' + id).addClass('active');
        $('#entryTableDiv').hide();
      }
    });
  }
  $('#admin').addClass('active');
}

function generateCollectionList(collections) {
  var listItem, dropdownItem;

  // Clear our collection list
  $('#collections').html('<li class="active"><a href="">Collections</a></li>');
  // Clear our collection export dropdown
  $('#exportCollectionDropdown').html('');

  // In case we have no collections in the DB
  if(collections.length == 0) {
    listItem = '<li><a href="#">No Collections Available</a></li>';
    $('#collections').append(listItem);
  }

  for(var i = 0; i < collections.length; i++) {

    // Replace '.' with '-' since jQuery doesn't play nice with periods
    var collectionID = collections[i].replace(/\./g, '-');

    // Build our list item
    listItem = '<li id="';
    listItem += collectionID;
    listItem += '"><a href="#">';
    listItem += collections[i];
    listItem += '</a></li>';

    // Append it to the collection list on the side nav
    $('#collections').append(listItem);

    // Make it clickable
    $('#' + collectionID).click(function(event) {
      onCollectionSelect(event);
    });

    // Add our collection as a dropdown option for export
    dropdownItem = '<option value="' + collections[i] + '"">';
    dropdownItem += collections[i];
    dropdownItem += '</option>';
    $('#exportCollectionDropdown').append(dropdownItem);
  }
}

function generateEntryTable(entries) {
  var data = [];

  for(var i = 0; i < entries.length; i++) {
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
  loadBootstrapTable(data);
  $('#entryTableDiv').show();
}

function loadStatsTable(data) {

  // If the table has already been loaded once, simply reload the new data
  if($('#stats-table-javascript').html() != '') {
    $('#stats-table-javascript').bootstrapTable('load', data);
    return;
  }

  // Build the stats table
  $('#stats-table-javascript').bootstrapTable({
    data: data,
    cache: false,
    height: 250,
    showHeader: false,
    minimumCountColumns: 2,
    columns: [{
      field: 'type',
      title: 'Type',
      align: 'right',
      valign: 'center',
      width: 120,
    }, {
      field: 'value',
      title: 'Value',
      align: 'left',
      valign: 'center'
    }]
  });
}

// This is the table for displaying MongoDB collection entries
function loadBootstrapTable(data) {

  // If the table has already been loaded once, simply reload the new data
  if($('#table-javascript').html() != '') {
    console.log('Updating table');
    $('#table-javascript').bootstrapTable('load', data);
    return;
  }

  // Build the collection entries table
  $('#table-javascript').bootstrapTable({
    data: data,
    cache: false,
    height: 500,
    striped: true,
    pagination: true,
    pageSize: 5,
    pageList: [10, 25, 50, 100, 200],
    search: true,
    showColumns: true,
    showRefresh: true,
    toolbar: '#toolbar',
    toolbarAlign: 'right',
    minimumCountColumns: 2,
    clickToSelect: true,
    columns: [{
      field: 'state',
      checkbox: true
    }, {
      field: 'id',
      title: 'Doc ID',
      align: 'right',
      valign: 'center',
      sortable: true, 
      width: 120
    }, {
      field: 'json',
      title: 'JSON',
      align: 'left',
      valign: 'center'
    }, {
      field: 'operate',
      title: 'Item Operate',
      align: 'center',
      valign: 'middle',
      width: 150,
      clickToSelect: false,
      formatter: operateFormatter,
      events: operateEvents
    }]
  });

  $('.icon-refresh').click(function(event) {
    console.log('refreshing');
    socket.emit('entries', {action:'display', collection:currCollection});
  });
}

function operateFormatter(value, row, index) {
  return [
  '<a class="tree ml10" href="#tree-container" title="View JSON Tree">',
  '<i class="glyphicon glyphicon-tree-conifer"></i>',
  '</a>',
  '<a class="edit ml10" href="javascript:void(0)" title="Edit">',
  '<i class="glyphicon glyphicon-edit"></i>',
  '</a>',
  '<a class="remove ml10" href="javascript:void(0)" title="Remove">',
  '<i class="glyphicon glyphicon-remove"></i>',
  '</a>'
  ].join('');
}

window.operateEvents = {
  'click .tree': function (e, value, row, index) {    
    $('#tree-container').html('');
      buildTree(row.json);//, "#tree-container");
$('#tree-container').prepend('<button class="btn btn-default btn-sm" id="expandAll">Expand All</button><button class="btn btn-default btn-sm" id="hideTree">Hide Tree</button>');

$('#expandAll').click(function(event) {

});

$('#hideTree').click(function(event) {
  $('#tree-container').html('');
  $("html, body").animate({ scrollTop: 0 }, "slow");
});
},

'click .edit': function (e, value, row, index) {

  var buttons = '<button class="btn btn-default btn-sm" id="save">Save</button><button class="btn btn-default btn-sm" id="cancel">Cancel</button>';
  var originalJSON = row.json;

  $('#table-javascript').bootstrapTable('hideColumn', 'operate');

  $('#table-javascript').bootstrapTable('updateRow', {
    index: index,
    row: {
      json: '<textarea id="editing">' + row.json + '</textarea>' + buttons
    }
  });

  $('#save').click(function(event) {
    var newJSON = $('#editing').val();
    try {
      var obj = JSON.parse(newJSON);
      socket.emit('edit', {collection: currCollection, id:row.id, json:obj});
      $('#table-javascript').bootstrapTable('updateRow', {
        index: index,
        row: {
          json: JSON.stringify(obj)
        }
      });
    }
    catch(err) {
      alert('Not valid JSON');
      $('#table-javascript').bootstrapTable('updateRow', {
        index: index,
        row: {
          json: originalJSON
        }
      });
    }
    $('#table-javascript').bootstrapTable('showColumn', 'operate');
  });

  $('#cancel').click(function(event) {
   $('#table-javascript').bootstrapTable('updateRow', {
    index: index,
    row: {
      json: originalJSON
    }
  });
   $('#table-javascript').bootstrapTable('showColumn', 'operate');
 });
},
'click .remove': function (e, value, row, index) {
  if(confirm('Are you sure you want to delete this entry?')) {
    socket.emit('delete', {collection:currCollection, id:row.id});
    $('#table-javascript').bootstrapTable('remove', {
      field: 'id',
      values: [row.id]
    });
  }
}
};

$('#saveNew').click(function(event) {
  if($('#addEntry').hasClass('active')) {
    console.log('active text area');
    var newJSON = $('#addContent').val();
    try {
      var obj = JSON.parse(newJSON);
      $('#addContent').val('');
      console.log('add new!');
      socket.emit('add', {collection: currCollection, entry:obj});
    }
    catch(err) {
      alert('Not valid JSON');
    }
  }
  else {
    uploadFile();
  }
});

$('#exportButton').click(function(event) {

   // Determine if we're exporting from selection or collection
   if($('#selectionTab').hasClass('active')){
    var rows = $('#table-javascript').bootstrapTable('getSelections');
    if(rows.length == 0 || rows.selector) {
      alert('Nothing to export');
      return;
    }
    exportSelection(rows);
  }
  else {
    socket.emit('entries', {collection:$('#exportCollectionDropdown').val(), action:'export'});
  }
  
});