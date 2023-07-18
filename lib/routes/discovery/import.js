'use strict'

async function put (req, res, next) {
  try {
    await req.services.discovery.importThings(req.body, req.auth.access_token)
    res.send('OK')
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  put
}
