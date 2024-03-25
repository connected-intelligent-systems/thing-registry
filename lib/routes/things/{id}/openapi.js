'use strict'

const checkRoles = require('../../../utils/check_roles')

async function get (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    const openapi = await req.services.thing.findOneOpenApi(
      id,
      req.tenantId,
      req.customerId
    )
    return res.status(200).json(openapi)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get: [checkRoles(['admin', 'customer']), get]
}
