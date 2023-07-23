'use strict'

const env = require('env-var')
const axios = require('axios')

const ThingsBoardUrl = env
  .get('THINGBOARD_API_URL')
  .default('http://192-168-178-60.nip.io')
  .asString()

async function getDevices ({ page = 0, pageSize = 20, accessToken } = {}) {
  let devices = []
  let hasNext = true

  while (hasNext) {
    const result = await axios.get(
      `${ThingsBoardUrl}/api/tenant/devices?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    devices = devices.concat(result.data.data)
    hasNext = result.data.hasNext
    page++
  }

  return devices
}

async function getAttributes ({ accessToken, deviceId }) {
  const response = await axios.get(
    `${ThingsBoardUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
  return response.data
}

async function getTimeseries ({ accessToken, deviceId }) {
  const response = await axios.get(
    `${ThingsBoardUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
  return response.data
}

async function authenticateThingsboard (accessToken) {
  const response = await axios.post(`${ThingsBoardUrl}/api/auth/login`, {
    username: 'oauth2-token',
    password: accessToken
  })

  return response
}

exports = module.exports = {
  getDevices,
  getAttributes,
  getTimeseries,
  authenticateThingsboard
}
