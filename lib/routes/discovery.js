'use strict'

async function get (req, res, next) {
  try {
    res.json(await req.services.discovery.find())
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
