'use strict'

async function get (req, res, next) {
  try {
    const things = await req.services.publicThing.find(
      req.headers['x-tenant-id'],
      req.query
    )
    res.status(200).json(things)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
