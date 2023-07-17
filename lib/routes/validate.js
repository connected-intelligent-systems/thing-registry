'use strict'

const { InvalidDescription } = require('../utils/http_errors')
const { validate } = require('../validator')

//todo: remove later
async function post (req, res, next) {
  const valid = validate(req.body)
  if (!valid) {
    return next(new InvalidDescription(validate.errors))
  } else {
    res.status(201).send('OK')
  }
}

exports = module.exports = {
  post
}
