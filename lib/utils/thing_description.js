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
  let security

  if (form.security === undefined) {
    security = Array.isArray(thing.security)
      ? thing.security
      : [thing.security]
  } else {
    security = Array.isArray(form.security) ? form.security : [form.security]
  }

  return security.filter(
    name => thing.securityDefinitions[name].scheme !== 'nosec'
  )
}

function getPublicForms (description, source) {
  return ['properties', 'events', 'actions']
    .map(type =>
      Object.keys(description[type])
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
            .flat()
        )
        .flat()
    )
    .flat()
}

exports = module.exports = {
  getTypes,
  getHttpMethod,
  getPublicForms
}
