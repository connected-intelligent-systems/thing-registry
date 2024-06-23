'use strict'

const { PrismaClient } = require('@prisma/client')
const env = require('env-var')

const EnablePrismaLogging = env
  .get('ENABLE_PRISMA_LOGGING')
  .default('false')
  .asBool()

const prisma = new PrismaClient({
  log: EnablePrismaLogging
    ? [
      {
        emit: 'event',
        level: 'query'
      }
    ]
    : undefined
})

if (EnablePrismaLogging) {
  prisma.$on('query', e => {
    console.log(`${e.query} ${e.params}`)
  })
}

exports = module.exports = {
  prisma
}
