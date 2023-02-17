'use strict'

function get (req, res, next) {
  res.status(201).json({
    version: process.env.npm_package_version
  })
}

exports = module.exports = {
  get
}
