'use strict'

const models = require('../models')
const {
  InsufficientPermissions,
  DescriptionNotFound
} = require('../utils/http_errors')

async function findOne (id, accessToken) {
  const exists = await models.thing.existsById(id)
  if (exists === false) {
    throw new DescriptionNotFound()
  }

  // find all resources to a thing id
  const [owner, affordances] = await Promise.all([
    await models.resource.isOwner(accessToken.content.sub, id),
    await models.resource.find({ name: id, exactName: false, deep: true })
  ])

  // check if there are any permissions for the current user
  const permissions = await models.access.check({
    resource: affordances.map(a => a._id),
    token: accessToken.token
  })

  // if there are no permission we return a 403 error
  if (permissions === undefined) {
    throw new InsufficientPermissions()
  }

  return {
    owner,
    permissions: permissions.map(({ rsname: name, scopes }) => ({
      name,
      scopes
    }))
  }
}

exports = module.exports = {
  findOne
}
