const readline = require('readline');
const fs = require('fs');

// stupid buffering for 'line' event leaks after .pause() is called.
var rl, onEntry;
var buffer = [];
var paused = false;
var running = false;

function jsonStreamParser(file, next) {
  onEntry = next;

  return new Promise((resolve, reject) => {
    rl = readline.createInterface({
      input: fs.createReadStream(file)
    });

    rl.on('line', (line) => {
      if( !paused ) rl.pause();
      
      buffer.push(line);

      if( !running ) {
        running = true;
        runBuffer();
      }
    });

    rl.on('close', () => { 
      resolve() 
    });
  });
}

function runBuffer() {
  if( buffer.length > 0 ) {
    running = true;
    onEntry(JSON.parse(buffer.splice(0,1)[0]), runBuffer);
  } else {
    running = false;
    paused = false;
    rl.resume();
  }
}

module.exports = jsonStreamParser;