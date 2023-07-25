'use strict'

async function put (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    res.json(await req.services.discovery.run(sub, req.auth.access_token))
  } catch (e) {
    next(e)
  }
}

async function get (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    res.json(await req.services.discovery.status(sub))
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  put,
  get
}
