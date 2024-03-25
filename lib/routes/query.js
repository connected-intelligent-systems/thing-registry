'use strict'

const { PrismaClient, Prisma } = require('@prisma/client')
const { HttpError } = require('../utils/http_errors')

const prisma = new PrismaClient()

async function get (req, res, next) {
  try {
    if (req.query.jsonpath !== undefined) {
      const tenantId = req.tenantId
      const customerId = req.customerId
      const customerIdMatch = Prisma.sql` AND public."Thing"."customerId" = ${customerId}`
      const result = await prisma.$queryRaw`
        SELECT jsonb_path_query(description, ${
  req.query.jsonpath
}::jsonpath) AS result 
        FROM public."Thing" 
        WHERE public."Thing"."tenantId" = ${tenantId} ${
  customerId ? customerIdMatch : Prisma.empty
}`
      res.json(result)
    } else {
      throw new HttpError(400, 'Missing parameter')
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.meta.code === '42601') {
        return next(
          new HttpError(
            404,
            'query_invalid_jsonpath',
            'Invalid jsonpath',
            e.meta.message
          )
        )
      }
    }
    next(e)
  }
}

exports = module.exports = {
  get
}
