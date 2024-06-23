'use strict'

const checkRoles = require('../../../utils/check_roles')

async function post (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    const openapi = await req.services.thing.assignCustomer(
      id,
      req.tenantId,
      req.customerId,
      req.body.customerId
    )
    return res.status(200).json(openapi)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  post: [checkRoles(['admin', 'customer']), post]
}
