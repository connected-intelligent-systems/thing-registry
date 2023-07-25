'use strict'

const {
  generateThingDescription
} = require('./lib/thing_description_template')
const {
  getDevices,
  getAttributes,
  getTimeseries,
  authenticateThingsboard
} = require('./lib/thingsboard_api')

async function generateThingDescriptions (accessToken) {
  const devices = await getDevices({ accessToken })
  const thingDescriptions = []
  for (const device of devices) {
    device.attributes = await getAttributes({
      accessToken,
      deviceId: device.id.id
    })
    device.timeseries = await getTimeseries({
      accessToken,
      deviceId: device.id.id
    })
    thingDescriptions.push(generateThingDescription(device))
  }
  return thingDescriptions
}

async function init ({ PluginTypes }) {
  return {
    type: PluginTypes.Discovery,
    schema: {}
  }
}

async function discover (settings, { accessToken }) {
  const data = await authenticateThingsboard(accessToken.token)
  return generateThingDescriptions(data.token)
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
