'use strict'

function generateThingDescription (device) {
  return {
    '@context': 'https://www.w3.org/2022/wot/td/v1.1',
    id: `urn:uuid:${device.id.id}`,
    title: device.name,
    securityDefinitions: {
      bearer_sc: { scheme: 'bearer' }
    },
    security: 'bearer_sc',
    properties: generateProperties(device),
    actions: generateActions(device)
  }
}

function generateProperties (device) {
  const propertyNames = Object.keys(device.timeseries)
  return propertyNames.reduce(
    (a, v) => ({
      ...a,
      [v]: {
        type: 'object',
        uriVariables: {
          keys: {
            type: 'string',
            const: v
          }
        },
        properties: {
          value: {
            type: 'string'
          },
          ts: {
            type: 'integer'
          }
        },
        forms: [
          {
            href: `http://192-168-178-60.nip.io/api/plugins/telemetry/DEVICE/${device.id.id}/values/timeseries?keys=${v}`
          }
        ]
      }
    }),
    {}
  )
}

function generateActions (device) {
  const propertyNames = Object.keys(device.timeseries)
  return propertyNames.reduce(
    (a, v) => ({
      ...a,
      [v]: {
        type: 'object',
        uriVariables: {
          keys: {
            type: 'string',
            const: v
          },
          startTs: {
            type: 'integer'
          },
          endTs: {
            type: 'integer'
          }
        },
        properties: {
          value: {
            type: 'string'
          },
          ts: {
            type: 'integer'
          }
        },
        forms: [
          {
            href: 'http://localhost:8090',
            'htv:methodName': 'GET'
          }
        ]
      }
    }),
    {}
  )
}

exports = module.exports = {
  generateThingDescription
}
