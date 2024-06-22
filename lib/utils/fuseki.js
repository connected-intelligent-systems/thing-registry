'use strict'

const env = require('env-var')
const urlencode = require('form-urlencoded')
const toRDF = require('./to_rdf')
const { FusekiSyncFailed, JSONLdValidationFailed } = require('./http_errors')
const JsonLdError = require('jsonld/lib/JsonLdError')

/**
 * The URL of the Fuseki server.
 * @type {string}
 */
const FusekiUrl = env
  .get('FUSEKI_URL')
  .required(true)
  .asString()

/**
 * The username for authenticating with the Fuseki server.
 * @type {string}
 */
const FusekiUsername = env
  .get('FUSEKI_USERNAME')
  .default('admin')
  .asString()

/**
 * The password for authenticating with the Fuseki server.
 * @type {string}
 */
const FusekiPassword = env
  .get('FUSEKI_PASSWORD')
  .required(true)
  .asString()

/**
 * The authorization header value for authenticating with the Fuseki server.
 * @type {string}
 */
const Authorization =
  'Basic ' +
  Buffer.from(FusekiUsername + ':' + FusekiPassword).toString('base64')

/**
 * Updates the Fuseki server with the given SPARQL query.
 * @param {string} query - The SPARQL query to execute.
 * @param {string} dataset - The name of the dataset to update.
 * @returns {Promise<Response>} A promise that resolves to the response from the server.
 * @throws {FusekiSyncFailed} If the update operation fails.
 */
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

/**
 * Adds a thing description to the specified dataset.
 * @param {string} id - The ID of the thing description.
 * @param {string} triples - The RDF triples representing the thing description.
 * @param {string} dataset - The name of the dataset to add the thing description to.
 * @returns {Promise<Response>} A promise that resolves to the response from the server.
 */
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

/**
 * Deletes a thing description from the specified dataset.
 * @param {string} id - The ID of the thing description to delete.
 * @param {string} dataset - The name of the dataset to delete the thing description from.
 * @returns {Promise<Response>} A promise that resolves to the response from the server.
 */
async function deleteThingDescription (id, dataset) {
  const query = `
    DROP GRAPH <${id}> ;
  `
  return update(query, dataset)
}

/**
 * Adds thing descriptions to the specified datasets.
 * @param {Object} options - The options for adding thing descriptions.
 * @param {Object} options.description - The thing description object.
 * @param {string} options.tenantId - The ID of the tenant.
 * @param {string} options.customerId - The ID of the customer (optional).
 * @throws {JSONLdValidationFailed} If the JSON-LD validation fails.
 * @throws {Error} If an error occurs while adding the thing descriptions.
 */
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

/**
 * Removes thing descriptions from the specified datasets.
 * @param {Object} options - The options for removing thing descriptions.
 * @param {string} options.id - The ID of the thing description to remove.
 * @param {string} options.tenantId - The ID of the tenant.
 * @param {string} options.customerId - The ID of the customer (optional).
 */
async function removeThingDescriptions ({ id, tenantId, customerId }) {
  await deleteThingDescription(id, tenantId)

  if (customerId) {
    await deleteThingDescription(id, `${tenantId}-${customerId}`)
  }
}

module.exports = {
  addThingDescription,
  deleteThingDescription,
  addThingDescriptions,
  removeThingDescriptions
}
