'use strict'

async function put (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    await req.services.discovery.updateSettings(req.params.id, req.body, sub)
    res.send('Discovery settings updated')
  } catch (error) {
    next(error)
  }
}

async function get (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    res.json(await req.services.discovery.getSettings(req.params.id, sub))
  } catch (error) {
    next(error)
  }
}

exports = module.exports = {
  put,
  get
}
