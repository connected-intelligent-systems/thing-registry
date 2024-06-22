'use strict'

const jsonld = require('jsonld')
const td11Context = require('./td-context-1.1.json')
const td10Context = require('./td-context-1.0.json')

/**
 * A map of predefined contexts for different versions of the Thing Description (TD) specification.
 * @type {Object}
 */
const contexts = {
  'https://www.w3.org/2022/wot/td/v1.1': {
    '@context': td11Context['@context']
  },
  'https://www.w3.org/2019/wot/td/v1': {
    '@context': td10Context['@context']
  }
}

/**
 * A document loader function for JSON-LD processing.
 * @param {string} url - The URL of the document to load.
 * @returns {Promise<Object>} - A promise that resolves to the loaded document.
 */
const nodeDocumentLoader = jsonld.documentLoaders.node()

/**
 * Custom document loader function for JSON-LD processing.
 * @param {string} url - The URL of the document to load.
 * @returns {Promise<Object>} - A promise that resolves to the loaded document.
 */
async function documentLoader (url) {
  if (url in contexts) {
    return {
      contextUrl: null,
      document: contexts[url],
      documentUrl: url
    }
  }
  return nodeDocumentLoader(url)
}

/**
 * Ensures that a string has a trailing slash.
 * @param {string} str - The input string.
 * @returns {string} - The input string with a trailing slash.
 */
function ensureTrailingSlash (str) {
  if (str.endsWith('/')) {
    return str
  } else {
    return str + '/'
  }
}

/**
 * Converts a Thing Description (TD) object to RDF format.
 * @param {Object} description - The Thing Description object.
 * @param {string} base - The base URL for the Thing Description.
 * @returns {Promise<string>} - A promise that resolves to the RDF representation of the Thing Description.
 */
async function toRDF (description, base) {
  const expanded = await jsonld.expand(description, {
    documentLoader,
    base: ensureTrailingSlash(base),
    safe: true
  })

  return jsonld.toRDF(expanded, {
    format: 'application/n-quads'
  })
}

exports = module.exports = toRDF
