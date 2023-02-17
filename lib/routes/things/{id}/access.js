'use strict'

async function get (req, res, next) {
  try {
    const permissions = await req.services.access.findOne(
      req.params.id,
      req.auth.access_token
    )
    res.json(permissions)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
