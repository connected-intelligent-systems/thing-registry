'use strict'

const fetch = require('node-fetch')
const env = require('env-var')
const HttpsProxyAgent = require('https-proxy-agent')
const express = require('express')

const { TargetNotAvailable } = require('../../lib/utils/http_errors')

async function getDevices(token)  {
  const response = await fetch('http://192-168-178-60.nip.io/api/tenant/devices?page=0&pageSize=1000', { 
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  if(response.ok) {
    const devices = await response.json()
    console.log(JSON.stringify(devices, null, 4))
  } else {
    console.log(await response.text())
  }
}

const token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJob3VzZWhvbGRfMTIzNEBhZG1pbi5jb20iLCJ1c2VySWQiOiJiZGU3N2IxMC0yMjdiLTExZWUtOTBjYi0zNzI0YTNhNjljYjAiLCJzY29wZXMiOlsiVEVOQU5UX0FETUlOIl0sInNlc3Npb25JZCI6IjljZGMyOTczLTJjZDYtNDJlNS1iYWYyLTg3YTgxOTY1YWNlYiIsImlzcyI6InRoaW5nc2JvYXJkLmlvIiwiaWF0IjoxNjg5NDM0MTIxLCJleHAiOjE2ODk0NDMxMjEsImVuYWJsZWQiOmZhbHNlLCJpc1B1YmxpYyI6ZmFsc2UsInRlbmFudElkIjoiYjgyM2E2OTAtMjI3Yi0xMWVlLTkwY2ItMzcyNGEzYTY5Y2IwIiwiY3VzdG9tZXJJZCI6IjEzODE0MDAwLTFkZDItMTFiMi04MDgwLTgwODA4MDgwODA4MCJ9.sWUxxmcBBz1MmML2hoMgSJuUpLphq3TyWtF19YYVtb8PJqGtabT-zYXnwsQjEeg2sw06CGgLRDj1CjpD47F-yA'

getDevices(token)

async function init ({ PluginTypes }) {
  return {
    type: PluginTypes.Discovery,
    schema: {}
  }
}

// discover gets triggered from user
async function discover (settings, { accessToken }) {
  // get token from oauth2 thingsboard (long liveds)
  // store token
  // query devices
  // build tds
  return []
}

async function authenticate (
  target,
  { credentialsStorage, readSettings, accessToken }
) {
  //
  return {}
}

// Event sent from every root-node
// {
//   id: { entityType: 'DEVICE', id: '406d3ca0-22e5-11ee-a812-9734cce737d1' },
//   createdTime: 1689407851882,
//   additionalInfo: { gateway: false, overwriteActivityTime: false, description: '' },
//   tenantId: { entityType: 'TENANT', id: 'b823a690-227b-11ee-90cb-3724a3a69cb0' },
//   customerId: {
//     entityType: 'CUSTOMER',
//     id: '13814000-1dd2-11b2-8080-808080808080'
//   },
//   name: 'sdsd',
//   type: 'default',
//   label: '',
//   deviceProfileId: {
//     entityType: 'DEVICE_PROFILE',
//     id: 'b82be3f0-227b-11ee-90cb-3724a3a69cb0'
//   },
//   deviceData: {
//     configuration: { type: 'DEFAULT' },
//     transportConfiguration: { type: 'DEFAULT' }
//   },
//   firmwareId: null,
//   softwareId: null,
//   externalId: null
// }

const app = express()

app.use(express.json())

app.post('/', (req, res) => {
  console.log(req.body)
  res.send('OKS')
})

app.listen(3001)

exports = module.exports = {
  init,
  discover,
  authenticate
}
