'use strict'

function cleanObject (obj) {
  for (const key in obj) {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  }
  return obj
}

exports = module.exports = cleanObject
