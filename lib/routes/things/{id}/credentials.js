'use strict'

async function get (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    const credentials = await req.services.credentials.find(req.params.id, sub)
    res.json(credentials || {})
  } catch (e) {
    next(e)
  }
}

async function put (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    await req.services.credentials.update(req.params.id, sub, req.body)
    res.send('Credentials updated')
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get,
  put
}
