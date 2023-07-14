'use strict'

const env = require('env-var')
const lodash = require('lodash')
const URL = require('url').URL

const BaseUrl = env
  .get('BASE_URL')
  .default('http://localhost:8090/registry')
  .asString()
const { KeycloakHost } = require('./keycloak')
const ExposedSecurityDefinition = 'exposed_sc'

function stripThingDescription (thingDescription) {
  delete thingDescription.securityDefinitions[ExposedSecurityDefinition]
  stripAffordance(thingDescription, 'properties')
  stripAffordance(thingDescription, 'events')
  stripAffordance(thingDescription, 'actions')
  return thingDescription
}

function stripAffordance (thingDescription, type) {
  Object.keys(thingDescription[type]).forEach(affordanceName => {
    thingDescription[type][affordanceName].forms = thingDescription[type][
      affordanceName
    ].forms.filter(form => form.security != ExposedSecurityDefinition)
  })
}

function exposeHttpForm (form, path, url) {
  form.href = `${BaseUrl}${path}${url.search}`
  form.security = ExposedSecurityDefinition
  return form
}

function exposeWebsocketForm (form, path, url) {
  form.href = `${BaseUrl.replace(/^http/, 'ws')}${path}`
  form.security = ExposedSecurityDefinition
  return form
}

// TODO: fix/remove binding specific settings
// TODO: add binding specific settings?
function exposeForm (id, form, index, type, name, base) {
  const path = `/things/${encodeURIComponent(
    id
  )}/affordances/${type}/${name}/${index}/exposed`
  const url = new URL(form.href, base)

  switch (url.protocol) {
    case 'http:':
    case 'https:':
      return exposeHttpForm(form, path, url)
    case 'ws:':
    case 'wss:':
      return exposeWebsocketForm(form, path, url)
  }
}

function exposeAffordance (thing, type) {
  Object.keys(thing[type]).forEach(affordanceName => {
    const exposedForms = thing[type][affordanceName].forms
      .map((form, index) =>
        exposeForm(
          thing.id,
          lodash.cloneDeep(form),
          index,
          type,
          affordanceName,
          thing.base
        )
      )
      .filter(form => form)

    thing[type][affordanceName].forms = [
      ...exposedForms,
      ...thing[type][affordanceName].forms
    ]
  })
}

function exposeInteractionAfforandances (thing) {
  exposeAffordance(thing, 'properties')
  exposeAffordance(thing, 'actions')
  exposeAffordance(thing, 'events')
  return thing
}

// fixme: urls are all wrong
function exposeSecurityDefinitions (thing) {
  thing.securityDefinitions[ExposedSecurityDefinition] = {
    scheme: 'oauth2',
    flow: 'code',
    authorization: `${KeycloakHost}/auth`,
    token: `${KeycloakHost}/token`,
    scopes: ['openid']
  }
}

function toExposedThing (thing) {
  const exposedThing = lodash.cloneDeep(stripThingDescription(thing))
  exposeSecurityDefinitions(exposedThing)
  exposeInteractionAfforandances(exposedThing)
  return exposedThing
}

exports = module.exports = {
  toExposedThing,
  exposeAffordance,
  ExposedSecurityDefinition
}
