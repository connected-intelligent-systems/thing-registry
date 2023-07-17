'use strict'

const jsonata = require('jsonata')
const jsonld = require('jsonld')
const jsonpath = require('jsonpath')

const { HttpError } = require('../utils/http_errors')

// TODO: rework
async function get (req, res, next) {
  try {
    const things = await req.services.thing.find(req.auth.access_token, {
      ...req.query,
      resolve: true
    })
    if (req.query.jsonata !== undefined) {
      try {
        const expression = jsonata(req.query.jsonata)
        res.json(expression.evaluate(things.map(thing => thing.description)))
      } catch (e) {
        throw new HttpError(400, 'Syntax error: Invalid jsonata expression')
      }
    } else if (req.query.jsonpath !== undefined) {
      try {
        res.json(
          jsonpath.query(
            things.map(thing => thing.description),
            req.query.jsonpath
          )
        )
      } catch (e) {
        throw new HttpError(400, 'Syntax error: Invalid jsonpath')
      }
    } else if (req.query.frame !== undefined) {
      try {
        const framed = await jsonld.frame(
          things.map(thing => thing.description),
          JSON.parse(req.query.frame),
          {
            omitDefault: true
          }
        )
        res.json(framed)
      } catch (e) {
        throw new HttpError(400, 'Syntax error: Invalid jsonld frame')
      }
    } else {
      throw new HttpError(400, 'Missing parameter')
    }
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  get
}
