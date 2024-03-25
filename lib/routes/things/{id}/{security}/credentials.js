'use strict'

const checkRoles = require('../../../../utils/check_roles')

async function get (req, res, next) {
  try {
    const credentials = await req.services.credentials.find(
      req.params.id,
      req.tenantId,
      req.customerId,
      req.params.security
    )
    res.json(credentials || {})
  } catch (e) {
    next(e)
  }
}

async function put (req, res, next) {
  try {
    await req.services.credentials.update(
      req.params.id,
      req.tenantId,
      req.customerId,
      req.params.security,
      req.body
    )
    res.send('Credentials updated')
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get: [checkRoles(['admin', 'customer']), get],
  put: [checkRoles(['admin', 'customer']), put]
}
