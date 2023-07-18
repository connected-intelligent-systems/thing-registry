'use strict'

const { getAffordances } = require('../queries')

async function find (accessToken, query) {
  // todo: implement query
  const { sub } = accessToken.content
  return getAffordances(sub)
}

exports = module.exports = {
  find
}
