#! /usr/bin/env node --max-old-space-size=6144

var argv = require('yargs')
  .usage(require('./logo')+'\n$ hydra-bot [cmd]')
  .demandCommand(1)
  .command(
    'batch-upload [options] file', 
    'Batch upload works from JSON file.  File should have one JSON entry per line.',
    {
      username: {
        alias: 'u',
        demandOption: true,
        describe: 'Your Hydra Username',
        type : 'string'
      },
      password: {
        alias: 'p',
        describe: 'Your Hydra password',
        type : 'string'
      },
      'password-prompt': {
        alias: 'P',
        describe: 'Prompt for password',
        type : 'boolean'
      },
      'host' : {
        alias: 'h',
        demandOption: true,
        describe: 'Hydra instance host url',
        type : 'string'
      },
      'admin-set-id' : {
        alias: 'i',
        demandOption: true,
        describe: 'Admin set to add works to',
        type : 'string'
      },
      'batch-size' : {
        alias: 'b',
        default: 10,
        describe: 'How many files to add in parallel',
        type : 'number'
      }
    }
  )
  .fail(function (msg, err, yargs) {
    if (err) throw err // preserve stack
    console.error('Badness :(\n');
    console.error(msg)
    console.error('Try:\n', yargs.help())
    process.exit(1)
  })
  .help()
  .argv;

console.log(require('./logo'));

var cmd = argv._[0];
switch(cmd) {
  case 'batch-upload':
    require('./cmds/batchUpload')(argv);
    break;
  default:
    console.error(`Invalid command: ${cmd}`);
}