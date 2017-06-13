var config = require('../config');
var request = config.request;

async function login(email, password) {
  console.log('Logging in...');

  var res = await request
          .post(`${config.host}/users/sign_in`)
          .type('form')
          .send({user : {password, email}})
  
  console.log(`Logged in with ${email}`);
}



module.exports = login;