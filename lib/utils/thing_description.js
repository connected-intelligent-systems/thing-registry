'use strict'

const { ExposedSecurityDefinition } = require('./to_exposed_thing')

const PropertiesReadOps = Object.freeze([
  'readproperty',
  'readallproperties',
  'readmultipleproperties'
])

const PropertiesWriteOps = Object.freeze([
  'writeproperty',
  'writeallproperties',
  'writemultipleproperties'
])

const HttpMethods = Object.freeze({
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'POST',
  PATCH: 'PATCH'
})

function getTypes (description) {
  if (description['@type'] !== undefined) {
    if (Array.isArray(description['@type'])) {
      return description['@type']
    }
    return [description['@type']]
  }
}

function getHttpMethod (form, type) {
  if (form['htv:methodName']) {
    return form['htv:methodName']
  }

  // default values see https://www.w3.org/TR/wot-thing-description11/#http-binding-assertions
  switch (type) {
    case 'properties':
      const op = Array.isArray(form.op) ? form.op : [form.op]
      if (op.some(o => PropertiesWriteOps.includes(o))) {
        return HttpMethods.PUT
      }

      return HttpMethods.GET

    case 'actions':
      return HttpMethods.POST

    case 'events':
      return HttpMethods.POST
  }
}

function getHttpBindingSettings (form, type) {
  return {
    http: {
      headers: form['htv:headers'],
      method: getHttpMethod(form, type)
    }
  }
}

function getProtocolBindingSettings (form, type) {
  const url = new URL(form.href)
  switch (url.protocol) {
    case 'http:':
    case 'https:':
      return getHttpBindingSettings(form, type)
  }
  return {}
}

function findSecurityDefinitions (thing) {
  return Object.keys(thing.securityDefinitions)
    .filter(name => name !== ExposedSecurityDefinition)
    .map(name => {
      return {
        name,
        securityDefinition: thing.securityDefinitions[name],
        thingId: thing.id
      }
    })
}

function getSecurity (target, thing) {
  if (target.security === undefined) {
    return Array.isArray(thing.security) ? thing.security : [thing.security]
  }
  return Array.isArray(target.security) ? target.security : [target.security]
}

function getSecurityDefinitions (thing) {
  const { [ExposedSecurityDefinition]: _, ...rest } = thing.securityDefinitions
  return rest
}

function findFormsForAffordanceType (thing, type, { source, owner } = {}) {
  return Object.keys(thing[type] || {})
    .map(key =>
      thing[type][key].forms
        .filter(({ security }) => security !== ExposedSecurityDefinition)
        .map((form, index) => ({
          index,
          href: form.href,
          security: form.security,
          contentType: form.contentType,
          name: key,
          uriVariables: thing[type][key].uriVariables,
          ...getProtocolBindingSettings(form, type)
        }))
    )
    .flat()
    .map(form => ({
      ...form,
      thingId: thing.id,
      security: getSecurity(form, thing),
      securityDefinitions: getSecurityDefinitions(thing),
      type,
      source,
      owner
    }))
}

function findForms (thing, options) {
  return [
    ...findFormsForAffordanceType(thing, 'properties', options),
    ...findFormsForAffordanceType(thing, 'events', options),
    ...findFormsForAffordanceType(thing, 'actions', options)
  ]
}

exports = module.exports = {
  findSecurityDefinitions,
  findForms,
  getTypes
}
