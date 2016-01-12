var fs = require('fs');
var csv = require('csv');

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
