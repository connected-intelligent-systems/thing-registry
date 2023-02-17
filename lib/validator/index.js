'use strict'

const Ajv = require('ajv')
const formats = require('ajv-formats-draft2019/formats')
const schema = require('./td-schema.json')

// AJV does currently not support the iri-reference format
// as a workaround we simply validate standard urls here

const ajv = new Ajv({ jsonPointers: true, formats })
const validate = ajv.compile(schema)

exports = module.exports = {
  validate
}
