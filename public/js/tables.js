
function loadStatsTable(data) {

  // If the table has already been loaded once, simply reload the new data
  if(tableExists(statsTableID)) {
    $('#' + statsTableID).bootstrapTable('load', data);
    return;
  }

  // Build the stats table
  $('#' + statsTableID).bootstrapTable({
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
function loadCollectionTable(data) {

  // If the table has already been loaded once, simply reload the new data
  if(tableExists(collectionTableID)) {
    $('#' + collectionTableID).bootstrapTable('load', data);
    return;
  }

  // Build the collection entries table
  $('#' + collectionTableID).bootstrapTable({
    data: data,
    cache: false,
    height: 500,
    striped: true,
    pagination: true,
    pageSize: 10,
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

/***** Row Operation Handlers *****/
window.operateEvents = {
  'click .tree': function (e, value, row, index) {

    $('#tree-container').html('');
    buildTree(row.json);

    $('#tree-container').prepend('<button class="btn btn-default btn-sm" id="expandAll">Expand All</button><button class="btn btn-default btn-sm" id="hideTree">Hide Tree</button>');

    $('#expandAll').click(function(event) {
      //TODO
    });

    $('#hideTree').click(function(event) {
      $('#tree-container').html('');
      $("html, body").animate({ scrollTop: 0 }, "slow");
    });
  },

  'click .edit': function (e, value, row, index) {

    var buttons = '<button class="btn btn-default btn-sm" id="save">Save</button><button class="btn btn-default btn-sm" id="cancel">Cancel</button>';
    var originalJSON = row.json;
    var editHTML = '<textarea id="editing">' + originalJSON + '</textarea>' + buttons;

    // Add a textarea to the row for editing and hide column operations 
    $('#table-javascript').bootstrapTable('hideColumn', 'operate');
    updateTableRow(collectionTableID, index, editHTML);

    $('#save').click(function(event) {
      var newJSON = $('#editing').val();
      saveEdit(row, index, newJSON, originalJSON);
    });

    $('#cancel').click(function(event) {
      updateTableRow(collectionTableID, index, originalJSON);
      $('#table-javascript').bootstrapTable('showColumn', 'operate');
   });
  },

  'click .remove': function (e, value, row, index) {
    if(confirm('Are you sure you want to delete this entry?')) {
      socket.emit('delete', {collection:currCollection, id:row.id});
      deleteRow(collectionTableID, row);
    }
  }
};


/****** Table Methods *******/

function tableExists(tableID) {
  return $('#' + tableID).is(':empty') ? false : true;
}

function deleteRow(tableID, row) {
 $('#' + tableID).bootstrapTable('remove', {
      field: 'id',
      values: [row.id]
  });
}

function updateTableRow(tableID, index, content) {
  $('#' + tableID).bootstrapTable('updateRow', {
    index: index,
    row: {
      json: content
    }
  });
}

function saveEdit(row, index, newContent, originalContent) {
  try {
    var obj = JSON.parse(newContent);
    socket.emit('edit', {collection: currCollection, id:row.id, json:obj});
    updateTableRow(collectionTableID, index, JSON.stringify(obj));
  }
  catch(err) {
    alert('Not valid JSON');
    updateTableRow(collectionTableID, index, originalContent);
  }
  $('#' + collectionTableID).bootstrapTable('showColumn', 'operate');
}