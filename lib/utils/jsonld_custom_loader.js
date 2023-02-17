'use strict'

const jsonld = require('jsonld')
const contexts = require('../context')

const nodeDocumentLoader = jsonld.documentLoaders.node()

function documentLoader (url, callback) {
  if (url in contexts) {
    return callback(null, {
      contextUrl: null,
      document: contexts[url],
      documentUrl: url
    })
  }
  nodeDocumentLoader(url, callback)
}

exports = module.exports = documentLoader
