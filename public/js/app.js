var socket = io();
var currCollection = '';

socket.emit('collections', {name:'all'});
socket.emit('databases', {});

socket.on('collections', function(msg) {
  console.log('Got collection list: ', msg);
  generateCollectionList(msg);
});

socket.on('entries', function(msg) {
  console.log('Got entries for collection');
  generateEntryTable(msg);
});
  
socket.on('databases', function(msg) {
  console.log('Got database list: ', msg);
  generateDatabaseList(msg.databases);
});

socket.on('stats', function(msg) {
  console.log(msg);
  generateStatsContent(msg);
});

initButtonEvents();

function initButtonEvents() {

  $('#exportModal').on('show.bs.modal', function (event) {
    var modal = $(this)
  });

  $('#statsModal').on('show.bs.modal', function (event) {
    loadStatsTable()
  });

  $('#statsModal').on('hidden.bs.modal', function (e) {
    $('#statsContent ul').html('');
  })

  $('#analytics').click(function(event) {
    socket.emit('stats', {});
  });
}

function exportSelection() {

}

function onCollectionSelect(event) {
  var collectionName = event.target.parentElement.id;
  socket.emit('entries', {collection:collectionName});
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
    console.log('appending');

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

  $('#collections').html('<li class="active"><a href="">Collections</a></li>');

  if(collections.length == 0) {
    listItem = '<li><a href="#">No Collections Available</a></li>';
    $('#collections').append(listItem);
  }

  // Start at 1 to ignore system.indexes
  for(var i = 0; i < collections.length; i++) {
    listItem = '<li id="';
    listItem += collections[i];
    listItem += '"><a href="#">';
    listItem += collections[i];
    listItem += '</a></li>';
    $('#collections').append(listItem);
    $('#' + collections[i]).click(function(event) {
      onCollectionSelect(event);
    });

    dropdownItem = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">';
    dropdownItem += collections[i];
    dropdownItem += '</a></li>';
    $('#exportContent ul').append(dropdownItem);
  }
}

function generateEntryTable(entries) {
  console.log(entries);
  var data = [];
  for(var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var slimEntry = {};

    for (var key in entry) {      
      if (entry.hasOwnProperty(key)) {
        slimEntry[key] = entry[key];
      } 
    }
    delete slimEntry['_id'];
    var json = JSON.stringify(slimEntry);
    data[i] = {id:entry['_id'], json: json};
  }
  loadBootstrapTable(data);
  $('#entryTableDiv').show();
}

function loadStatsTable(data) {
  if($('#stats-table-javascript').html() != '') {
    console.log('Updating table');
    $('#stats-table-javascript').bootstrapTable('load', data);
    return;
  }

  console.log("Loading stats table");
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

function loadBootstrapTable(data) {
  console.log(data);
  if($('#table-javascript').html() != '') {
    console.log('Updating table');
    $('#table-javascript').bootstrapTable('load', data);
    return;
  }

  console.log("Loading bootstrap table");
  $('#table-javascript').bootstrapTable({
    data: data,
    cache: false,
    height: 500,
    striped: true,
    pagination: true,
    pageSize: 3,
    pageList: [10, 25, 50, 100, 200],
    search: true,
    showColumns: true,
    showRefresh: true,
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
}

function operateFormatter(value, row, index) {
  return [
  '<a class="edit ml10" href="javascript:void(0)" title="Edit">',
  '<i class="glyphicon glyphicon-edit"></i>',
  '</a>',
  '<a class="remove ml10" href="javascript:void(0)" title="Remove">',
  '<i class="glyphicon glyphicon-remove"></i>',
  '</a>'
  ].join('');
}

window.operateEvents = {

  'click .edit': function (e, value, row, index) {
    console.log(value, row, index);
    var buttons = '<button class="btn btn-default btn-sm" id="save">Save</button><button class="btn btn-default btn-sm" id="cancel">Cancel</button>';
    var originalJSON = row.json;
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
    });

     $('#cancel').click(function(event) {
         $('#table-javascript').bootstrapTable('updateRow', {
          index: index,
          row: {
            json: originalJSON
          }
        });
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