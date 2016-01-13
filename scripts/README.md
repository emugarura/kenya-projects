convert_projects_csv_to_json.js
===============================

Script to convert Kenya projects CSV format to standard JSONAPI format.

Example usage:

  $ tail -n +2 ../data/Donor_and_Government_funded_projects_map_2013_-_2015.csv  | node convert_projects_csv_to_json.js | jsonlint > ../data/projects.json

See also:
--------

http://jsonapi.org/

