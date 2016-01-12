var infoControl = L.control({position: 'topright'});

infoControl.update = function (e) {
  var project = e ? e.project : undefined;
  
  this._div.innerHTML =  (project ?
    '<h4>' + (project.title ? project.title : 'Project in ' + project.constituency) + '</h4>' +
      (project.description ? '<p>' + project.description + '</p>' : '<p>No Description</p>') +
      (project.objectives ? '<h5>Objectives</h5><p>' + project.objectives + '</p>' : '') 
  : '<h4>Donor and Government Funded Projects in Kenya</h4>');
};

infoControl.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info project-info');

  window.map.on('showProjectDetails', infoControl.update.bind(this));

  infoControl.update();

  return this._div;
};

module.exports = infoControl;
