'use strict'

async function put (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    await req.services.targets.authorize({
      ...req.params,
      user: sub,
      authorized: Boolean(req.body.authorized)
    })
    res.send('OK')
  } catch (e) {
    next(e)
  }
}

async function get (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    const target = await req.services.targets.findOne({
      ...req.params,
      sub
    })
    res.json({
      authorized: target.authorized,
      security: target.security
    })
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  put,
  get
}
