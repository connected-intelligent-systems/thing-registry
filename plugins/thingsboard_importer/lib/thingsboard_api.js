'use strict'

const env = require('env-var')
const axios = require('axios')

const ThingsBoardUrl = env
  .get('THINGSBOARD_API_URL')
  .required(true)
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
    `${ThingsBoardUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?useStrictDataTypes=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
  return response.data
}

async function authenticateThingsboard (username, password) {
  const response = await axios.post(`${ThingsBoardUrl}/api/auth/login`, {
    username,
    password
  })
  return response.data
}

exports = module.exports = {
  getDevices,
  getAttributes,
  getTimeseries,
  authenticateThingsboard
}
