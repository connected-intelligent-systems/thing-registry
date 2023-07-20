'use strict'

const { getPermission, removePermission } = require('../../queries')
const { PermissionNotFound } = require('../../utils/http_errors')

async function get (req, res, next) {
  try {
    const id = +req.params.id
    const { sub } = req.auth.access_token.content
    const permission = await getPermission({ owner: sub, id })

    if (permission === null) {
      throw new PermissionNotFound()
    }

    res.json(permission)
  } catch (error) {
    next(error)
  }
}

async function remove (req, res, next) {
  try {
    const id = +req.params.id
    const { sub } = req.auth.access_token.content

    try {
      await removePermission({
        owner: sub,
        id
      })
      res.send('Permission deleted')
    } catch (error) {
      throw new PermissionNotFound()
    }
  } catch (error) {
    next(error)
  }
}

exports = module.exports = {
  get,
  delete: remove
}
