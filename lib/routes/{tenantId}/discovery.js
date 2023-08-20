'use strict'

async function get (req, res, next) {
  try {
    res.json(await req.services.discovery.getDiscoveryPlugins())
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
