'use strict'

const env = require('env-var')
const URL = require('url').URL

const BaseUrl = env
  .get('BASE_URL')
  .default('http://localhost:8090/registry')
  .asString()
const { KeycloakHost } = require('./keycloak')
const ExposedSecurityDefinition = 'exposed_sc'

function exposeHttpForm (form, path, url) {
  form.href = `${BaseUrl}${path}${url.search}`
  return form
}

function exposeWebsocketForm (form, path, url) {
  form.href = `${BaseUrl.replace(/^http/, 'ws')}${path}`
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
  Object.keys(thing[type] || {}).forEach(affordanceName => {
    const exposedForms = thing[type][affordanceName].forms
      .map((form, index) =>
        exposeForm(
          thing.id,
          structuredClone(form),
          index,
          type,
          affordanceName,
          thing.base
        )
      )
      .filter(form => form)

    // todo: check if exposedForms is 0
    thing[type][affordanceName].forms = exposedForms
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
  thing.securityDefinitions = {
    [ExposedSecurityDefinition]: {
      scheme: 'oauth2',
      flow: 'code',
      authorization: `${KeycloakHost}/auth`,
      token: `${KeycloakHost}/token`,
      scopes: ['openid']
    }
  }
  thing.security = [ExposedSecurityDefinition]
}

function toExposedThing (thing) {
  const exposedThing = structuredClone(thing)
  exposeSecurityDefinitions(exposedThing)
  exposeInteractionAfforandances(exposedThing)
  return exposedThing
}

exports = module.exports = {
  toExposedThing,
  exposeAffordance,
  ExposedSecurityDefinition
}
