'use strict'

const env = require('env-var')
const lodash = require('lodash')
const URL = require('url').URL

const BaseUrl = env
  .get('BASE_URL')
  .default('http://localhost:8090/registry')
  .asString()
const { KeycloakHost } = require('./keycloak')

function fixMqttForm (form, path, url) {
  // we convert mqtt events to sse events
  form.href = `${BaseUrl}${path}`
  form.subprotocol = 'sse'
  // delete all mqtt specific options
  Object.keys(form).forEach(key => {
    if (key.includes('mqv:')) {
      delete form[key]
    }
  })
  // delete the security since we are using a custom one defined in the base of the thing
  delete form.security
}

function fixHttpForm (form, path, url) {
  form.href = `${BaseUrl}${path}${url.search}`
  // delete the security since we are using a custom one defined in the base of the thing
  delete form.security
}

function fixWebsocketForm (form, path, url) {
  form.href = `${BaseUrl.replace(/^http/, 'ws')}${path}`
  // delete the security since we are using a custom one defined in the base of the thing
  delete form.security
}

// TODO: fix/remove binding specific settings
// TODO: add binding specific settings?
function fixForms (forms, id, type, name, base) {
  forms.forEach((form, index, array) => {
    const path = `/things/${encodeURIComponent(
      id
    )}/affordances/${type}/${name}/${index}/exposed`
    const url = new URL(form.href, base)
    switch (url.protocol) {
      case 'mqtt:':
      case 'mqtts:':
        fixMqttForm(form, path, url)
        break
      case 'http:':
      case 'https:':
        fixHttpForm(form, path, url)
        break
      case 'ws:':
      case 'wss:':
        fixWebsocketForm(form, path, url)
        break
      default:
        // protocol not supported, remove form
        // this can lead to an invalid thing description because of empty forms
        array.splice(index, 1)
        break
    }
  })
}

function fixProperties (thing) {
  if (thing.properties) {
    Object.keys(thing.properties).forEach(key => {
      fixForms(
        thing.properties[key].forms,
        thing.id,
        'properties',
        key,
        thing.base
      )
    })
  }
}

function fixActions (thing) {
  if (thing.actions) {
    Object.keys(thing.actions).forEach(key => {
      fixForms(thing.actions[key].forms, thing.id, 'actions', key, thing.base)
    })
  }
}

function fixEvents (thing) {
  if (thing.events) {
    Object.keys(thing.events).forEach(key => {
      fixForms(thing.events[key].forms, thing.id, 'events', key, thing.base)
    })
  }
}

function fixInteractionAfforandances (thing) {
  fixProperties(thing)
  fixActions(thing)
  fixEvents(thing)
  return thing
}

function fixSecurity (thing) {
  delete thing.securityDefinitions
  delete thing.security
  thing.securityDefinitions = {
    oauth2_sc: {
      scheme: 'oauth2',
      flow: 'code',
      authorization: `${KeycloakHost}/auth`,
      token: `${KeycloakHost}/token`,
      scopes: ['openid']
    }
  }
  thing.security = ['oauth2_sc']
}

function toExposedThing (thing) {
  if (thing !== undefined) {
    const exposedThing = lodash.cloneDeep(thing)
    fixInteractionAfforandances(exposedThing)
    fixSecurity(exposedThing)
    return exposedThing
  }
}

function exposeAffordance (affordance, thingId, type, name) {
  if (affordance !== undefined) {
    const exposedAffordance = lodash.cloneDeep(affordance)
    fixForms(exposedAffordance.forms, thingId, type, name)
    return exposedAffordance
  }
}

exports = module.exports = {
  toExposedThing,
  exposeAffordance
}
