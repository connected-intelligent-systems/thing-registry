const chai = require('chai')
const createCredentials = require('../../lib/utils/create_http_credentials')

const expect = chai.expect
const should = chai.should()

describe('Utils', () => {
  describe('create_http_credentials', () => {
    it('create header credentials for apikey scheme with default name', async () => {
      const credentials = {
        apiKeySecurityScheme: {
          apiKey: 'test-key'
        }
      }
      const target = {
        security: ['apiKeySecurityScheme'],
        securityDefinitions: {
          apiKeySecurityScheme: {
            in: 'header',
            scheme: 'apikey'
          }
        }
      }
      const result = createCredentials(credentials, target)
      result.should.be.a('object')
      expect(result).to.deep.equal({
        headers: {
          Authorization: 'test-key'
        },
        queries: ''
      })
    })

    it('create header credentials for apikey scheme with custom name', async () => {
      const credentials = {
        apiKeySecurityScheme: {
          apiKey: 'test-key'
        }
      }
      const target = {
        security: ['apiKeySecurityScheme'],
        securityDefinitions: {
          apiKeySecurityScheme: {
            in: 'header',
            name: 'x-api-key',
            scheme: 'apikey'
          }
        }
      }
      const result = createCredentials(credentials, target)
      result.should.be.a('object')
      expect(result).to.deep.equal({
        headers: {
          'x-api-key': 'test-key'
        },
        queries: ''
      })
    })

    it('create header credentials for multiple apikeys', async () => {
      const credentials = {
        apiKeySecurityScheme1: {
          apiKey: 'test-key1'
        },
        apiKeySecurityScheme2: {
          apiKey: 'test-key2'
        }
      }
      const target = {
        security: ['apiKeySecurityScheme1', 'apiKeySecurityScheme2'],
        securityDefinitions: {
          apiKeySecurityScheme1: {
            in: 'header',
            name: 'x-api-key1',
            scheme: 'apikey'
          },
          apiKeySecurityScheme2: {
            in: 'header',
            name: 'x-api-key2',
            scheme: 'apikey'
          }
        }
      }
      const result = createCredentials(credentials, target)
      result.should.be.a('object')
      expect(result).to.deep.equal({
        headers: {
          'x-api-key1': 'test-key1',
          'x-api-key2': 'test-key2'
        },
        queries: ''
      })
    })

    it('create query credentials for apikey scheme with custom name', async () => {
      const credentials = {
        apiKeySecurityScheme: {
          apiKey: 'test-key'
        }
      }
      const target = {
        security: ['apiKeySecurityScheme'],
        securityDefinitions: {
          apiKeySecurityScheme: {
            in: 'query',
            name: 'x-api-key',
            scheme: 'apikey'
          }
        }
      }
      const result = createCredentials(credentials, target)
      result.should.be.a('object')
      expect(result).to.deep.equal({
        headers: {},
        queries: 'x-api-key=test-key'
      })
    })

    it('create query credentials for multiple apikeys', async () => {
      const credentials = {
        apiKeySecurityScheme1: {
          apiKey: 'test-key1'
        },
        apiKeySecurityScheme2: {
          apiKey: 'test-key2'
        }
      }
      const target = {
        security: ['apiKeySecurityScheme1', 'apiKeySecurityScheme2'],
        securityDefinitions: {
          apiKeySecurityScheme1: {
            in: 'query',
            name: 'x-api-key1',
            scheme: 'apikey'
          },
          apiKeySecurityScheme2: {
            in: 'query',
            name: 'x-api-key2',
            scheme: 'apikey'
          }
        }
      }
      const result = createCredentials(credentials, target)
      result.should.be.a('object')
      expect(result).to.deep.equal({
        headers: {},
        queries: 'x-api-key1=test-key1&x-api-key2=test-key2'
      })
    })
  })

  it('create header credentials for basic auth', async () => {
    const credentials = {
      basicAuth: {
        username: 'username',
        password: 'password'
      }
    }
    const target = {
      security: ['basicAuth'],
      securityDefinitions: {
        basicAuth: {
          scheme: 'basic'
        }
      }
    }
    const result = createCredentials(credentials, target)
    result.should.be.a('object')
    expect(result).to.deep.equal({
      headers: {
        Authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
      },
      queries: ''
    })
  })

  it('create header credentials for basic auth with different header name', async () => {
    const credentials = {
      basicAuth: {
        username: 'username',
        password: 'password'
      }
    }
    const target = {
      security: ['basicAuth'],
      securityDefinitions: {
        basicAuth: {
          scheme: 'basic',
          name: 'x-basic-auth'
        }
      }
    }
    const result = createCredentials(credentials, target)
    result.should.be.a('object')
    expect(result).to.deep.equal({
      headers: {
        'x-basic-auth': 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
      },
      queries: ''
    })
  })

  it('create header credentials for basic auth with empty password', async () => {
    const credentials = {
      basicAuth: {
        username: 'username'
      }
    }
    const target = {
      security: ['basicAuth'],
      securityDefinitions: {
        basicAuth: {
          scheme: 'basic'
        }
      }
    }
    const result = createCredentials(credentials, target)
    result.should.be.a('object')
    expect(result).to.deep.equal({
      headers: {
        Authorization: 'Basic dXNlcm5hbWU6'
      },
      queries: ''
    })
  })
})
