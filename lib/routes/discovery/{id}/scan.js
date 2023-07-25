'use strict'

async function post (req, res, next) {
  try {
    const { sub } = req.auth.access_token.content
    res.json(
      await req.services.discovery.startScan(
        req.params.id,
        sub,
        req.auth.access_token
      )
    )
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  post
}
