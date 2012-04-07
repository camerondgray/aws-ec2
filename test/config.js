var fs = require('fs');
var configFileLocation = './test/testConfig.json';
module.exports = JSON.parse(fs.readFileSync(configFileLocation, 'utf-8'));
