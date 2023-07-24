'use strict'

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
  delete: remove
}
