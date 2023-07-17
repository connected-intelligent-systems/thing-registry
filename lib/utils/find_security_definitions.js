'use strict'

const { ExposedSecurityDefinition } = require('./to_exposed_thing')

function findSecurityDefinitions (thing) {
  return Object.keys(thing.securityDefinitions)
    .filter(name => name !== ExposedSecurityDefinition)
    .map(name => {
      return {
        name,
        securityDefinition: thing.securityDefinitions[name]
      }
    })
}

exports = module.exports = findSecurityDefinitions
