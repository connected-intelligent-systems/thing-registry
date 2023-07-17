'use strict'

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function find (accessToken, query) {
  // todo: implement query
  const { sub } = accessToken.content
  return prisma.affordance.findMany({ 
    where: {
      owner: sub
    }, 
    select: {
      id: true,
      type: true,
      name: true,
      types: true,
      thingId: true,
      source: false,
      description: false,
      // Thing: {
      //   select: {
      //     description: true
      //   }
      // }
    }
  })
}

exports = module.exports = {
  find
}