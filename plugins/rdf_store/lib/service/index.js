'use strict'

const env = require('env-var')
const fetch = require('node-fetch')
const urljoin = require('url-join')
const jsonld = require('jsonld')
const { default: urlencode } = require('form-urlencoded')
const toRDF = require('../utils/to_rdf')
const { fixFramedDescription, restoreIndices } = require('../utils/from_rdf')
const thingDescriptionFrame = require('../frames/thing_description.json')

const ReasonerUrl = env
  .get('REASONER_URL')
  .default('http://reasoner')
  .asString()
const FusekiUrl = env
  .get('FUSEKI_URL')
  .default('http://fuseki:3030')
  .asString()
const FusekiUser = env
  .get('FUSEKI_USER')
  .default('admin')
  .asString()
const FusekiPassword = env
  .get('FUSEKI_PASSWORD')
  .default('fuseki')
  .asString()
const FusekiDataset = env
  .get('FUSEKI_DATASET')
  .default('things')
  .asString()

const Authorization =
  'Basic ' + Buffer.from(FusekiUser + ':' + FusekiPassword).toString('base64')

async function reasonTriples (triples) {
  const response = await fetch(`${ReasonerUrl}/infer`, {
    method: 'POST',
    body: triples,
    headers: {
      'Content-Type': 'application/n-triples'
    }
  })

  if (!response.ok) {
    throw new Error('Error reasoning')
  }

  return response.text()
}

async function update (query) {
  const response = await fetch(urljoin(FusekiUrl, FusekiDataset, 'update'), {
    method: 'POST',
    body: urlencode({
      update: query
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization
    }
  })

  if (!response.ok) {
    throw new Error('Error running update query')
  }

  return response
}

async function construct (query) {
  const response = await fetch(urljoin(FusekiUrl, FusekiDataset, 'query'), {
    method: 'POST',
    body: urlencode({
      query
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/n-triples',
      Authorization
    }
  })

  if (!response.ok) {
    throw new Error('Error running construct query')
  }

  return response.text()
}

async function buildJsonDescriptionFromRdf (graph) {
  const description = await jsonld.fromRDF(graph, {
    format: 'application/n-quads',
    useNativeTypes: true
  })
  const framedGraph = await jsonld.frame(
    restoreIndices(description),
    thingDescriptionFrame,
    { omitDefault: true }
  )
  return fixFramedDescription(framedGraph)
}

async function reasonThingDescription (thing) {
  const triples = await toRDF(thing)
  const reasonedTriples = await reasonTriples(triples)
  const query = `
    DROP GRAPH <${thing.id}> ;
    INSERT DATA {
      GRAPH <${thing.id}> {
        ${reasonedTriples}
      }
    } 
  `
  return update(query)
}

async function addThingDescription (thing) {
  const triples = await toRDF(thing)
  const query = `
    DROP GRAPH <${thing.id}> ;
    INSERT DATA {
      GRAPH <${thing.id}> {
        ${triples}
      }
    } 
  `
  return update(query)
}

async function deleteThingDescription (id) {
  const query = `
    DROP GRAPH <${id}> ;
  `
  return update(query)
}

async function getThingDescription (id) {
  const query = `
    CONSTRUCT { 
      ?s ?o ?p 
    }
    WHERE {
      GRAPH <${id}> {
        ?s ?o ?p .
      }
    }
  `
  return construct(query)
}

exports = module.exports = {
  buildJsonDescriptionFromRdf,
  reasonThingDescription,
  addThingDescription,
  deleteThingDescription,
  getThingDescription
}
