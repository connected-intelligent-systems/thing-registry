'use strict'

async function get (req, res, next) {
  try {
    const tickets = await req.services.tickets.find(
      req.query,
      req.auth.access_token
    )
    res.json(tickets)
  } catch (e) {
    next(e)
  }
}

async function post (req, res, next) {
  try {
    await req.services.tickets.insert(
      req.body.resource,
      req.body.requester,
      req.body.scope,
      req.auth.access_token
    )
    res.send('OK')
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get,
  post
}
