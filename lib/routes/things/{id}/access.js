'use strict'

async function get (req, res, next) {
  try {
    const permissions = await req.services.permissions.findOne(
      req.params.id,
      req.auth.access_token
    )
    res.json(permissions)
  } catch (e) {
    next(e)
  }
}

async function post (req, res, next) {}

exports = module.exports = {
  get,
  post
}
