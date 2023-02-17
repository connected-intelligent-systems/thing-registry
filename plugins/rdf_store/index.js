'use strict'

const env = require('env-var')
const {
  addThingDescription,
  reasonThingDescription,
  getThingDescription,
  deleteThingDescription,
  buildJsonDescriptionFromRdf
} = require('./lib/service')

const EnableReasoning = env
  .get('ENABLE_REASONING')
  .default('false')
  .asBool()

async function init ({ PluginTypes }) {
  return {
    type: PluginTypes.Storage,
    customTypes: ['application/ld+json+inferred', 'application/n-triples'],
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
      required: []
    }
  }
}

async function create (thing) {
  if (EnableReasoning === true) {
    return reasonThingDescription(thing)
  } else {
    return addThingDescription(thing)
  }
}

async function get (id, type) {
  const description = await getThingDescription(id)
  if (type === 'application/n-triples') {
    return description
  } else {
    return buildJsonDescriptionFromRdf(description)
  }
}

async function update (thing) {
  if (EnableReasoning === true) {
    return reasonThingDescription(thing)
  } else {
    return addThingDescription(thing)
  }
}

async function remove (id) {
  return deleteThingDescription(id)
}

exports = module.exports = {
  init,
  create,
  get,
  update,
  delete: remove
}
