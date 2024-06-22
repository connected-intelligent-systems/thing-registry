'use strict'

/**
 * Retrieves the types from the given thing description
 * @param {Object} description - The thing description.
 * @returns {Array} - An array of types.
 */
function getTypes (description) {
  if (description['@type'] !== undefined) {
    if (Array.isArray(description['@type'])) {
      return description['@type']
    }
    return [description['@type']]
  }
}

exports = module.exports = {
  getTypes
}
