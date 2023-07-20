'use strict'

async function get (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    return res.json(await req.services.plugin.findOne(req.params.id, sub))
  } catch (error) {
    next(error)
  }
}

exports = module.exports = {
  get
}
