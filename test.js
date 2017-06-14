const path = require('path');
const login = require('./lib/login');
const config = require('./config');
const addWork = require('./lib/addWork');

var count = 0;
var batchSize = 5;

async function addWorks(){
  var jsonStreamParser = require('./lib/jsonStreamParser');

  await jsonStreamParser(
    './data/a:0100.json.stream', batchSize,
    async (entries, next) => {

      console.time('Batch time');

      var files = [path.join(__dirname, 'data/cat.jpg')];

      console.log('Adding Entries '+count+' to '+(count+entries.length));

      await Promise
        .all(entries.map(async entry => await addEntry(entry, files)))
        .then(() => {
          console.timeEnd('Batch time');
          console.log();
          count += entries.length;
          next();
        });

      

    }
  );
}

async function addEntry(entry, files) {
  console.time('Total Work Time '+entry.identifier);
  entry.admin_set_id = 'eeb29628-40e2-4f7e-ac3d-9ab891d699a8';
  // entry.admin_set_id = '6294e459-2909-49de-9039-0937492d00b8';
  await addWork(entry, files);

  console.timeEnd('Total Work Time '+entry.identifier);

}

(async function(){
  try {
    await login(config.username, config.password);
    await addWorks();
    console.log('done');

  } catch(e) {
    console.error('Error');
    console.log(e.message);
  }
})()