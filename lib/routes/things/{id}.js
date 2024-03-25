'use strict'

const checkRoles = require('../../utils/check_roles')

async function get (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    const thing = await req.services.thing.findOne(
      id,
      req.tenantId,
      req.customerId
    )
    return res.status(200).json(thing.description)
  } catch (e) {
    next(e)
  }
}

async function put (req, res, next) {
  try {
    const description = {
      ...req.body,
      id: decodeURIComponent(req.params.id)
    }
    await req.services.thing.update(description, req.tenantId, req.customerId)
    res.send('Description updated')
  } catch (e) {
    next(e)
  }
}

async function remove (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    await req.services.thing.remove(id, req.tenantId, req.customerId)
    return res.send('Description deleted')
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  put: [checkRoles(['admin', 'customer']), put],
  get: [checkRoles(['admin', 'customer']), get],
  delete: [checkRoles(['admin', 'customer']), remove]
}
