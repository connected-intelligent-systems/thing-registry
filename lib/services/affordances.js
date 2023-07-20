'use strict'

const { getAffordances } = require('../queries')

async function find (accessToken, query) {
  const { sub } = accessToken.content
  return getAffordances({
    owner: sub,
    ...query
  })
}

exports = module.exports = {
  find
}
