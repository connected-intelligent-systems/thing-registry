'use strict'

const { exposeAffordance } = require('../utils/to_exposed_thing')

function convertAffordanceType (type) {
  switch (type) {
    case 'properties':
      return 'property'
    case 'events':
      return 'event'
    case 'actions':
      return 'action'
  }
}

function findAffordancesForType (thing, type, { source, user, username } = {}) {
  return Object.keys(thing[type] || {}).map(key => ({
    unexposed: thing[type][key],
    exposed: exposeAffordance(thing[type][key], thing.id, type, key),
    affordanceType: convertAffordanceType(type),
    types: thing[type][key]['@type'],
    name: key,
    source,
    user,
    username,
    thingId: thing.id,
    resourceId: `${thing.id}/${type}/${key}`
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
