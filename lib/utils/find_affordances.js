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

function findAffordancesForType (thing, type, { source, owner } = {}) {
  return Object.keys(thing[type] || {}).map(key => ({
    description: thing[type][key],
    type: convertAffordanceType(type),
    types: thing[type][key]['@type'] ?? [],
    name: key,
    source,
    owner,
    // thingId: thing.id,
    id: `${thing.id}/${type}/${key}`
  }))
}

function findAffordances (thing, options) {
  return [
    ...findAffordancesForType(thing, 'properties', options),
    ...findAffordancesForType(thing, 'events', options),
    ...findAffordancesForType(thing, 'actions', options)
  ]
}

exports = module.exports = findAffordances
