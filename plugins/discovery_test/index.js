'use strict'

async function init ({ PluginTypes }) {
  return {
    type: PluginTypes.Discovery,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        things: {
          type: 'integer'
        }
      },
      required: ['things']
    }
  }
}

async function discover (settings) {
  return [
    {
      '@context': 'https://www.w3.org/2019/wot/td/v1',
      title: 'MyLampThing',
      securityDefinitions: {
        basic_sc: { scheme: 'basic', in: 'header' }
      },
      security: ['basic_sc'],
      properties: {
        status321: {
          type: 'string',
          forms: [{ href: 'https://mylamp.example.com/status' }]
        }
      },
      actions: {
        toggle: {
          forms: [{ href: 'https://mylamp.example.com/toggle' }]
        }
      },
      events: {
        overheating: {
          data: { type: 'string' },
          forms: [
            {
              href: 'https://mylamp.example.com/oh',
              subprotocol: 'longpoll'
            }
          ]
        }
      }
    }
  ]
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
