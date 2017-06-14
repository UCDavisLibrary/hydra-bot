const appRoot = '../../';

const path = require('path');
const fs = require('fs');
const url = require('url');
const readline = require('readline');

var config = require(appRoot+'config');
const login = require(appRoot+'lib/login');
const addWork = require(appRoot+'lib/addWork');
const jsonStreamParser = require(appRoot+'lib/jsonStreamParser');

var errors = [];
var count = 0;

async function addWorks(){
  await jsonStreamParser(config.file, config.batchSize, addEntries);
  return errors;
}

async function addEntries(entries, next) {
  console.time('Batch time');
  console.log('Adding Entries '+count+' to '+(count+entries.length));
  
  var fileInfo = path.parse(config.file);
  for( var i = 0; i < entries.length; i++ ) {
    entries[i].file = entries[i].file.map((file) => {
      if( file[0] === '/' ) {
        return file;
      }
      return path.resolve(fileInfo.dir, file);
    });
  }

  await Promise
    .all(entries.map(async entry => await addEntry(entry, entry.file, errors)))
    .then(() => {
      console.timeEnd('Batch time');
      console.log();
      count += entries.length;
      next();
    });
}

async function addEntry(entry, files, errors) {
  entry.admin_set_id = config.adminSetId;
  await addWork(entry, files, errors);
}

function run(args){
  if( !args.file ) {
    console.error('You must provide a json stream file');
    process.exit(-1);
  }

  if( args.file[0] !== '/' ) {
    args.file = path.resolve(process.cwd(), args.file);
  }

  if( !fs.existsSync(args.file) ) {
    console.error('Invalid json stream file: '+args.file+'. Does not exist.');
    process.exit(-1);
  }

  var parsedUrl = url.parse(args.host);
  if( parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:' ) {
    if( parsedUrl.protocol === 'https:' ) {
      args.protocol = 'https://';
    }
    args.host = parsedUrl.host;
  }

  if( args.passwordPrompt ) {
    var read = require('read')
    read({ prompt: 'Enter Password: ', silent: true }, function(er, password) {
      args.password = password;
      args.p = password;

      onReady(args);
    });
  } else {
    onReady(args);
  }
}

async function onReady(args) {
  config = Object.assign(config, args);

  console.log(`
*** BATCH UPLOAD ***
 - Server:        ${config.protocol}${config.host}
 - Username:      ${config.username}
 - JSON File:     ${config.file}
 - Batch Size:    ${config.batchSize}
 - Admin Set Id:  ${config.adminSetId}
`);

  try {
    var errors = await verifyFilePaths(config.file);
    if( errors.length > 0 ) {
      writeErrors(errors);
      console.error('File location errors in JSON file.\nErrors dumped to batch-upload-errors.json');
      process.exit(-1);
    }

    await login(config.username, config.password);
    errors = await addWorks();
    if( errors.length > 0 ) {
      writeErrors(errors);
      console.error('There were errors adding works.\nErrors dumped to batch-upload-errors.json');
      process.exit(-1);
    }

    console.log('Done.');
  } catch(e) {
    console.error('\n*** Error ***');
    console.error(e.message);
    console.error(e.stack);
  }
}

function writeErrors(errors) {
  if( fs.existsSync('batch-upload-errors.json') ) {
    fs.unlinkSync('batch-upload-errors.json');
  }

  fs.writeFileSync('batch-upload-errors.json', '');
  errors.forEach((error) => {
    fs.appendFileSync('batch-upload-errors.json', JSON.stringify(error)+'\n');
  });
}

function verifyFilePaths(file) {
  var fileInfo = path.parse(file);

  return new Promise((resolve, reject) => {
    let errors = [], entry, i;

    rl = readline.createInterface({
      input: fs.createReadStream(file)
    });

    rl.on('line', (line) => {
      entry = JSON.parse(line);
      
      if( !entry.file ) {
        errors.push({
          id : entry.identifier,
          message : 'No File Provided'
        });
        return;
      }

      entry.file.forEach((file) => {
        if( file[0] != '/' ) file = path.resolve(fileInfo.dir, file);
        if( !fs.existsSync(file) ) {
          errors.push({
            id : entry.identifier,
            message : 'File Does Not Exist',
            file : file
          });
        }
      });
    });

    rl.on('close', () => resolve(errors));
  });
}


module.exports = run;