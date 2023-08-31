'use strict'

async function get (req, res, next) {
  try {
    const credentials = await req.services.credentials.find(
      req.params.id,
      req.params.tenantId
    )
    res.json(credentials || {})
  } catch (e) {
    next(e)
  }
}

async function put (req, res, next) {
  try {
    await req.services.credentials.update(
      req.params.id,
      req.params.tenantId,
      req.body
    )
    res.send('Credentials updated')
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get,
  put
}