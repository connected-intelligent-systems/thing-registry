'use strict'

async function get (req, res, next) {
  try {
    res.json(await req.services.plugin.find())
  } catch (error) {
    next(error)
  }
}

exports = module.exports = {
  get
}
