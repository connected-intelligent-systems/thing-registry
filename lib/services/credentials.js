'use strict'

const { prisma } = require('../db')
const {
  DescriptionNotFound,
  InvalidCredentials
} = require('../utils/http_errors')

/**
 * Validate the credentials sent by the user
 */
function validateCredentials (credentials, securityDefinitions) {
  return Object.keys(securityDefinitions).every(name => {
    const credential = credentials.find(
      credential => credential.security === name
    )
    const securityDefinition = securityDefinitions[name]

    if (credential !== undefined) {
      switch (securityDefinition.scheme) {
        case 'nosec': {
          return true
        }
        case 'basic': {
          if (
            credential.username !== undefined &&
            credential.password !== undefined
          ) {
            return true
          }
          return false
        }
        case 'apikey': {
          if (credential.apiKey !== undefined) {
            return true
          }
          return false
        }
        case 'bearer': {
          if (credential.token !== undefined) {
            return true
          }
          return false
        }
      }
    }

    return false
  })
}

/**
 * Map the credentials and security definitions to an object
 * @param {*} credentials
 * @param {*} securityDefinitions
 * @returns
 */

function mapCredentials (credentials, securityDefinitions) {
  return credentials.reduce((acc, credential) => {
    const { security, ...rest } = credential
    return {
      ...acc,
      [security]: {
        ...rest,
        securityDefinition: securityDefinitions[security]
      }
    }
  }, {})
}

/**
 * Return the credentials for the thing defined by id. The user
 * needs to be the owner of the thin.
 * @param {string} id - The id of the thing
 * @param {string} tenantId - The tenantId
 */
async function find (id, tenantId) {
  const exists = await prisma.thing.findFirst({
    select: {
      id: true
    },
    where: {
      id,
      tenantId
    }
  })

  if (exists === null) {
    throw new DescriptionNotFound()
  }

  return prisma.credential.findFirst({ where: { thingId: id, tenantId } })
}

/**
 * Update the credentials of a thing. The user
 * needs to be the owner of the thing.
 * @param {string} thingId - The id of the thing
 * @param {string} tenantId - The id of the tenant
 * @param {array} credentials - Array of credentials send by the user
 */
async function update (thingId, tenantId, credentials) {
  const thing = await prisma.thing.findFirst({
    where: {
      id: thingId,
      tenantId
    }
  })

  if (thing === null) {
    throw new DescriptionNotFound()
  }

  const securityDefinitions = thing.description.securityDefinitions
  const valid = validateCredentials(credentials, securityDefinitions)

  if (valid === false) {
    throw new InvalidCredentials()
  }

  const data = mapCredentials(credentials, securityDefinitions)

  return prisma.credential.upsert({
    where: {
      thingId,
      tenantId,
      tenantId_thingId: { tenantId, thingId }
    },
    create: {
      data,
      thingId,
      tenantId
    },
    update: {
      data,
      thingId,
      tenantId
    }
  })
}

exports = module.exports = {
  find,
  update
}
