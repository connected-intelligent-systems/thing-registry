'use strict'

const fetch = require('node-fetch')
const formurlencoded = require('form-urlencoded').default
const jwt = require('jsonwebtoken')
const buildQuery = require('../utils/build_query')

const {
  KeycloakHost,
  KeycloakRealm,
  ResourceClientId,
  ResourceClientSecret
} = require('../utils/keycloak')

let accessToken
let refreshToken

/**
 * Enum for different resource types
 * @readonly
 * @enum string
 */
const ResourceTypes = Object.freeze({
  Thing: 'urn:wot:resources:thing',
  Affordance: 'urn:wot:resources:affordance'
})

/**
 * Default scopes for resources
 */
const DefaultThingScopes = Object.freeze(['read', 'write', 'delete'])
const DefaultAffordanceScopes = Object.freeze(['execute'])

/**
 * Build a name from a target
 */
function buildNameFromTarget ({ thingId, name, type }) {
  return `${thingId}/${type}/${name}`
}

/**
 * Checks if a jwt token is expired
 * @param {string} token - jwt access token to check
 */
function isExpired (token) {
  if (token === undefined || Date.now() >= token.content.exp * 1000) {
    return true
  }
  return false
}

/**
 * Decodes both access and refresh token and stores it
 * @param {string} json - answer from authentication
 */
function storeTokens (json) {
  if (json.access_token !== undefined) {
    accessToken = {
      token: json.access_token,
      content: jwt.decode(json.access_token)
    }
  }
  if (json.refresh_token !== undefined) {
    refreshToken = {
      token: json.refresh_token,
      content: jwt.decode(json.refresh_token)
    }
  }
}

/**
 * Generates a PAT token
 */
async function authenticate () {
  const response = await fetch(
    `${KeycloakHost}/realms/${KeycloakRealm}/protocol/openid-connect/token`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: formurlencoded({
        client_id: ResourceClientId,
        client_secret: ResourceClientSecret,
        grant_type: 'client_credentials'
      })
    }
  )

  if (!response.ok) {
    throw Error('Unable to generate pat token')
  }

  storeTokens(await response.json())
}

/**
 * Refreshes a PAT token
 */
async function fetchAccessToken () {
  const response = await fetch(
    `${KeycloakHost}/realms/${KeycloakRealm}/protocol/openid-connect/token`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: formurlencoded({
        client_id: ResourceClientId,
        client_secret: ResourceClientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken.token
      })
    }
  )

  if (!response.ok) {
    throw Error('Unable to generate pat token')
  }

  storeTokens(await response.json())
}

/**
 * Returns a valid access token. Refreshes and authenticates if necessary
 */
async function getAccessToken () {
  if (isExpired(accessToken)) {
    if (isExpired(refreshToken)) {
      await authenticate()
    } else {
      await fetchAccessToken()
    }
  }
  return accessToken.token
}

/**
 * Creates a user managed resource.
 * @param {string} name - name of the resource
 * @param {string} user - id of the user
 * @param {string} type - either urn:wot:resources:property or urn:wot:resources:thing
 * @param {string} scopes - the scopes the resources provides
 */
