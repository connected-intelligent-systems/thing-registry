'use strict'

class HttpError extends Error {
  constructor (status, error, message, details) {
    super(message)
    this._error = error
    this._status = status
    this._details = details
  }

  get error () {
    return this._error
  }

  get status () {
    return this._status
  }

  get details () {
    return this._details
  }
}

class MissingTenantId extends HttpError {
  constructor () {
    super(400, 'tenant_id_missing', 'Missing Tenant Id')
  }
}

class MissingRoles extends HttpError {
  constructor () {
    super(400, 'roles_missing', 'Missing Roles')
  }
}

class MissingCustomerId extends HttpError {
  constructor () {
    super(400, 'customer_id_missing', 'Missing Customer Id')
  }
}

class InvalidDescription extends HttpError {
  constructor (info) {
    super(400, 'description_invalid', 'Invalid Thing Description', info)
  }
}

class InsufficientPermissions extends HttpError {
  constructor () {
    super(403, 'permissions_insufficient', 'Insufficient permissions')
  }
}

class InternalServerError extends HttpError {
  constructor () {
    super(500, 'unknown', 'Internal server error')
  }
}

class ThingNotFound extends HttpError {
  constructor () {
    super(404, 'thing_not_found', 'Thing not found')
  }
}

class ThingAlreadyExists extends HttpError {
  constructor () {
    super(409, 'thing_already_exists', 'Thing ID already exists')
  }
}

class FusekiSyncFailed extends HttpError {
  constructor (code, details) {
    super(
      code,
      'fuseki_sync_failed',
      'Synchronization with Fuseki failed',
      details
    )
  }
}

class JSONLdValidationFailed extends HttpError {
  constructor (details) {
    super(400, 'jsonld_validation_failed', 'JSONLd validation failed', details)
  }
}

exports = module.exports = {
  HttpError,
  MissingTenantId,
  MissingRoles,
  MissingCustomerId,
  InvalidDescription,
  InsufficientPermissions,
  InternalServerError,
  ThingNotFound,
  ThingAlreadyExists,
  FusekiSyncFailed,
  JSONLdValidationFailed
}
