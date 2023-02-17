'use strict'

async function get (req, res, next) {
  try {
    const affordances = await req.services.affordances.find(
      req.auth.access_token,
      req.query
    )
    res.json(affordances)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
