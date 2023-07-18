'use strict'

const { prisma, ThingAuthorizationScope } = require('../utils/prisma')
const { findTargets, findAffordances } = require('../utils/thing_description')
const { toExposedThing } = require('../utils/to_exposed_thing')

function getThingTypes (description) {
  if (description['@type'] !== undefined) {
    if (Array.isArray(description['@type'])) {
      return description['@type']
    }
    return [description['@type']]
  }
}

async function getThings (owner) {
  return prisma.thing.findMany({
    where: {
      OR: [
        { owner },
        {
          ThingAuthorizations: {
            every: {
              entityId: owner,
              scope: ThingAuthorizationScope.read
            }
          }
        }
      ]
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      title: true,
      types: true,
      owner: true,
      description: false
    }
  })
}

async function getThing (owner, id) {
  return prisma.thing.findFirst({
    where: {
      id,
      owner
      // OR: [
      //   { owner: sub },
      //   {
      //     ThingAuthorizations: {
      //       every: {
      //         entityId: sub,
      //         scope: ThingAuthorizationScope.read
      //       }
      //     }
      //   }
      // ]
    }
  })
}

async function createThing ({ owner, description, enableProxy, source }) {
  const data = {
    description,
    id: description.id,
    owner,
    title: description.title,
    types: getThingTypes(description),
    Affordances: {
      createMany: {
        data: findAffordances(description, { owner })
      }
    },
    ...(enableProxy && {
      source,
      description: toExposedThing(description),
      Targets: {
        createMany: {
          data: findTargets(description, { owner })
        }
      }
    })
  }

  return prisma.thing.create({
    data
  })
}

async function updateThing ({ owner, description, enableProxy, source }) {
  const data = {
    description,
    id: description.id,
    owner,
    title: description.title,
    types: getThingTypes(description),
    Affordances: {
      createMany: {
        data: findAffordances(description, { owner })
      }
    },
    ...(enableProxy && {
      source,
      description: toExposedThing(description),
      Targets: {
        createMany: {
          data: findTargets(description, { owner })
        }
      }
    })
  }

  return prisma.thing.update({
    where: {
      id: description.id,
      owner
    },
    data
  })
}

async function checkThingExistence (id) {
  return prisma.thing.exists({ id })
}

async function deleteThing ({ owner, id }) {
  return prisma.thing.delete({
    where: {
      id,
      owner
    }
  })
}

exports = module.exports = {
  getThings,
  getThing,
  createThing,
  updateThing,
  checkThingExistence,
  deleteThing
}