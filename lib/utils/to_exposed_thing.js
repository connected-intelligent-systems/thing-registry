'use strict'

const env = require('env-var')
const lodash = require('lodash')
const URL = require('url').URL

const BaseUrl = env
  .get('BASE_URL')
  .default('http://localhost:8090/registry')
  .asString()
const ExposedSecurityDefinition = 'public_sc'

function exposeHttpForm (form, path, url) {
  form.href = `${BaseUrl}${path}${url.search}`
  return form
}

function exposeWebsocketForm (form, path, url) {
  form.href = `${BaseUrl.replace(/^http/, 'ws')}${path}`
  return form
}

function exposeForm (id, form, index, type, name, base) {
  const path = `/things/${encodeURIComponent(
    id
  )}/thing-interactions/${type}/${name}/${index}/exposed`
  const url = new URL(form.href, base)

  switch (url.protocol) {
    case 'http:':
    case 'https:':
      return exposeHttpForm(form, path, url)
    case 'ws:':
    case 'wss:':
      return exposeWebsocketForm(form, path, url)
    default:
      throw new Error(`Unsupported protocol ${url.protocol} for public form`)
  }
}

function exposeAffordance (thing, type) {
  Object.keys(thing[type] || []).forEach(name => {
    thing[type][name].forms = thing[type][name].forms
      .filter(form => form.public === true)
      .map((form, index) =>
        exposeForm(
          thing.id,
          lodash.cloneDeep(form),
          index,
          type,
          name,
          thing.base
        )
      )

    if (thing[type][name].forms.length === 0) {
      delete thing[type][name]
    }
  })

  if (Object.values(thing[type]).length === 0) {
    delete thing[type]
  }
}

function exposeInteractionAfforandances (thing) {
  ['properties', 'actions', 'events'].forEach(type =>
    exposeAffordance(thing, type)
  )
}

function exposeSecurityDefinitions (thing) {
  thing.security = ExposedSecurityDefinition
  thing.securityDefinitions = {
    [ExposedSecurityDefinition]: {
      scheme: 'bearer'
    }
  }
}

function toPublicThing (thing) {
  const publicThing = lodash.cloneDeep(thing)
  exposeSecurityDefinitions(publicThing)
  exposeInteractionAfforandances(publicThing)
  return publicThing
}

exports = module.exports = {
  toPublicThing,
  ExposedSecurityDefinition
}
