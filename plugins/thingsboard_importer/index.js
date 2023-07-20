'use strict'

const Mustache = require('mustache')

const {
  generateThingDescription
} = require('./lib/thing_description_template')
const { getDevices, getAttributes, getTimeseries } = require('./lib/thingsboard_api')

async function generateThingDescriptions () {
  const devices = await getDevices()
  const thingDescriptions = []
  for (const device of devices) {
    device.attributes = await getAttributes(device.id.id)
    device.timeseries = await getTimeseries(device.id.id)
    thingDescriptions.push(generateThingDescription(device))
  }
  return thingDescriptions
}

// generateThingDescriptions().then(ls => console.log(JSON.stringify(ls, null, 4)))
// .then(devices => console.log(devices))

async function init ({ PluginTypes }) {
  return {
    type: PluginTypes.Discovery,
    schema: {
    }
  }
}

async function discover (settings) {
  return await generateThingDescriptions()
}

async function authenticate (target, { credentialsStorage, readSettings }) {
  return {
    headers: {},
    queries: {}
  }
}

exports = module.exports = {
  init,
  discover,
  authenticate
}