async function create (name, user, type, attributes = {}, scopes) {
  const response = await fetch(
    `${KeycloakHost}/realms/${KeycloakRealm}/authz/protection/resource_set`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAccessToken()}`
      },
      method: 'POST',
      body: JSON.stringify({
        name,
        type,
        owner: user,
        ownerManagedAccess: true,
        resource_scopes: scopes,
        attributes
      })
    }
  )

  if (!response.ok) {
    throw Error('Unable to create resource')
  }

  return response.json()
}

/**
 * Creates a thing resource
 * @param {string} name - name of the resource
 * @param {string} user - id of the user
 */
async function createThing (name, user) {
  return create(name, user, ResourceTypes.Thing, undefined, DefaultThingScopes)
}

/**
 * Creates a affordance resource
 * @param {string} name - name of the resource
 * @param {string} user - id of the user
 */
async function createAffordance (name, user, attributes) {
  return create(
    name,
    user,
    ResourceTypes.Affordance,
    attributes,
    DefaultAffordanceScopes
  )
}

/**
 * Creates a resource for a thing affordance
 * @param {array} targets - targets of the array
 * @param {string} user - id of the user
 */
async function createAffordances (targets, user) {
  return Promise.all(
    targets
      .filter(target => target.index === 0)
      .map(target => {
        return createAffordance(buildNameFromTarget(target), user, {
          thingId: target.thingId,
          name: target.name
        })
      })
  )
}

/**
 * Update multiple property resources
 * @param {string} name - name of the resource (thing id)
 * @param {string} user - id of the user
 * @param {array} targets - array of the current properties
 */
async function updateResources (name, user, targets) {
  // get all permissions that start with name
  const results = await find({
    deep: true,
    name,
    exactName: false
  })

  // filter out thing type
  const affordances = results.filter(
    result => result.type !== ResourceTypes.Thing
  )
  const targetNames = targets.map(target => buildNameFromTarget(target))

  return Promise.all([
    ...affordances.map(affordance => {
      const includes = targetNames.includes(affordance.name)
      if (includes === false) {
        return deleteResource(affordance._id)
      }
      return Promise.resolve()
    }),
    // add new properties to keycloak after an update
    ...targets.map(target => {
      const found = affordances.find(
        property => property.name === buildNameFromTarget(target)
      )
      if (found === undefined) {
        return createAffordances(targets, user)
      }
      return Promise.resolve()
    })
  ])
}

/**
 * Delete a resource
 * @param {string} id - resource id of the resource to delete
 */
async function deleteResource (id) {
  const response = await fetch(
    `${KeycloakHost}/realms/${KeycloakRealm}/authz/protection/resource_set/${id}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAccessToken()}`
      },
      method: 'DELETE'
    }
  )

  if (!response.ok) {
    throw Error('Unable to delete resource')
  }
}

/**
 * Delete many resources by name
 * @param {string} name - name of the resource
 * @param {boolean} exactName - true if name should match exactly, false if it should only be contained
 */
async function deleteMany (name, exactName = false) {
  const resources = await find({
    name,
    exactName,
    deep: true
  })
  const regex = new RegExp(
    `(^${name}/(properties|actions|events)/.*)|^${name}$`
  )
  const thingResources = resources.filter(resource => {
    return regex.test(resource.name)
  })
  const promises = []
  for (const resource of thingResources) {
    promises.push(deleteResource(resource._id))
  }
  return Promise.allSettled(promises)
}

/**
 * Find resources by name, user and type
 * @param {Object} properties - An object.
 * @param {string} properties.name - Name of the searched resource
 * @param {string} properties.exactName - Name (properties.name) must be exact
 * @param {string} properties.deep - Includes more properties of the resource
 * @param {string} properties.type - Queries a specific resource type
 */
async function find ({
  name,
  exactName,
  deep,
  type,
  matchingUri,
  first,
  max
} = {}) {
  const query = buildQuery({
    name,
    exactName,
    deep,
    type,
    matchingUri
  })
  const response = await fetch(
    `${KeycloakHost}/realms/${KeycloakRealm}/authz/protection/resource_set?${query}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAccessToken()}`
      },
      method: 'GET'
    }
  )

  if (!response.ok) {
    throw new Error('Error fetching resource_set')
  }

  return response.json()
}

/**
 * Checks if a resource belongs to a user
 */
async function isOwner (user, thingId) {
  const owner = await getOwner(thingId)
  return owner.id === user
}

/**
 * Get the owner of a resource ids
 * @param {string} id - resource id
 */
async function getOwner (id) {
  const result = await find({
    name: id,
    exactName: true,
    deep: true
  })

  if (result.length === 0) {
    throw new Error('Error fetching owner')
  }

  return result[0].owner
}

exports = module.exports = {
  ResourceTypes,
  DefaultThingScopes,
  DefaultAffordanceScopes,
  create,
  createThing,
  createAffordances,
  updateResources,
  delete: deleteResource,
  deleteMany,
  find,
  isOwner,
  getOwner
}
