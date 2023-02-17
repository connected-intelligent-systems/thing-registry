'use strict'

function toArray (o) {
  if (Array.isArray(o)) {
    return o
  }
  return [o]
}

exports = module.exports = toArray
