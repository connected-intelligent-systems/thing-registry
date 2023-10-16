'use strict'

const services = require('../services')

exports = module.exports = (req, res, next) => {
  console.log(req.headers)
  req.services = services
  next()
}
