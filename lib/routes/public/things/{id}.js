'use strict'

async function get (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    const thing = await req.services.publicThing.findOne(id, req.tenantId)
    return res.status(200).json(thing.publicDescription)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
