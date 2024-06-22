'use strict'

const env = require('env-var')
const urlencode = require('form-urlencoded')
const toRDF = require('./to_rdf')
const { FusekiSyncFailed, JSONLdValidationFailed } = require('./http_errors')
const JsonLdError = require('jsonld/lib/JsonLdError')

const FusekiUrl = env
  .get('FUSEKI_URL')
  .required(true)
  .asString()
const FusekiUsername = env
  .get('FUSEKI_USERNAME')
  .default('admin')
  .asString()
const FusekiPassword = env
  .get('FUSEKI_PASSWORD')
  .required(true)
  .asString()

const Authorization =
  'Basic ' +
  Buffer.from(FusekiUsername + ':' + FusekiPassword).toString('base64')

async function update (query, dataset) {
  const response = await fetch(`${FusekiUrl}/${dataset}/update`, {
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
    throw new FusekiSyncFailed(response.status, await response.text())
  }

  return response
}

async function addThingDescription (id, triples, dataset) {
  const query = `
    DROP GRAPH <${id}> ;
    INSERT DATA {
      GRAPH <${id}> {
        ${triples}
      }
    } 
  `
  return update(query, dataset)
}

async function deleteThingDescription (id, dataset) {
  const query = `
    DROP GRAPH <${id}> ;
  `
  return update(query, dataset)
}

async function addThingDescriptions ({ description, tenantId, customerId }) {
  try {
    const rdfTriplesThing = await toRDF(description, 'test')

    // add thing description to tenant
    await addThingDescription(description.id, rdfTriplesThing, tenantId)

    // add thing description to customer
    if (customerId) {
      await addThingDescription(
        description.id,
        rdfTriplesThing,
        `${tenantId}-${customerId}`
      )
    }
  } catch (e) {
    if (e instanceof JsonLdError) {
      throw new JSONLdValidationFailed(e.details)
    } else {
      throw e
    }
  }
}

async function removeThingDescriptions ({ id, tenantId, customerId }) {
  await deleteThingDescription(id, tenantId)

  if (customerId) {
    await deleteThingDescription(id, `${tenantId}-${customerId}`)
  }
}

exports = module.exports = {
  addThingDescription,
  deleteThingDescription,
  addThingDescriptions,
  removeThingDescriptions
}
