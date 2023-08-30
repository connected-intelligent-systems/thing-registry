'use strict'

async function get (req, res, next) {
  try {
    res.json(await req.services.inbox.find(req.params.tenantId, req.query))
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
