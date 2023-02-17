'use strict'

const fetch = require('node-fetch')
const env = require('env-var')
const HttpsProxyAgent = require('https-proxy-agent')
const { TargetNotAvailable } = require('../../lib/utils/http_errors')

const ProxyAddress = env.get('https_proxy').asString()
const ClientId = env.get('CONNECTD_CLIENT_ID').asString()
const ClientSecret = env.get('CONNECTD_CLIENT_SECRET').asString()
const BlockActionsAndEvents = env
  .get('CONNECTD_BLOCK_ACTIONS_AND_EVENTS')
  .default('true')
  .asBool()
const agent = ProxyAddress ? new HttpsProxyAgent(ProxyAddress) : undefined

function btoa (str) {
  return Buffer.from(str, 'binary').toString('base64')
}

async function getAccessToken () {
  const body = new URLSearchParams()
  body.append('grant_type', 'client_credentials')
  body.append(
    'scope',
    'connctd.connector connctd.things.read connctd.units.read connctd.things.action connctd.units.admin'
  )
  const response = await fetch('https://api.connctd.io/oauth2/token', {
    method: 'POST',
    body,
    agent,
    headers: {
      Authorization: `Basic ${btoa(`${ClientId}:${ClientSecret}`)}`
    }
  })

  if (response.ok) {
    const json = await response.json()
    return {
      accessToken: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000
    }
  }
}

async function init ({ PluginTypes }) {
  return {
    type: PluginTypes.Discovery,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        externalSubjectId: {
          type: 'string',
          default: 'default',
          title: 'External Subject ID'
        }
      },
      required: ['externalSubjectId']
    }
  }
}

async function discover (settings) {
  const credentials = await getAccessToken(settings)
  const response = await fetch(
    'https://api.connctd.io/api/betav1/wot/tds?resolve=true',
    {
      agent,
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'X-External-Subject-Id': settings.externalSubjectId
      }
    }
  )

  if (!response.ok) {
    throw Error(`Status ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function authenticate (target, { credentialsStorage, readSettings }) {
  if (BlockActionsAndEvents === true) {
    if (target.type === 'actions' || target.type === 'events') {
      throw new TargetNotAvailable()
    }
  }
  let credentials = await credentialsStorage.get()
  if (credentials === undefined || credentials.expiresAt < Date.now()) {
    credentials = await getAccessToken()
    await credentialsStorage.update(credentials)
  }
  return {
    apiKeySecurityScheme: {
      apiKey: `Bearer ${credentials.accessToken}`,
      token: credentials.accessToken
    },
    authsse: {
      apiKey: credentials.accessToken,
      token: credentials.accessToken
    },
    authquery: {
      apiKey: `Bearer ${credentials.accessToken}`,
      token: credentials.accessToken
    }
  }
}

exports = module.exports = {
  init,
  discover,
  authenticate
}
