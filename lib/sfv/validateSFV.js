module.exports = validateSFV;

const fs = require('fs');
const path = require('path');

function validateSFV(file, callback) {
  fs.exists(file, function(err, ok) {
    if(err || !file) {
      return callback('SFV not found: '+ (err || file));
    }

  });
}
