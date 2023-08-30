'use strict'

async function post (req, res, next) {
  try {
    res.json(
      await req.services.discovery.startScan(req.params.id, req.params.tenantId)
    )
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  post
}
