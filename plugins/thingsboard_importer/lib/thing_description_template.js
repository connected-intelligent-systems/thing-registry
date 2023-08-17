'use strict'

const env = require('env-var')
const { createSchema } = require('genson-js')
const ThingsBoardUrl = env
  .get('THINGSBOARD_API_URL')
  .required(true)
  .asString()

function getAttribute (attributes, key, name) {
  const attribute = attributes.find(d => d.key === key)
  if (attribute) {
    return attribute.value[name]
  }
}

function generateThingDescription (device) {
  return {
    '@context': 'https://www.w3.org/2022/wot/td/v1.1',
    id: `urn:uuid:${device.id.id}`,
    title:
      getAttribute(device.attributes, 'device', 'name_by_user') ||
      getAttribute(device.attributes, 'device', 'name') ||
      getAttribute(device.attributes, 'device', 'original_name') ||
      device.name,
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
          },
          useStrictDataTypes: {
            type: 'string',
            const: 'true'
          }
        },
        properties: {
          [v]: {
            value: {
              ...createSchema(device.timeseries[v][0].value, {
                noRequired: true
              })
            },
            ts: {
              type: 'integer'
            }
          }
        },
        forms: [
          {
            href: `${ThingsBoardUrl}/api/plugins/telemetry/DEVICE/${device.id.id}/values/timeseries`
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
          useStrictDataTypes: {
            type: 'string',
            const: 'true'
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
            ...createSchema(device.timeseries[v][0].value, { noRequired: true })
          },
          ts: {
            type: 'integer'
          }
        },
        forms: [
          {
            href: `${ThingsBoardUrl}/api/plugins/telemetry/DEVICE/${device.id.id}/values/timeseries`,
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
