'use strict'

const { prisma } = require('../db')
const { validateCredentials } = require('../utils/credentials')
const {
  DescriptionNotFound,
  InvalidCredentials
} = require('../utils/http_errors')

/**
 * Return the credentials for the thing defined by id. The user
 * needs to be the owner of the thin.
 * @param {string} id - The id of the thing
 * @param {string} tenantId - The tenantId
 */
async function find (thingId, tenantId, security) {
  const securityDefinition = await prisma.securityDefinition.findFirst({
    where: {
      thingId,
      tenantId,
      name: security
    }
  })

  if (securityDefinition === null) {
    throw new DescriptionNotFound()
  }

  return securityDefinition.credentials
}

/**
 * Update the credentials of a thing. The user
 * needs to be the owner of the thing.
 * @param {string} thingId - The id of the thing
 * @param {string} tenantId - The id of the tenant
 * @param {string} security - The name of the security definition
 * @param {array} credentials - Array of credentials send by the user
 */
async function update (thingId, tenantId, security, credentials) {
  const securityDefinition = await prisma.securityDefinition.findFirst({
    where: {
      thingId,
      tenantId,
      name: security
    }
  })

  if (securityDefinition === null) {
    throw new DescriptionNotFound()
  }

  const valid = validateCredentials(
    credentials,
    securityDefinition.description
  )
  if (valid === false) {
    throw new InvalidCredentials()
  }

  return prisma.securityDefinition.update({
    where: {
      tenantId,
      thingId,
      name: security,
      thingId_tenantId_name: {
        tenantId,
        thingId,
        name: security
      }
    },
    data: {
      credentials
    }
  })
}

exports = module.exports = {
  find,
  update
}
