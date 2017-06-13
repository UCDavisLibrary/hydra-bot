const path = require('path');
const login = require('./lib/login');
const config = require('./config');
const addWork = require('./lib/addWork');

async function addWorks(){
  var jsonStreamParser = require('./lib/jsonStreamParser');

  await jsonStreamParser(
    './data/a:0100.json.stream', 
    async (entry, next) => {
      try {
        var files = [path.join(__dirname, 'data/cat.jpg')];
        console.log(files);

        console.time('Total Work Time '+entry.identifier);
        // entry.admin_set_id = 'ef288949-2bee-4f3e-855c-5ccb48fe7c74';
        entry.admin_set_id = '6294e459-2909-49de-9039-0937492d00b8';
        await addWork(entry, files);

        console.log(`Added: ${entry.identifier}`);
        console.timeEnd('Total Work Time '+entry.identifier);
        console.log('');

        next();
      } catch(e) {
        throw e;
      }
      
    }
  );
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