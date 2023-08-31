'use strict'

const HttpDefaults = Object.freeze({
  readproperty: 'GET',
  writeproperty: 'PUT',
  invokeaction: 'POST',
  readallproperties: 'GET',
  writeallproperties: 'PUT',
  readmultipleproperties: 'GET',
  writemultipleproperties: 'PUT'
})

function getTypes (description) {
  if (description['@type'] !== undefined) {
    if (Array.isArray(description['@type'])) {
      return description['@type']
    }
    return [description['@type']]
  }
}

function getHttpMethod (form) {
  if (form['htv:methodName']) {
    return form['htv:methodName']
  }

  if (Array.isArray(form.description.op)) {
    return HttpDefaults[form.description.op[0]]
  }
  return HttpDefaults[form.description.op]
}

function getSecurity (form, thing) {
  if (form.security === undefined) {
    return Array.isArray(thing.security) ? thing.security : [thing.security]
  } else {
    return Array.isArray(form.security) ? form.security : [form.security]
  }
}

function getPublicForms (description, source) {
  return ['properties', 'events', 'actions']
    .map(type =>
      Object.keys(description[type] || {})
        .map(name =>
          description[type][name].forms
            .filter(form => form.public === true)
            .map((form, index) => ({
              type,
              name,
              index,
              description: form,
              uriVariables: description[type][name].uriVariables,
              source,
              security: getSecurity(form, description)
            }))
            .map(form => form.security.map(security => ({ ...form, security })))
            .flat()
        )
        .flat()
    )
    .flat()
}

function getSecurityDefinitions (description) {
  return Object.keys(description.securityDefinitions).map(name => ({
    name,
    scheme: description.securityDefinitions[name].scheme,
    description: description.securityDefinitions[name]
  }))
}

exports = module.exports = {
  getTypes,
  getHttpMethod,
  getPublicForms,
  getSecurityDefinitions
}
