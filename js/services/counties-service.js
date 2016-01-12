window.data = window.data || {};

module.exports.fetchAll = function () {

  $.get('/data/counties.json').then(function (data) {

    window.map.fireEvent('dataReceived', {dataType: 'counties', data: data});

  }, function (err) {

    alert('Could not fetch counties JSON.');

  });

};
