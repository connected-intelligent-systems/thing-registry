'use strict'

const { getPermissions, createPermission } = require('../queries')

async function get (req, res, next) {
  try {
    const { sub, preferred_username } = req.auth.access_token.content
    res.json(await getPermissions(sub))
  } catch (error) {
    next(error)
  }
}

async function post (req, res, next) {
  try {
    const { sub, preferred_username } = req.auth.access_token.content
    const { entityId, entityType, thingId, scope } = req.body
    res.json(
      await createPermission(sub, { entityId, entityType, thingId, scope })
    )
  } catch (error) {
    next(error)
  }
}

exports = module.exports = {
  get,
  post
}
