'use strict'

async function get (req, res, next) {
  try {
    const things = await req.services.thing.find(
      req.auth.access_token,
      req.query,
      req.headers['x-forwarded-proto'] || req.protocol,
      req.headers.host,
      req.path
    )
    // things.things.map(thing => ({
    //   ...thing,
    //   href: `}://${
    //     req.headers.host
    //   }/api/things/${encodeURIComponent(thing.id)}`
    // }))

    res.status(200).json(things)
  } catch (e) {
    next(e)
  }
}

async function post (req, res, next) {
  try {
    const description = req.body
    await req.services.thing.create(description, req.auth.access_token)
    res.setHeader(
      'Location',
      `/api/things/${encodeURIComponent(description.id)}`
    )
    res.status(201).json({
      id: description.id
    })
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  post,
  get
}
