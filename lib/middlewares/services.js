'use strict'

const services = require('../services')

exports = module.exports = (req, res, next) => {
  req.services = services
  next()
}
