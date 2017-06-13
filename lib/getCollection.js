var config = require('../config');
var request = config.request;


async function getCollection(id) {
  var res = await request
          .get(`${config.host}/collections/${id}.json`)
          .type('form')
  
  return res.body;
}

module.exports = getCollection;