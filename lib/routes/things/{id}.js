'use strict'

async function get (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    const thing = await req.services.thing.findOne(
      id,
      req.headers['x-tenant-id'],
      req.customerId || req.headers['x-customer-id']
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
    await req.services.thing.update(
      description,
      req.headers['x-tenant-id'],
      req.customerId || req.headers['x-customer-id']
    )
    res.send('Description updated')
  } catch (e) {
    next(e)
  }
}

async function remove (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    await req.services.thing.remove(
      id,
      req.headers['x-tenant-id'],
      req.customerId || req.headers['x-customer-id']
    )
    return res.send('Description deleted')
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  put,
  get,
  delete: remove
}
