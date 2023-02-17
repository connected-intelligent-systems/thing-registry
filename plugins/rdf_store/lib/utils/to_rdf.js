'use strict'

const jsonld = require('jsonld')
const _ = require('lodash')
const jsonpath = require('jsonpath')
const documentLoader = require('./jsonld_custom_loader')

async function expand (description) {
  const expanded = await jsonld.expand(description, {
    documentLoader,
    base: description.id
  })

  // a bug in jsonld prevents the usage of urns as base uris
  // we need to traverse over all @id and replace all urn:/

  return expanded
}

async function toRDF (description) {
  const expanded = await expand(description)

  fixType(expanded)
  fixSecurityDefintions(expanded, description.id)
  fixProperties(expanded)
  fixActions(expanded)
  fixEvents(expanded)

  return jsonld.toRDF(expanded, { format: 'application/n-quads' })
}

function addPath (obj, path) {
  _.set(
    obj,
    ['https://www.w3.org/2019/wot/td#path', 0, '@value'],
    path.length > 0 ? jsonpath.stringify(path) : ''
  )
}

function addName (obj) {
  _.set(
    obj,
    ['https://www.w3.org/2019/wot/td#name', 0, '@value'],
    obj['@index']
  )
}

/*
  When transforming from jsonld to rdf, the index get lost. What we
  need is '4.6.1.1 Property-based data indexing' from the JSON-LD Editor Draft.
  So we may skip this part in the future.

  Right now we add:
    - the name of the property as td:name for specific paths
    - we also add the current path for all properties (to make searching easier)

  TOOD: clean this up, looks totally messy
*/

function annotateProperties (obj, path = ['$']) {
  const type = _.get(obj, [
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    0,
    '@id'
  ])

  addPath(obj, path)

  if (obj['@index'] !== undefined) {
    addName(obj)
  }

  if (obj['https://www.w3.org/2019/wot/td#hasUriTemplateVariable']) {
    obj['https://www.w3.org/2019/wot/td#hasUriTemplateVariable'].forEach(
      variable => {
        addName(variable)
      }
    )
  }

  switch (type) {
    case 'https://www.w3.org/2019/wot/json-schema#ObjectSchema':
      if (
        obj['https://www.w3.org/2019/wot/json-schema#properties'] !== undefined
      ) {
        obj['https://www.w3.org/2019/wot/json-schema#properties'].forEach(
          property => {
            annotateProperties(property, [
              ...path,
              property[
                'https://www.w3.org/2019/wot/json-schema#propertyName'
              ][0]['@value']
            ])
          }
        )
      }
      break

    case 'https://www.w3.org/2019/wot/json-schema#ArraySchema':
      if (obj['https://www.w3.org/2019/wot/json-schema#items'] !== undefined) {
        obj['https://www.w3.org/2019/wot/json-schema#items'].forEach(
          (item, index) => {
            annotateProperties(item, [...path, index])
          }
        )
      }
      break

    default:
      addPath(obj, path)
      if (obj['@index'] !== undefined) {
        addName(obj)
      }
      break
  }
}

function fixType (expanded) {
  const types = _.get(expanded, [0, '@type'], [])
  const ThingType = 'https://www.w3.org/2019/wot/td#Thing'

  if (!types.includes(ThingType)) {
    if (expanded[0]['@type']) {
      expanded[0]['@type'].push(ThingType)
    } else {
      expanded[0]['@type'] = [ThingType]
    }
  }
}

function fixSecurityDefintions (expanded, id) {
  _.get(
    expanded,
    [0, 'https://www.w3.org/2019/wot/td#securityDefinitions'],
    []
  ).forEach(property => {
    addName(property)
    _.set(property, ['@id'], `${id}/${property['@index']}`)
  })
}

function fixProperties (expanded) {
  _.get(
    expanded,
    [0, 'https://www.w3.org/2019/wot/td#hasPropertyAffordance'],
    []
  ).forEach(property => {
    annotateProperties(property)
    fixForms(property, expanded, 'property')
  })
}

function fixActions (expanded) {
  _.get(
    expanded,
    [0, 'https://www.w3.org/2019/wot/td#hasActionAffordance'],
    []
  ).forEach(action => {
    const inputSchema = _.get(action, [
      'https://www.w3.org/2019/wot/td#hasInputSchema',
      0
    ])
    if (inputSchema !== undefined) {
      annotateProperties(inputSchema)
    }
    const outputSchema = _.get(action, [
      'https://www.w3.org/2019/wot/td#hasOutputSchema',
      0
    ])
    if (outputSchema !== undefined) {
      annotateProperties(outputSchema)
    }
    annotateProperties(action)
    fixForms(action, expanded, 'action')
  })
}

function fixEvents (expanded) {
  _.get(
    expanded,
    [0, 'https://www.w3.org/2019/wot/td#hasEventAffordance'],
    []
  ).forEach(event => {
    const schema = _.get(event, [
      'https://www.w3.org/2019/wot/td#hasNotificationSchema',
      0
    ])
    if (schema !== undefined) {
      annotateProperties(schema)
    }
    annotateProperties(event)
    fixForms(event, expanded, 'event')
  })
}

function fixForms (affordance, expanded, type) {
  const id = expanded[0]['@id']
  const name =
    affordance['@index'] ||
    affordance['https://www.w3.org/2019/wot/json-schema#propertyName'][0][
      '@value'
    ]
  affordance['https://www.w3.org/2019/wot/td#hasForm'].forEach(
    (form, index) => {
      form['@id'] = `${id}/${type}/${name}/forms/${index}`
    }
  )
}

exports = module.exports = toRDF
