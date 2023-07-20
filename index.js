'use strict'

const express = require('express')
const env = require('env-var')
const path = require('path')
const http = require('http')
const openapi = require('express-openapi')
const middlewares = require('./lib/middlewares')
const { setupDnssd } = require('./lib/utils/dnssd')
const { readYaml } = require('./lib/utils/yaml')
const { loadPlugins } = require('./lib/queries')

const {
  HttpError,
  InvalidOrMissingScope,
  InvalidOrMissingToken
} = require('./lib/utils/http_errors')

const Port = env
  .get('PORT')
  .default(8080)
  .asIntPositive()

/**
 * Binds and listens for connections for the express instance
 * @param {object} app - The express instance
 * @param {number} port - The port to bind the service to
 */
function listen (app, port) {
  return new Promise(resolve => {
    const server = app.listen(port, () => {
      resolve(server)
    })
  })
}

/**
 * Creates a express instance with middlewares
 */
function initExpress () {
  const app = express()
  app.use(middlewares)
  return app
}

/**
 * Creates the openapi documentation from the api-doc.yml
 */
function generateApiDoc () {
  const apiDoc = readYaml(path.join(__dirname, 'api-doc.yml'))
  if (process.env.production === undefined) {
    apiDoc.servers.push({
      url: 'http://localhost:8090/registry',
      description: 'Local development server'
    })
  }
  return {
    ...apiDoc,
    'x-express-openapi-validation-strict': true
  }
}

/**
 * Installs all routes to handle exposed things through the registry
 * @param {object} app - The express instance
 * @param {array} basePaths - Configured basePaths in the openapi doc (servers)
 */
function installExposedRoutes (app, basePaths) {
  basePaths.forEach(p => {
    app.all(
      `${p}/things/:id/affordances/:type/:name/:index/exposed`,
      async (req, res, next) => {
        if (req.auth) {
          const tokenScopes = req.auth.access_token.content.scope.split(' ')
          // if (tokenScopes.includes('registry.thing.execute')) {
          try {
            await req.services.forward(req, res, next)
          } catch (e) {
            next(e)
          }
          // } else {
          //   next(new InvalidOrMissingScope())
          // }
        } else {
          next(new InvalidOrMissingToken())
        }
      }
    )
  })
}

/**
 * Handle websocket connections for exposed things
 */
async function handleExposedWebsockets (app, req, socket, head) {
  const res = new http.ServerResponse(req)
  res.assignSocket(socket)
  res.on('finish', () => res.socket.destroy())
  req.head = head
  app(req, res)
}

/**
 * Installs a global error handler.
 * @param {object} app - The express instance
 */
function installErrorHandler (app) {
  app.use((error, req, res, next) => {
    // catch our own error instances
    if (error instanceof HttpError) {
      return res.status(error.status).json({
        status: error.status,
        error: error.error,
        message: error.message,
        details: error.details
      })
    }
    // catch unknown errors
    const { message, status, errors } = error
    if (status === undefined || status === 0) {
      return res.status(500).send('Internal server error')
    } else {
      // convert them if they have a status
      res.status(status).json({
        status: status,
        message,
        details: errors
      })
    }
  })
}

/**
 * Entry point fuunction that initializes and runs the server
 */
async function initServer () {
  const apiDoc = generateApiDoc()

  await loadPlugins()

  const framework = openapi.initialize({
    apiDoc,
    app,
    paths: path.resolve(__dirname, './lib/routes/'),
    exposeApiDocs: true,
    docsPath: '/.openapi',
    consumesMiddleware: {
      'application/json': express.json()
    },
    
    securityHandlers: {
      auth: (req, scopes) => {
        return true
        // if (req.auth) {
        //   const tokenScopes = req.auth.access_token.content.scope.split(' ')
        //   if (scopes.every(r => tokenScopes.includes(r))) {
        //     return true
        //   } else {
        //     throw new InvalidOrMissingScope()
        //   }
        // }
        // throw new InvalidOrMissingToken()
      }
    }
  })

  // we don't use openapi to describe the exposed thing endpoints
  // as openapi doesn't has the best tools to describe generic datatypes etc.
  installExposedRoutes(
    app,
    framework.basePaths.map(b => b.path)
  )

  // install the default error handler that handles the custom
  // httperror exception
  installErrorHandler(app)

  const server = await listen(app, Port)
  server.on('upgrade', (req, socket, head) =>
    handleExposedWebsockets(app, req, socket, head)
  )
  return server
}

const app = initExpress()
const promise = initServer()
  .then(server => {
    const port = server.address().port
    setupDnssd(port)
    console.log(`Started on port ${port}`)
    return port
  })
  .catch(e => {
    console.error(e)
    process.exit()
  })

async function getPort () {
  return promise
}

exports = module.exports = app
