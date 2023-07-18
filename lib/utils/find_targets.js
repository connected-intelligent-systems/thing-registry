'use strict'

const { AffordanceType } = require('@prisma/client')

function convertAffordanceType (type) {
  switch (type) {
    case 'properties':
      return AffordanceType.property
    case 'events':
      return AffordanceType.event
    case 'actions':
      return AffordanceType.action
  }
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

function findTargetsForType (thing, type, { source, owner } = {}) {
  return Object.keys(thing[type] || {})
    .map(key =>
      thing[type][key].forms.map((target, index) => ({
        index,
        name: key,
        description: target,
        type: convertAffordanceType(type),
        source,
        owner
      }))
    )
    .flat()
}

function findTargets (thing, options) {
  return [
    ...findTargetsForType(thing, 'properties', options),
    ...findTargetsForType(thing, 'events', options),
    ...findTargetsForType(thing, 'actions', options)
  ]
}

exports = module.exports = findTargets
