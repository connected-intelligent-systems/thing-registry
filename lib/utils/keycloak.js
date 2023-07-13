'use strict'

const env = require('env-var')

const KeycloakHost = env.get('KEYCLOAK_HOST').asString()
const KeycloakRealm = env.get('KEYCLOAK_REALM').asString()

const ResourceClientId = env.get('RESOURCE_CLIENT_ID').asString()
const ResourceClientSecret = env.get('RESOURCE_CLIENT_SECRET').asString()
const ResourceServerAudience = env.get('RESOURCE_SERVER_AUDIENCE').asString()

exports = module.exports = {
  KeycloakHost,
  KeycloakRealm,
  ResourceClientId,
  ResourceClientSecret,
  ResourceServerAudience
}
