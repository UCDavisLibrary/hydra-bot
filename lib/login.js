var config = require('../config');
var request = config.request;

async function login(email, password) {
  console.log(`Logging in... ${config.protocol}${config.host}`);

  var res = await request
          .post(`${config.protocol}${config.host}/users/sign_in`)
          .type('form')
          .send({user : {password, email}})
  
  console.log(`Logged in with ${email}`);
}



module.exports = login;