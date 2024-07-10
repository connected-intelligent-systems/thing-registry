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

/**
 * Removes type annotations from an object recursively.
 * @param {Object} obj - The object from which to remove type annotations.
 * @param {number} [depth=0] - The current depth of recursion (used internally).
 * @returns {void}
 */
function removeTypeAnnotations(obj, depth = 0) {
  for (let key in obj) {
    if (key === '@type') {
      if(depth > 0) {
        delete obj[key];
      }
    } else if (typeof obj[key] === 'object') {
      removeTypeAnnotations(obj[key], depth + 1);
    }
  }
}

/**
 * Removes type annotations from a thing description.
 * 
 * @param {Object} description - The thing description object.
 * @returns {Object} - The modified thing description object with type annotations removed.
 */
function removeTypeAnnotationsFromThingDescription(description) {
  ['properties', 'actions', 'events'].forEach(affordanceType => {
    if (description[affordanceType]) {
      Object.keys(description[affordanceType]).forEach(name => {
        removeTypeAnnotations(description[affordanceType][name]);
      });
    }
  })
  return description
}

exports = module.exports = {
  getTypes,
  removeTypeAnnotationsFromThingDescription
}
