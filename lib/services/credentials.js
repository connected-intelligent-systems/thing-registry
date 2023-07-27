'use strict'

const models = require('../models')
const {
  DescriptionNotFound,
  InvalidCredentials
} = require('../utils/http_errors')

/**
 * Validate the credentials sent by the user
 */
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

/**
 * Return the credentials for the thing defined by id. The user
 * needs to be the owner of the thin.
 * @param {string} id - The id of the thing
 * @param {string} user - The id of the current user
 */
async function find (id, user) {
  const exists = await models.thing.existsById(id, user)
  if (exists === false) {
    throw new DescriptionNotFound()
  }

  return models.credentials.get(id)
}

/**
 * Update the credentials of a thing. The user
 * needs to be the owner of the thing.
 * @param {string} id - The id of the thing
 * @param {string} user - The id of the current user
 * @param {array} credentials - Array of credentials send by the user
 */
async function update (id, user, credentials) {
  const exists = await models.thing.existsById(id, user)
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

  return models.credentials.update(id, validatedCredentials)
}

exports = module.exports = {
  find,
  update
}
