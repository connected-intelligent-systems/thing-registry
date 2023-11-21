'use strict'

async function get (req, res, next) {
  try {
    const things = await req.services.thing.find(
      req.headers['x-tenant-id'],
      req.customerId || req.headers['x-customer-id'],
      req.query
    )
    res.status(200).json(things)
  } catch (e) {
    next(e)
  }
}

async function post (req, res, next) {
  try {
    const thing = await req.services.thing.create(
      req.body,
      req.headers['x-tenant-id'],
      req.customerId || req.headers['x-customer-id']
    )
    res.setHeader('Location', `/api/things/${encodeURIComponent(thing.id)}`)
    res.status(201).json({
      id: thing.id
    })
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  post,
  get
}
