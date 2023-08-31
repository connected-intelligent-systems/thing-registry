'use strict'

const env = require('env-var')
const URL = require('url').URL
const HttpsProxyAgent = require('https-proxy-agent')
const HttpProxyAgent = require('http-proxy-agent')
const HttpProxy = require('http-proxy')
const { isEqual } = require('lodash')
const createHttpCredentials = require('../utils/create_http_credentials')
const {
  TargetNotFound,
  ProtocolNotImplemented,
  MethodNotAllowed,
  ServiceUnavailable,
  InvalidQueryParameters
} = require('../utils/http_errors')
const models = require('../models')
const { prisma } = require('../db')
const { getHttpMethod } = require('../utils/thing_description')
const { validateCredentials } = require('../utils/credentials')

const ProxyTimeout = env
  .get('PROXY_TIMEOUT')
  .default(0)
  .asInt()
const IncomingTimeout = env
  .get('INCOMING_TIMEOUT')
  .default(0)
  .asInt()
const ProxyAddress = env.get('https_proxy').asString()
const httpsProxy = new HttpProxy({
  agent: ProxyAddress ? new HttpsProxyAgent(ProxyAddress) : undefined
})
const httpProxy = new HttpProxy({
  agent: ProxyAddress ? new HttpProxyAgent(ProxyAddress) : undefined
})

/**
 * Cleans up the header of the request.
 * @param {object} req - the request
 */
function cleanupHeaders (req) {
  delete req.headers['authorization']
  return req
}

/**
 * Checks if a protocol is secure
 * @param {string} protocol - Protocol to check
 */
function isSecureProtocol (protocol) {
  switch (protocol) {
    case 'https:':
    case 'wss:':
      return true
    default:
      return false
  }
}

/**
 * Builds the target url with query parameters
 */
function buildTargetUrl (href, queries = '') {
  const url = new URL(href)
  const encodedVariables = {
    ...Object.fromEntries(new URLSearchParams(url.search)),
    ...Object.fromEntries(new URLSearchParams(queries))
  }
  url.search = new URLSearchParams(encodedVariables).toString()
  return url.toString()
}

/**
 * Validates incoming request
 */
async function validatesHttpRequest (req, form) {
  if (getHttpMethod(form) !== req.method) {
    throw new MethodNotAllowed()
  }

  // check for uri variables
  if (Object.keys(req.query).length > 0 && !form.uriVariables) {
    throw new InvalidQueryParameters()
  }

  for (const key of Object.keys(req.query)) {
    const uriVariable = form.uriVariables[key]
    if (uriVariable === undefined) {
      throw new InvalidQueryParameters()
    }

    const value = req.query[key]
    if (Array.isArray(value) && uriVariable.type !== 'array') {
      throw new InvalidQueryParameters()
    }

    if (uriVariable.const) {
      if (!isEqual(value, uriVariable.const)) {
        throw new InvalidQueryParameters()
      }
    }
  }
}

/**
 * Handles forwarding for http.
 */
async function handleHttp (req, res, next, { forms, protocol }) {
  const proxy = isSecureProtocol(protocol) ? httpsProxy : httpProxy
  const result = createHttpCredentials(forms)
  const targetUrl = buildTargetUrl(forms[0].description.href, result.queries)
  return proxy.web(
    cleanupHeaders(req),
    res,
    {
      target: targetUrl,
      changeOrigin: true,
      ignorePath: true,
      ws: true,
      timeout: IncomingTimeout,
      proxyTimeout: ProxyTimeout,
      headers: result.headers
    },
    next
  )
}

/**
 * Get the credentials for a specific target. If this target was created from a plugin
 * and the plugin supports authentication.
 */
async function getCredentials (thingId, tenantId, form) {
  if (form.source !== undefined && form.source !== null) {
    const plugin = await models.plugin.findOne(form.source)
    if (plugin !== undefined && plugin.supportsAuthentication() === true) {
      const credentials = await plugin.module.authenticate(form, {
        readSettings: async () => {
          const { settings } = await prisma.pluginSettings.findFirst({
            where: {
              name: form.source,
              tenantId
            }
          })
          return settings
        }
      })

      // check the credentials returned from the plugin and update if valid
      const valid = validateCredentials(
        credentials,
        form.securityDefinition.description
      )
      if (valid === true) {
        await prisma.securityDefinition.update({
          where: {
            thingId_tenantId_name: {
              tenantId,
              thingId,
              name: form.security
            }
          },
          data: {
            credentials
          }
        })

        form.securityDefinition.credentials = credentials
      }
    }
  }
}

/**
 * Handles forwarding for exposed things. Currenlty only http forwarding is supported.
 */
async function forwardHttp (req, res, next) {
  const { tenantId, id, name, index, type } = req.params
  const forms = await prisma.publicForm.findMany({
    where: {
      tenantId,
      name,
      type,
      thingId: id,
      index: +index
    },
    include: {
      securityDefinition: true
    }
  })

  if (forms === null) {
    throw new TargetNotFound()
  }

  // fetch all credentials for the current target
  for (const form of forms) {
    await getCredentials(id, tenantId, form)
  }

  // forward requests
  const url = new URL(forms[0].description.href)
  switch (url.protocol) {
    case 'https:':
    case 'http:':
      validatesHttpRequest(req, forms[0])
      return handleHttp(req, res, next, {
        forms,
        protocol: url.protocol
      })
    default:
      throw new ProtocolNotImplemented(url.protocol.slice(0, -1))
  }
}

exports = module.exports = forwardHttp
