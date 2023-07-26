'use strict'

const { ExposedSecurityDefinition } = require('./to_exposed_thing')

function getTypes (description) {
  if (description['@type'] !== undefined) {
    if (Array.isArray(description['@type'])) {
      return description['@type']
    }
    return [description['@type']]
  }
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

function findTargetsForType (
  thing,
  type,
  { source, owner, authorized = false } = {}
) {
  return Object.keys(thing[type] || {})
    .map(key =>
      thing[type][key].forms
        .filter(({ security }) => security !== ExposedSecurityDefinition)
        .map(({ href, security }, index) => ({
          href,
          security,
          index,
          name: key
        }))
    )
    .flat()
    .map(target => ({
      ...target,
      thingId: thing.id,
      security: getSecurity(target, thing),
      securityDefinitions: getSecurityDefinitions(thing),
      type,
      source,
      owner,
      authorized
    }))
}

function findTargets (thing, options) {
  return [
    ...findTargetsForType(thing, 'properties', options),
    ...findTargetsForType(thing, 'events', options),
    ...findTargetsForType(thing, 'actions', options)
  ]
}

exports = module.exports = {
  findSecurityDefinitions,
  findTargets,
  getTypes
}
