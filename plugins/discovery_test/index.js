'use strict'

async function init ({ PluginTypes }) {
  return {
    type: PluginTypes.Discovery,
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string'
        }
      },
      required: ['token']
    }
  }
}

async function discover (settings, { credentialsStorage }) {
  return [
    {
      '@context': 'https://www.w3.org/2022/wot/td/v1.1',
      id: 'urn:uuid:0804d572-cce8-422a-bb7c-4412fcd56f06',
      title: 'MyLampThing',
      securityDefinitions: {
        basic_sc: { scheme: 'basic', in: 'header' }
      },
      security: 'basic_sc',
      properties: {
        status: {
          type: 'string',
          forms: [{ href: 'https://httpbin.org/get', public: true }]
        }
      },
      actions: {
        toggle: {
          forms: [{ href: 'https://httpbin.org/post', public: true }]
        }
      }
    }
  ]
}

async function authenticate (form, { readSettings }) {
  if (form.securityDefinition.credentials === null) {
    const settings = await readSettings()
    return {
      username: settings.token,
      password: 'test'
    }
  }
}

exports = module.exports = {
  init,
  discover,
  authenticate
}
