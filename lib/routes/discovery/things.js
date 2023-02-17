'use strict'

async function get (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    res.json(await req.services.discovery.find(sub, req.query))
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
