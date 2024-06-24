'use strict'

/**
 * Represents an HTTP error.
 * @extends Error
 */
class HttpError extends Error {
  /**
   * Creates a new instance of HttpError.
   * @param {number} status - The HTTP status code.
   * @param {string} error - The error code.
   * @param {string} message - The error message.
   * @param {any} details - Additional error details.
   */
  constructor (status, error, message, details) {
    super(message)
    this._error = error
    this._status = status
    this._details = details
  }

  /**
   * Gets the error code.
   * @returns {string} The error code.
   */
  get error () {
    return this._error
  }

  /**
   * Gets the HTTP status code.
   * @returns {number} The HTTP status code.
   */
  get status () {
    return this._status
  }

  /**
   * Gets the additional error details.
   * @returns {any} The error details.
   */
  get details () {
    return this._details
  }
}

/**
 * Represents an HTTP error for missing tenant ID.
 * @extends HttpError
 */
class MissingTenantId extends HttpError {
  /**
   * Creates a new instance of MissingTenantId.
   */
  constructor () {
    super(400, 'tenant_id_missing', 'Missing Tenant Id')
  }
}

/**
 * Represents an HTTP error for missing roles.
 * @extends HttpError
 */
class MissingRoles extends HttpError {
  /**
   * Creates a new instance of MissingRoles.
   */
  constructor () {
    super(400, 'roles_missing', 'Missing Roles')
  }
}

/**
 * Represents an HTTP error for missing customer ID.
 * @extends HttpError
 */
class MissingCustomerId extends HttpError {
  /**
   * Creates a new instance of MissingCustomerId.
   */
  constructor () {
    super(400, 'customer_id_missing', 'Missing Customer Id')
  }
}

/**
 * Represents an HTTP error for invalid thing description.
 * @extends HttpError
 */
class InvalidDescription extends HttpError {
  /**
   * Creates a new instance of InvalidDescription.
   * @param {any} info - Additional information about the error.
   */
  constructor (info) {
    super(400, 'description_invalid', 'Invalid Thing Description', info)
  }
}

/**
 * Represents an HTTP error for insufficient permissions.
 * @extends HttpError
 */
class InsufficientPermissions extends HttpError {
  /**
   * Creates a new instance of InsufficientPermissions.
   */
  constructor () {
    super(403, 'permissions_insufficient', 'Insufficient permissions')
  }
}

/**
 * Represents an HTTP error for internal server error.
 * @extends HttpError
 */
class InternalServerError extends HttpError {
  /**
   * Creates a new instance of InternalServerError.
   */
  constructor () {
    super(500, 'unknown', 'Internal server error')
  }
}

/**
 * Represents an HTTP error for thing not found.
 * @extends HttpError
 */
class ThingNotFound extends HttpError {
  /**
   * Creates a new instance of ThingNotFound.
   */
  constructor () {
    super(404, 'thing_not_found', 'Thing not found')
  }
}

/**
 * Represents an HTTP error for thing already exists.
 * @extends HttpError
 */
class ThingAlreadyExists extends HttpError {
  /**
   * Creates a new instance of ThingAlreadyExists.
   */
  constructor () {
    super(409, 'thing_already_exists', 'Thing ID already exists')
  }
}

/**
 * Represents an HTTP error for failed synchronization with Fuseki.
 * @extends HttpError
 */
class FusekiSyncFailed extends HttpError {
  /**
   * Creates a new instance of FusekiSyncFailed.
   * @param {number} code - The error code.
   * @param {any} details - Additional error details.
   */
  constructor (code, details) {
    super(
      code,
      'fuseki_sync_failed',
      'Synchronization with Fuseki failed',
      details
    )
  }
}

/**
 * Represents an HTTP error for failed JSONLd validation.
 * @extends HttpError
 */
class JSONLdValidationFailed extends HttpError {
  /**
   * Creates a new instance of JSONLdValidationFailed.
   * @param {any} details - Additional error details.
   */
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
