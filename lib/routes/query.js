'use strict'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const { HttpError } = require('../utils/http_errors')

async function get (req, res, next) {
  try {
    if (req.query.jsonpath !== undefined) {
      // TODO: query only readable things
      // TODO: queries jsonpath for every thing: provide descriptions as one array?
      const result = await prisma.$queryRaw`
        SELECT jsonb_path_query(description, ${req.query.jsonpath}::jsonpath) AS result 
        FROM public."Thing"`

      try {
        res.json(result)
      } catch (e) {
        throw new HttpError(400, 'Syntax error: Invalid jsonpath')
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
