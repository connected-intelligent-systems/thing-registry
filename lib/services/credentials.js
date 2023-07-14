'use strict'

const models = require('../models')
const {
  DescriptionNotFound,
  InsufficientPermissions,
  InvalidCredentials
} = require('../utils/http_errors')

function validateCredentials (
  credentials,
  definition,
  validatedCredentials = {}
) {
  const credential = credentials.find(
    credential => credential.security === definition.name
  )
  if (credential !== undefined) {
    switch (definition.securityDefinition.scheme) {
      case 'nosec': {
        validatedCredentials[definition.name] = {}
        return true
      }
      case 'basic': {
        if (
          credential.username !== undefined &&
          credential.password !== undefined
        ) {
          validatedCredentials[definition.name] = {
            username: credential.username,
            password: credential.password
          }
          return true
        }
        return false
      }
      case 'apikey': {
        if (credential.apiKey !== undefined) {
          validatedCredentials[definition.name] = {
            apiKey: credential.apiKey
          }
          return true
        }
        return false
      }
      case 'bearer': {
        if (credential.token !== undefined) {
          validatedCredentials[definition.name] = {
            token: credential.token
          }
          return true
        }
        return false
      }
    }
  }
}

async function find (id, user) {
  const exists = await models.thing.existsById(id)
  if (exists === false) {
    throw new DescriptionNotFound()
  }

  const isOwner = await models.resource.isOwner(user, id)
  if (isOwner === true) {
    return models.credentials.get(id)
  } else {
    throw new InsufficientPermissions()
  }
}

async function update (id, user, credentials) {
  const exists = await models.thing.existsById(id)
  if (exists === false) {
    throw new DescriptionNotFound()
  }

  const validatedCredentials = {}
  const securityDefinitions = await models.securityDefinitions.find(id)
  const valid = securityDefinitions.every(securityDefinition =>
    validateCredentials(credentials, securityDefinition, validatedCredentials)
  )
  if (valid === false) {
    throw new InvalidCredentials()
  }

  const isOwner = await models.resource.isOwner(user, id)
  if (isOwner === true) {
    await models.credentials.update(id, validatedCredentials)
  } else {
    throw new InsufficientPermissions()
  }
}

exports = module.exports = {
  find,
  update
}
