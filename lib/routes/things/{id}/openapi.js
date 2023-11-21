'use strict'

async function get (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    const openapi = await req.services.thing.findOneOpenApi(
      id,
      req.headers['x-tenant-id'],
      req.customerId || req.headers['x-customer-id']
    )
    return res.status(200).json(openapi)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}