'use strict'

const env = require('env-var')
const jwt = require('jsonwebtoken')

const AccessTokenHeader = env
  .get('ACCESS_TOKEN_HEADER')
  .required(true)
  .default('x-forwarded-access-token')
  .asString()
const CustomerIdClaim = env
  .get('CUSTOMER_ID_CLAIM')
  .required(true)
  .default('customer_id')
  .asString()

exports = module.exports = (req, res, next) => {
  if (req.headers[AccessTokenHeader]) {
    const decodedJwt = jwt.decode(req.headers[AccessTokenHeader])
    const customerId = decodedJwt[CustomerIdClaim]
    if (customerId) {
      req.customerId = customerId
    }
  }
  next()
}
