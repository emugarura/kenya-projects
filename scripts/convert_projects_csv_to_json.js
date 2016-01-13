var fs = require('fs');
var csv = require('csv');
var moment = require('moment');

var columns = [
"id",
"EPGeoName",
"location1_EProMIS",
"location",
"ward",
"constituency",
"county",
"projectCostYearlyBreakdown",
"totalProjectCost",
"approvalDate",
"startDatePlanned",
"startDateActual",
"endDatePlanned",
"endDateActual",
"duration",
"durationMonths",
"title",
"description",
"objectives",
"ngProgramme",
"vision2030FlagshipMinistry",
"vision2030FlagshipProjectProgramme",
"implementingAgency",
"implementationStatus",
"mtefSector",
"workPlanProgress"
];

var parser = csv.parse({columns: columns}, function(err, data) {

  for (var i=0; i<data.length; i++) {
    data[i]['location'] = data[i]['location'].replace(/\(/, '').replace(/\)/, '');

    var bits = data[i]['location'].split(/, /);

    if (bits) {
      data[i]['lat'] = bits[0];
      data[i]['lng'] = bits[1];
    }

    if (data[i]['endDatePlanned']) {
      data[i]['endDatePlanned'] = moment(data[i]['endDatePlanned'], 'MM/DD/YYYY hh:mm:ss aa');
    }

    if (data[i]['endDateActual']) {
      data[i]['endDateActual'] = moment(data[i]['endDateActual'], 'MM/DD/YYYY hh:mm:ss aa');
    }

    data[i]['totalProjectCost'] = parseFloat(data[i]['totalProjectCost']);

    delete data[i]['EPGeoName'];
    delete data[i]['location1_EProMIS'];
    delete data[i]['projectCostYearlyBreakdown'];
    delete data[i]['approvalDate'];
    delete data[i]['startDatePlanned'];
    delete data[i]['startDateActual'];
    delete data[i]['duration'];
    delete data[i]['durationMonths'];
    delete data[i]['ngProgramme'];
    delete data[i]['vision2030FlagshipMinistry'];
    delete data[i]['vision2030FlagshipProjectProgramme'];
    delete data[i]['implementingAgency'];
    delete data[i]['implementationStatus'];
    delete data[i]['mtefSector'];
    delete data[i]['workPlanProgress'];
  }

  data = { projects: data };
  console.log(JSON.stringify(data));
});

/*
 *parser.on('readable', function(){
 *  while(data = parser.read()){
 *    transformer.write(data);
 *  }
 *});
 */

process.stdin.pipe(parser);
