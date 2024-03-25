'use strict'

const http = require('http')
const env = require('env-var')

const FUSEKI_URL = env
  .get('FUSEKI_URL')
  .required()
  .asString()
const FusekiUsername = env
  .get('FUSEKI_USERNAME')
  .default('admin')
  .asString()
const FusekiPassword = env
  .get('FUSEKI_PASSWORD')
  .required(true)
  .asString()

const Authorization =
  'Basic ' +
  Buffer.from(FusekiUsername + ':' + FusekiPassword).toString('base64')

async function post (req, res, next) {
  try {
    const tenantId = req.tenantId
    const customerId = req.customerId
    const url = `${FUSEKI_URL}/${tenantId}${
      customerId ? `-${customerId}` : ''
    }/sparql`

    const body = new URLSearchParams()
    body.append('query', req.body.query)
    body.toString()

    const headers = {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization
    }

    if (req.headers['accept']) {
      headers['accept'] = req.headers['accept']
    }

    const fusekiRequest = http
      .request(url, {
        method: 'POST',
        headers
      })
      .on('response', function (r) {
        res.writeHead(r.statusCode, r.statusMessage, r.headers)
        r.pipe(res)
      })
      .on('error', next)

    req.pipe(fusekiRequest)

    fusekiRequest.write(body.toString())
    fusekiRequest.end()
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  post
}
