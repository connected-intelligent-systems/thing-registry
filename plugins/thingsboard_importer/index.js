'use strict'

const jwt = require('jsonwebtoken')
const {
  generateThingDescription
} = require('./lib/thing_description_template')
const {
  getDevices,
  getAttributes,
  authenticateThingsboard
} = require('./lib/thingsboard_api')

function jwtIsExpired (token) {
  const decoded = jwt.decode(token)
  return decoded.exp < Date.now() / 1000
}

async function generateThingDescriptions (accessToken) {
  const devices = await getDevices({ accessToken })
  const thingDescriptions = []
  for (const device of devices) {
    device.attributes = await getAttributes({
      accessToken,
      deviceId: device.id.id
    })
    const thingModelAttribute = device.attributes.find(
      attribute => attribute.key === 'thing-model'
    )
    if (thingModelAttribute !== undefined) {
      const thingDescription = await generateThingDescription(
        device.id.id,
        thingModelAttribute.value
      )
      thingDescriptions.push(thingDescription)
    }
  }
  return thingDescriptions
}

async function init ({ PluginTypes }) {
  return {
    type: PluginTypes.Discovery,
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string'
        },
        password: {
          type: 'string'
        }
      },
      required: ['username', 'password']
    }
  }
}

async function discover (settings) {
  const { token } = await authenticateThingsboard(
    settings.username,
    settings.password
  )
  return generateThingDescriptions(token)
}

async function authenticate (form, { readSettings }) {
  if (
    form.securityDefinition.credentials === null ||
    jwtIsExpired(form.securityDefinition.credentials.token)
  ) {
    const { username, password } = await readSettings()
    const { token } = await authenticateThingsboard(username, password)
    return {
      token
    }
  }
}

exports = module.exports = {
  init,
  discover,
  authenticate
}
