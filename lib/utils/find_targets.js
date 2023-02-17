'use strict'

function getSecurity (target, thing) {
  if (target.security === undefined) {
    return thing.security
  }
  return [target.security]
}

function findTargetsForType (
  thing,
  type,
  { source, owner, authorized = false } = {}
) {
  return Object.keys(thing[type] || {})
    .map(key =>
      thing[type][key].forms.map(({ href, security }, index) => ({
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
      securityDefinitions: thing.securityDefinitions,
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

exports = module.exports = findTargets
