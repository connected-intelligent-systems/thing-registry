'use strict'

const checkRoles = require('../utils/check_roles')

async function get (req, res, next) {
  try {
    const things = await req.services.thing.find(
      req.tenantId,
      req.customerId,
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
      req.tenantId,
      req.customerId
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
  post: [checkRoles(['admin', 'customer']), post],
  get: [checkRoles(['admin', 'customer']), get]
}
