'use strict'

async function get (req, res, next) {
  try {
    res.json(await req.services.permissions.find(req.auth.access_token))
  } catch (error) {
    next(error)
  }
}

async function post (req, res, next) {
  try {
    res.json(
      await req.services.permissions.create(req.body, req.auth.access_token)
    )
  } catch (error) {
    next(error)
  }
}

exports = module.exports = {
  get,
  post
}
