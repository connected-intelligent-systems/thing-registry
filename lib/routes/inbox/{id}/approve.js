'use strict'

async function post (req, res, next) {
  try {
    res.json(
      await req.services.inbox.approve(req.params.id, req.auth.access_token)
    )
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  post
}
