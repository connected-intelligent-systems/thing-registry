'use strict'

const jwt = require('jsonwebtoken')
const {
  generateThingDescription
} = require('./lib/thing_description_template')
const {
  getDevices,
  getAttributes,
  getTimeseries,
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
    type: PluginTypes.Discovery
  }
}

async function reauthenticate (accessToken, credentialsStorage) {
  const { token } = await authenticateThingsboard(accessToken)
  // we store only the access token
  await credentialsStorage.update(token)
  return token
}

async function discover (_, { accessToken, credentialsStorage }) {
  const token = await reauthenticate(accessToken.token, credentialsStorage)
  return generateThingDescriptions(token)
}

async function authenticate (
  target,
  { credentialsStorage, accessToken, exchangeAccessToken }
) {
  let token = await credentialsStorage.get()
  if (jwtIsExpired(token)) {
    const impersonatedToken = await exchangeAccessToken(accessToken.token, target.owner)
    token = await reauthenticate(
      impersonatedToken,
      credentialsStorage
    )
  }
  return {
    bearer_sc: {
      token
    }
  }
}

exports = module.exports = {
  init,
  discover,
  authenticate
}
