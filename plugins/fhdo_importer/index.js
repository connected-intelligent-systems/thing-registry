'use strict'

const fetch = require('node-fetch')
const jsonld = require('jsonld')
const env = require('env-var')
const HttpsProxyAgent = require('https-proxy-agent')
const { TargetNotAvailable } = require('../../lib/utils/http_errors')

const ProxyAddress = env.get('https_proxy').asString()
const ApiKey = env.get('FHDO_API_KEY').asString()
const Token = env.get('FHDO_TOKEN').asString()
const BlockActionsAndEvents = env
  .get('FHDO_BLOCK_ACTIONS_AND_EVENTS')
  .default('true')
  .asBool()
const agent = ProxyAddress ? new HttpsProxyAgent(ProxyAddress) : undefined

async function init ({ PluginTypes }) {
  return {
    type: PluginTypes.Discovery,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        site: {
          type: 'string',
          title: 'ID of the site'
        }
      },
      required: ['site']
    }
  }
}

async function fetchSite (settings) {
  const response = await fetch(
    `https://zuse.icas.fh-dortmund.de/ict-gw/v1/sites/${settings.site}`,
    {
      agent,
      headers: {
        Authorization: `Bearer ${Token}`,
        'X-Host-Override': 'wot-device-api',
        'x-api-key': ApiKey
      }
    }
  )

  if (!response.ok) {
    throw new Error('Error fetching site')
  }

  const site = await response.json()
  const framedSite = await jsonld.frame(site, {
    '@type': 'https://www.w3.org/2019/wot/td#Thing',
    '@explicit': true
  })
  return framedSite['@graph'].map(thing => thing['@id'])
}

async function fetchThing (url) {
  const response = await fetch(url, {
    agent,
    headers: {
      Authorization: `Bearer ${Token}`,
      'X-Host-Override': 'wot-device-api',
      'x-api-key': ApiKey
    }
  })

  if (!response.ok) {
    throw new Error('Error fetching site')
  }

  return response.json()
}

async function discover (settings) {
  const thingIds = await fetchSite(settings)
  const promises = []

  for (const id of thingIds) {
    promises.push(fetchThing(id, settings))
  }

  const results = await Promise.allSettled(promises)
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => fixThingDescriptions(fixPrefixes(result.value)))
}

async function authenticate (target, { credentialsStorage }) {
  if (BlockActionsAndEvents === true) {
    if (target.type === 'actions' || target.type === 'events') {
      throw new TargetNotAvailable()
    }
  }
  let credentials = await credentialsStorage.get()
  if (credentials === undefined) {
    credentials = {
      accessToken: Token,
      apiKey: ApiKey
    }
    await credentialsStorage.update(credentials)
  }
  return {
    bearer_sc: {
      token: `${credentials.accessToken}`
    },
    apiKeySecurityScheme: {
      apiKey: `${credentials.apiKey}`
    }
  }
}

function fixPrefixes (thing) {
  let strThing = JSON.stringify(thing)
  strThing = strThing.replace(/http:\/\/schema.org\//g, 'schema:')
  strThing = strThing.replace(/http:\/\/iotschema.org\//g, 'iot:')
  strThing = strThing.replace(
    /https:\/\/saref.etsi.org\/saref4ener\//g,
    'saref4ener:'
  )
  strThing = strThing.replace(
    /http:\/\/www.ontology-of-units-of-measure.org\/resource\/om-2\//g,
    'om:'
  )
  return {
    ...JSON.parse(strThing),
    '@context': [
      'https://www.w3.org/2019/wot/td/v1',
      {
        schema: 'http://schema.org/',
        iot: 'http://iotschema.org/',
        http: 'http://iotschema.org/protocol/http',
        saref4ener: 'https://saref.etsi.org/saref4ener/',
        om: 'http://www.ontology-of-units-of-measure.org/resource/om-2/'
      }
    ]
  }
}

function fixThingDescriptions (thing) {
  const affordances = ['properties', 'events', 'actions']
  affordances.forEach(affordance => {
    if (thing[affordance] !== undefined) {
      Object.keys(thing[affordance]).forEach(key => {
        thing[affordance][key].forms.forEach(form => {
          form['htv:headers'] = [
            {
              'htv:fieldName': 'X-Host-Override',
              'htv:fieldValue': 'wot-device-api'
            }
          ]
        })
      })
    }
  })
  return thing
}

exports = module.exports = {
  init,
  discover,
  authenticate
}
