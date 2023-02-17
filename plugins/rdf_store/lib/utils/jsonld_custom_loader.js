'use strict'

const jsonld = require('jsonld')
const contexts = require('../context')

const nodeDocumentLoader = jsonld.documentLoaders.node()

async function documentLoader (url) {
  if (url in contexts) {
    return {
      contextUrl: null,
      document: contexts[url],
      documentUrl: url
    }
  }
  nodeDocumentLoader(url)
}

exports = module.exports = documentLoader
