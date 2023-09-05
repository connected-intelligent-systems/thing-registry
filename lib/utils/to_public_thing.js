'use strict'

const env = require('env-var')
const lodash = require('lodash')
const URL = require('url').URL

const BaseUrl = env
  .get('BASE_URL')
  .default('/registry')
  .asString()
const ExposedSecurityDefinition = 'public_sc'

function exposeHttpForm (form, path, url) {
  form.href = `${BaseUrl}${path}${url.search}`
  return form
}

function exposeForm (id, form, index, type, name, base, tenantId) {
  const path = `/${tenantId}/public/things/${encodeURIComponent(
    id
  )}/${type}/${name}/${index}`
  const url = new URL(form.href, base)

  switch (url.protocol) {
    case 'http:':
    case 'https:':
      return exposeHttpForm(form, path, url)
    default:
      throw new Error(`Unsupported protocol ${url.protocol} for public form`)
  }
}

function exposeAffordance (thing, type, tenantId) {
  if (thing[type] === undefined) {
    return
  }

  Object.keys(thing[type]).forEach(name => {
    thing[type][name].forms = thing[type][name].forms
      .filter(form => form.public === true)
      .map((form, index) =>
        exposeForm(
          thing.id,
          lodash.cloneDeep(form),
          index,
          type,
          name,
          thing.base,
          tenantId
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

function exposeInteractionAfforandances (thing, tenantId) {
  ['properties', 'actions', 'events'].forEach(type =>
    exposeAffordance(thing, type, tenantId)
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

function toPublicThing (thing, tenantId) {
  const publicThing = lodash.cloneDeep(thing)
  exposeSecurityDefinitions(publicThing)
  exposeInteractionAfforandances(publicThing, tenantId)
  return publicThing
}

exports = module.exports = {
  toPublicThing
}
