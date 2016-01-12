window.data = window.data || {};

module.exports.fetchAll = function () {

  $.get('/data/projects.json').then(function (data) {

    window.map.fireEvent('dataReceived', {dataType: 'projects', data: data.projects});

  }, function (err) {

    alert('Could not fetch projects JSON.');

  });

};
