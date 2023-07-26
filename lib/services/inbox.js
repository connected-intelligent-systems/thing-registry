'use strict'

const models = require('../models')
const { ThingNotFoundError } = require('../utils/http_errors')
const thingService = require('./thing')

async function find (user, query) {
  return models.inbox.find(user, query)
}

async function findOne (id, accessToken, query) {
  const { sub } = accessToken.content
  return models.inbox.findOne(sub, id, { ...query })
}

async function approve (id, accessToken) {
  const { sub } = accessToken.content
  const thing = await models.inbox.findOne(sub, id)
  if (thing === null) {
    throw new ThingNotFoundError()
  }

  await thingService.create(thing.description, accessToken, {
    skipValidation: true,
    source: thing.source
  })
  await models.inbox.removeOne(sub, id)
}

exports = module.exports = {
  find,
  findOne,
  approve
}
