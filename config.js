/**
 * Agent will preserve cookies :)
 */
var request = require('superagent').agent();
var usernamePass = require('./username-password');

module.exports = {
  host : 'http://a.dams-sandbox.casil.ucdavis.edu',
  // host : 'http://localhost:3000',
  username : usernamePass.username,
  password : usernamePass.password,
  request : request
}