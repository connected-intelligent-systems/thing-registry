'use strict'

async function get (req, res, next) {
  try {
    const permission = await req.services.permissions.eval(
      req.query,
      req.auth.access_token
    )
    res.json(permission)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
