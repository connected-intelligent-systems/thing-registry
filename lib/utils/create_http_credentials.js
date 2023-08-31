'use strict'

const btoa = require('./btoa')
const buildQuery = require('./build_query')
const { SecurityMechanismNotImplemented } = require('./http_errors')

/**
 * Enum for different security types
 * @readonly
 * @enum string
 */
const SecurityTypes = Object.freeze({
  BearerSecurityScheme: 'bearer',
  BasicSecurityScheme: 'basic',
  APIKeySecurityScheme: 'apikey',
  NoSecurityScheme: 'nosec',
  PSKSecurityScheme: 'psk',
  OAuth2SecurityScheme: 'oauth2'
})

/**
 * Enum for different security location
 * @readonly
 * @enum string
 */
const SecurityLocation = Object.freeze({
  QueryLocation: 'query',
  CookieLocation: 'cookie',
  BodyLocation: 'body',
  HeaderLocation: 'header'
})

function encodeCredential ({ username = '', password = '' }) {
  return `Basic ${btoa(`${username}:${password}`)}`
}

function processBasicAuthentication (securityDefinition, credential) {
  const encodedCredential = encodeCredential(credential)
  if (encodedCredential !== undefined) {
    // header location is default -> 5.4 Default Value Definitions
    switch (securityDefinition.in || SecurityLocation.HeaderLocation) {
      case SecurityLocation.HeaderLocation:
        return {
          headers: {
            [securityDefinition.name || 'Authorization']: encodedCredential
          }
        }
      case SecurityLocation.QueryLocation:
        return {
          queries: {
            [securityDefinition.name || 'Authorization']: encodedCredential
          }
        }
      default:
        console.warn(
          `Unsupported security location ${securityDefinition.in} for ${securityDefinition.name}`
        )
    }
  }
}

function processBearerAuthentication (securityDefinition, credential) {
  if (credential !== null && credential.token !== undefined) {
    // header location is default -> 5.4 Default Value Definitions
    switch (securityDefinition.in || SecurityLocation.HeaderLocation) {
      case SecurityLocation.HeaderLocation:
        return {
          headers: {
            [securityDefinition.name ||
            'Authorization']: `Bearer ${credential.token}`
          }
        }
      case SecurityLocation.QueryLocation:
        return {
          queries: {
            [securityDefinition.name || 'Authorization']: `${credential.token}`
          }
        }
      default:
        console.warn(
          `Unsupported security location ${securityDefinition.in} for ${securityDefinition.name}`
        )
    }
  }
}

function processApiKeyAuthentication (securityDefinition, credential) {
  if (credential !== null && credential.apiKey !== undefined) {
    // header location is default -> 5.4 Default Value Definitions
    switch (securityDefinition.in || SecurityLocation.HeaderLocation) {
      case SecurityLocation.HeaderLocation:
        return {
          headers: {
            [securityDefinition.name || 'Authorization']: credential.apiKey
          }
        }
      case SecurityLocation.QueryLocation:
        return {
          queries: {
            [securityDefinition.name || 'Authorization']: credential.apiKey
          }
        }
      default:
        console.warn(
          `Unsupported security location ${securityDefinition.in} for ${securityDefinition.name}`
        )
    }
  }
}

function processNoSecAuthentication () {
  return {
    headers: {},
    queries: {}
  }
}

function createHttpCredentials (forms) {
  const results = forms
    .filter(form => form.securityDefinition.credentials !== null)
    .map(form => {
      const securityDefinition = form.securityDefinition.description
      switch (securityDefinition.scheme) {
        case SecurityTypes.BasicSecurityScheme:
          return processBasicAuthentication(
            securityDefinition,
            form.securityDefinition.credentials
          )
        case SecurityTypes.BearerSecurityScheme:
          return processBearerAuthentication(
            securityDefinition,
            form.securityDefinition.credentials
          )
        case SecurityTypes.APIKeySecurityScheme:
          return processApiKeyAuthentication(
            securityDefinition,
            form.securityDefinition.credentials
          )
        case SecurityTypes.NoSecurityScheme:
          return processNoSecAuthentication()
        default:
          throw new SecurityMechanismNotImplemented(securityDefinition.scheme)
      }
    })
  return {
    headers: Object.assign({}, ...results.map(o => o.headers)),
    queries: buildQuery(Object.assign({}, ...results.map(o => o.queries)))
  }
}

exports = module.exports = createHttpCredentials
