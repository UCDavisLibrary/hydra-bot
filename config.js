/**
 * Agent will preserve cookies :)
 */
var request = require('superagent').agent();

module.exports = {
  protocol : 'http://',
  // host : 'a.dams-sandbox.casil.ucdavis.edu',
  host : 'localhost:3000',
  request : request
}