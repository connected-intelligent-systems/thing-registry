'use strict'

async function get (req, res, next) {
  try {
    res.json(
      await req.services.inbox.findOne(req.params.id, req.params.tenantId)
    )
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
