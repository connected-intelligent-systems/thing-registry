'use strict'

async function get (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    const { sub } = req.auth.access_token.content
    const targets = await req.services.targets.find(id, sub)
    res.json(
      targets.map(target => ({
        thingId: target.thingId,
        type: target.type,
        name: target.name,
        index: target.index,
        security: target.security,
        authorized: target.authorized
      }))
    )
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
