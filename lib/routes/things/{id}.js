'use strict'

async function get (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    const handleJson = async function () {
      try {
        const thing = await req.services.thing.findOne(
          id,
          req.auth.access_token,
          req.query
        )
        res.set('content-type', 'application/td+json')
        return res.status(200).json(thing.description)
      } catch (e) {
        next(e)
      }
    }
    const handleCustom = async function () {
      try {
        const plugins = await req.services.plugin.findWithCustomTypes()
        for (const plugin of plugins) {
          const result = req.accepts(plugin.customTypes)
          if (result !== false) {
            if (plugin.module.get !== undefined) {
              res.set('content-type', result)
              return res.send(await plugin.module.get(id, result))
            }
          }
        }
        res.status(406).send('Not Acceptable')
      } catch (e) {
        next(e)
      }
    }

    return res.format({
      'application/json': async () => {
        await handleJson()
      },
      'application/ld+json': async () => {
        await handleJson()
      },
      'application/td+json': async () => {
        await handleJson()
      },
      default: async () => {
        await handleCustom()
      }
    })
  } catch (e) {
    next(e)
  }
}

async function put (req, res, next) {
  try {
    const description = {
      ...req.body,
      id: decodeURIComponent(req.params.id)
    }
    await req.services.thing.update(description, req.auth.access_token)
    res.send('Description updated')
  } catch (e) {
    next(e)
  }
}

async function remove (req, res, next) {
  try {
    const id = decodeURIComponent(req.params.id)
    await req.services.thing.remove(id, req.auth.access_token)
    return res.send('Description deleted')
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  put,
  get,
  delete: remove
}
