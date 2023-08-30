'use strict'

async function put (req, res, next) {
  try {
    await req.services.discovery.updateDiscoveryPluginSettings(
      req.params.id,
      req.body,
      req.params.tenantId
    )
    res.send('Discovery settings updated')
  } catch (error) {
    next(error)
  }
}

async function get (req, res, next) {
  try {
    res.json(
      await req.services.discovery.getDiscoveryPluginSettings(
        req.params.id,
        req.params.tenantId
      )
    )
  } catch (error) {
    next(error)
  }
}

exports = module.exports = {
  put,
  get
}
