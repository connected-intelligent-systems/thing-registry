'use strict'

/**
 * Converts the input value to an array.
 *
 * @param {*} o - The value to be converted to an array.
 * @returns {Array} - The converted array.
 */
function toArray (o) {
  if (Array.isArray(o)) {
    return o
  }
  return [o]
}

exports = module.exports = toArray
