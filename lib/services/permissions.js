'use strict'

const { getPermissions, createPermission } = require('../queries')

async function find (accessToken) {
  const { sub } = accessToken.content
  return getPermissions(sub)
}

async function create (permission, accessToken) {
  const { sub } = accessToken.content
  return createPermission(sub, permission)
}

exports = module.exports = {
  find,
  create
}
