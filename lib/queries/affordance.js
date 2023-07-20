'use strict'

const toArray = require('../utils/to_array')
const { prisma, PermissionScope } = require('../utils/prisma')

async function getAffordances ({
  owner,
  resolve = false,
  resolveThing = false,
  affordanceType,
  semanticType,
  thingId
}) {
  return prisma.affordance.findMany({
    where: {
      AND: {
        OR: [
          { owner },
          {
            Thing: {
              Permissions: {
                some: {
                  entityId: owner,
                  scope: PermissionScope.read
                }
              }
            }
          }
        ],
        ...(semanticType && {
          types: {
            hasSome: toArray(semanticType)
          }
        }),
        ...(affordanceType && {
          type: {
            in: toArray(affordanceType)
          }
        }),
        ...(thingId && {
          Thing: {
            id: {
              in: toArray(thingId)
            }
          }
        })
      }
    },
    select: {
      id: true,
      type: true,
      name: true,
      types: true,
      thingId: true,
      source: false,
      description: resolve,
      ...(resolveThing && {
        Thing: {
          select: {
            description: true
          }
        }
      })
    }
  })
}

exports = module.exports = {
  getAffordances
}
