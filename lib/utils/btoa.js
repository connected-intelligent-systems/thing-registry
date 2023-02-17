'use strict'

function btoa (str) {
  return Buffer.from(str, 'binary').toString('base64')
}

exports = module.exports = btoa
