'use strict'

async function get (req, res, next) {
  try {
    const permissions = await req.services.permissions.find(
      req.query,
      req.auth.access_token
    )
    res.json(permissions)
  } catch (e) {
    next(e)
  }
}

async function post (req, res, next) {
  try {
    await req.services.permissions.insert(req.body, req.auth.access_token)
    res.send('OK')
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get,
  post
}
