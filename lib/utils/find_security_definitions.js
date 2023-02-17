'use strict'

function findSecurityDefinitions (thing) {
  return Object.keys(thing.securityDefinitions).map(name => {
    return {
      name,
      securityDefinition: thing.securityDefinitions[name],
      thingId: thing.id
    }
  })
}

exports = module.exports = findSecurityDefinitions
