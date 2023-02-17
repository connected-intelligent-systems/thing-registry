'use strict'

const _ = require('lodash')

function fixSecuritySchema (securityDefinitions) {
  Object.keys(securityDefinitions).forEach(key => {
    delete securityDefinitions[key]['@id']
  })
}

function fixJsonSchemaTypes (document) {
  const schemas = [
    'object',
    'array',
    'boolean',
    'string',
    'number',
    'integer',
    'null'
  ]

  const type = document['@type']
  if (Array.isArray(type)) {
    const [intersection] = _.intersection(schemas, type)
    if (intersection) {
      document.type = intersection
      document['@type'] = document['@type'].filter(
        type => type !== intersection
      )
    }
  } else {
    if (schemas.includes(type)) {
      document.type = type
      delete document['@type']
    }
  }
}

function fixThingId (description) {
  description.id = description['@id']
  delete description['@id']
}

function fixSecurity (description) {
  // const { security, id } = description
  // description.security = security.map(sec => sec.replace(`${id}/`, ''))
}

function fixContext (description) {
  description['@context'] = [
    'https://www.w3.org/2019/wot/td/v1',
    {
      iot: 'http://iotschema.org/',
      schema: 'http://schema.org/',
      sense: 'http://sense-projekt.de/vocab/',
      rr: 'http://www.w3.org/ns/r2rml#',
      rml: 'http://semweb.mmlab.be/ns/rml#',
      ql: 'http://semweb.mmlab.be/ns/ql#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      htv: 'http://www.w3.org/2011/http#'
    }
  ]
}

function traverseDescription (description, id) {
  Object.keys(description).forEach(key => {
    if (key === '@type') {
      fixJsonSchemaTypes(description)
    }

    // todo: remove this here?
    if (key === 'securityDefinitions') {
      fixSecuritySchema(description[key])
    }

    if (typeof description[key] === 'object') {
      traverseDescription(description[key], id)
    }
  })

  return description
}

function fixFramedDescription (description) {
  fixThingId(description)
  fixSecurity(description)
  fixContext(description)
  traverseDescription(description, description.id)

  return description
}

function restoreIndices (description) {
  Object.keys(description).forEach(key => {
    if (key === 'https://www.w3.org/2019/wot/td#name') {
      description['@index'] = description[key][0]['@value']
      delete description[key]
    } else if (key === 'https://www.w3.org/2019/wot/td#path') {
      delete description[key]
    }

    if (typeof description[key] === 'object') {
      restoreIndices(description[key])
    }
  })
  return description
}

exports = module.exports = {
  fixFramedDescription,
  restoreIndices
}
