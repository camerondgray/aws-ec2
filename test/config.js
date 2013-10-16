var fs = require('fs');
var configFileLocation = 'testConfig.json';
module.exports = JSON.parse(fs.readFileSync(configFileLocation, 'utf-8'));
