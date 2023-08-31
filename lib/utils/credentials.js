'use strict'

/**
 * Validate the credentials sent by the user
 */
function validateCredentials (credentials, securityDefinition) {
  if (credentials !== undefined) {
    switch (securityDefinition.scheme) {
      case 'nosec': {
        return true
      }
      case 'basic': {
        if (
          credentials.username !== undefined &&
          credentials.password !== undefined
        ) {
          return true
        }
        return false
      }
      case 'apikey': {
        if (credentials.apiKey !== undefined) {
          return true
        }
        return false
      }
      case 'bearer': {
        if (credentials.token !== undefined) {
          return true
        }
        return false
      }
    }
  }

  return false
}

exports = module.exports = {
  validateCredentials
}
