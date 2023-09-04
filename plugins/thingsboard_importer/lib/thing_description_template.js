'use strict'

const env = require('env-var')
const ThingsBoardUrl = env
  .get('THINGSBOARD_API_URL')
  .required(true)
  .asString()
const { ThingModelHelpers } = require('@node-wot/td-tools')

const thingModelHelpers = new ThingModelHelpers()

async function generateThingDescription (deviceId, thingModelUrl) {
  const thingModel = await thingModelHelpers.fetchModel(thingModelUrl)
  const [thingDescription] = await thingModelHelpers.getPartialTDs(thingModel)

  thingDescription.id = `uri:uuid:${deviceId}`
  generateProperties(deviceId, thingDescription)
  return thingDescription
}

function generateProperties (deviceId, thingDescription) {
  Object.keys(thingDescription.properties).forEach(name => {
    const property = thingDescription.properties[name]
    property.forms = [
      {
        href: `${ThingsBoardUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`
      }
    ]
  })
}

exports = module.exports = {
  generateThingDescription
}
