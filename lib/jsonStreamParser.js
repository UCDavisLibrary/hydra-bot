const readline = require('readline');
const fs = require('fs');

// stupid buffering for 'line' event leaks after .pause() is called.
var rl, run;
var buffer = [], batchSize;
var paused = false;
var running = false;

function jsonStreamParser(file, size=10, next) {
  batchSize = size;
  run = next;

  return new Promise((resolve, reject) => {
    rl = readline.createInterface({
      input: fs.createReadStream(file)
    });

    rl.on('line', (line) => {
      buffer.push(JSON.parse(line));

      if( buffer.length >= batchSize && !paused ) {
        paused = true;
        rl.pause();
      }
      
      if( buffer.length >= batchSize && !running ) {
        running = true;
        run(buffer.splice(0, batchSize), runBatch);
      }
    });

    rl.on('close', () => {
      if( buffer.length > 0 ) {
        run(buffer, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

function runBatch() {
  if( buffer.length >= batchSize ) {
    run(buffer.splice(0, batchSize), runBatch);
  } else {
    running = false;
    paused = false;
    rl.resume();
  }
}

module.exports = jsonStreamParser;