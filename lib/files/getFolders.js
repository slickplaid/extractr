'use strict';

module.exports = { getFolders, walk };

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const spawn = child_process.spawn;
const DEFAULT_EXT = ['rar', 'sfc'];
const DEFAULT_PATH = path.resolve('y:/test');
const DEFAULT_7Z = path.resolve('c:/Program Files/7-zip/7z.exe');
const SFV = '.sfv';
const RAR = '.rar';

function getFolders(input, callback) {
  if(typeof callback !== 'function') {
    callback = function(){};
  }

  let options = {};
  options.ext = DEFAULT_EXT;

  // normalize input
  if(typeof input === 'string') {
    // set dir
    options.dir = input;
  }

  if(typeof input === 'object') {
    options.dir = input.dir;
    options.ext = input.ext;
  }

  if(typeof options.dir === 'undefined' || !options.dir) {
    //return callback('No directory specified');
    output.dir = DEFAULT_PATH;
  }

  getRootDirectories(options.dir, callback);
}

function getRootDirectories(dir, callback) {
  if(!dir) {
    dir = DEFAULT_PATH;
  }

  if(typeof callback !== 'function') {
    callback = console.log.bind(console);
  }

  fs.readdir(dir, function(err, list) {
    if(err) {
      return callback(err);
    }

    let results = [];
    let remaining = list.length;

    if(!remaining) {
      return callback(null, results);
    }

    list.forEach(function(file) {
      let _dir = path.resolve(dir, file);

      fs.stat(_dir, function(err, stat) {
        if(stat && stat.isDirectory()) {
            results.push(_dir);
        } else {
          let ext = path.extname(_dir);

          if(ext === SFV) {
            // TODO: SFV validation
          } else if(ext === RAR) {
            extract(_dir, function(err, done) {
              cleanup(_dir, () => console.log('cleanup done'));
            });
          }
        }

        if(!--remaining) {
          return callback(null, results);
        }
      });

    });
  });
}

function cleanup(_file, callback) {
  const dir = path.dirname(_file);
  const ext = path.extname(_file);
  const file = path.basename(_file)
  const replaceRegex = new RegExp(ext+'$');
  const name = file.replace(replaceRegex, '');
  const matchRegex = new RegExp(''+name+'.r\\d\\d$');

  let matches = [];
  fs.readdir(dir, function(err, list) {
    list.forEach((filename) => {
      var match = filename.match(matchRegex);

      if(match) {
        // TODO: Cleanup old *.rar files
        console.log(path.resolve(dir, filename))
      }
    });

    callback();
  });
}

function extract(file, callback) {
  if(typeof callback !== 'function') {
    callback = function(){};
  }
  if(typeof file === 'undefined') {
    return callback('No file to extract');
  }

  file = path.resolve(file);

  const cmd = DEFAULT_7Z;
  const args = ['x', '-aos', file];
  const opts = {
    cwd: path.dirname(file)
  };

  const child = spawn(cmd, args, opts);

  let stdout = '';
  let stderr = '';

  // TODO: detect nested RARs (rar inside rar) and properly handle it

  child.stdout.on('data', function(data) { stdout += data;  console.log(''+data); });
  child.stderr.on('data', function(data) { stderr += data; console.log(''+data); });
  child.on('close', function(code) { console.log('[EXIT]', code);
    callback(null, code, stdout, stderr)
  });
}

function walk(dir, callback) {
  if(!dir) {
    dir = DEFAULT_PATH;
  }

  if(typeof callback !== 'function') {
    callback = console.log.bind(console);
  }

  console.log(dir);
  let results = [];

  fs.readdir(dir, function(err, list) {
    if(err) {
      return callback(err);
    }

    let pending = list.length;

    if(!pending) {
      return callback(null, results);
    }

    list.forEach(function(file) {
      let _dir = path.resolve(dir, file);

      fs.stat(_dir, function(err, stat) {
        if(stat && stat.isDirectory()) {
          console.log('dir', _dir);
          walk(_dir, function(err, res) {
            results = results.concat(res);

            if(!--pending) {
              callback(null, results);
            }
          });
        } else {
          console.log('file', _dir);
          results.push(_dir);

          if(!--pending) {
            callback(null, results);
          }
        }
      });

    })
  });
}
