'use strict'

const fetch = require('node-fetch')
const queryString = require('query-string')
const exchangeToken = require('../utils/exchange_token')

const { KeycloakHost, KeycloakRealm } = require("../utils/keycloak")

async function find ({ requester, resourceId, owner }, { token }) {
  const urlQuery = queryString.stringify({
    returnNames: true,
    requester,
    resourceId,
    owner
  })

  const response = await fetch(
    `${KeycloakHost}/auth/realms/${KeycloakRealm}/authz/protection/permission/ticket?${urlQuery}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${await exchangeToken(token)}`
      }
    }
  )

  return response.json()
}

async function insert ({ resource, requester, scope, token, requesterName }) {
  return fetch(
    `${KeycloakHost}/auth/realms/${KeycloakRealm}/authz/protection/permission/ticket`,
    {
      method: 'POST',
      body: JSON.stringify({
        resource,
        requester,
        requesterName,
        scopeName: scope,
        granted: true
      }),
      headers: {
        Authorization: `Bearer ${await exchangeToken(token)}`,
        'Content-Type': 'application/json'
      }
    }
  )
}

async function remove (ticketId, { token }) {
  return fetch(
    `${KeycloakHost}/auth/realms/${KeycloakRealm}/authz/protection/permission/ticket/${ticketId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${await exchangeToken(token)}`
      }
    }
  )
}

exports = module.exports = {
  find,
  insert,
  delete: remove
}
