'use strict'

async function get (req, res, next) {
  try {
    const permission = await req.services.permissions.findOne(
      req.params.id,
      req.auth.access_token
    )
    res.json(permission)
  } catch (e) {
    next(e)
  }
}

async function remove (req, res, next) {
  try {
    const permission = await req.services.permissions.delete(
      req.params.id,
      req.auth.access_token
    )
    res.json(permission)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get,
  delete: remove
}
