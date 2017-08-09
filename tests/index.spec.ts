import { expect } from 'chai';
import * as swinger from '../src';

describe('Swinger Swagger Aggregator', () => {
  describe('merge', () => {
    it('should throw an error if you pass an empty array', (done) => {
      expect(() => swinger.merge([])).to.throw(Error, /You must pass at least one swagger spec/);
      done();
    });

    it('should return the first object if only one object', (done) => {
      const testObj = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {}
      };

      expect(swinger.merge([testObj])).to.deep.equal(testObj);
      done();
    });

    it('should throw an error if there is a version mismatch', (done) => {
      const versionSpec1 = {
        info: { title: 'foo' },
        openapi: '3.0.0',
        paths: {},
        tags: [ 'foo' ]
      };

      const versionSpec2 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        tags: [ 'bar' ]
      };

      expect(() => swinger.merge([versionSpec1, versionSpec2])).to.throw(swinger.VersionMismatchError);
      expect(() => swinger.merge([versionSpec2, versionSpec1])).to.throw(swinger.VersionMismatchError);
      done();
    });

    it('should merge multiple objects', (done) => {
      const spec1 = {
        info: {
          title: 'spec1'
        },
        swagger: '2.0',
        securityDefinitions: {
          jwt: { in: 'header', schema: 'Bearer', type: 'http' }
        },
        security: { jwt: [ 'write' ] },
        basePath: '/api',
        paths: {},
        definitions: {
          FooError: { type: 'string' }
        },
        tags: [ 'spec1Tag' ]
      };

      const spec2 = {
        info: {
          title: 'spec2'
        },
        swagger: '2.0',
        securityDefinitions: {
          jwt: { in: 'header', schema: 'Bearer', type: 'http' },
          basic: { in: 'header', type: 'http' }
        },
        security: { jwt: [ 'read', 'write' ] },
        basePath: '/spec2',
        paths: {
          '/foo': {
            get: {
              description: 'spec2',
              response: {
                200: {
                  $ref: '#/definitions/FooResponse'
                },
                default: {
                  $ref: '#/definitions/FooError'
                }
              }
            }
          }
        },
        definitions: {
          FooError: { type: 'number' },
          FooResponse: { type: 'string' }
        },
        tags: [ 'spec2Tag' ]
      };

      const spec3 = {
        info: {
          title: 'spec3'
        },
        swagger: '2.0',
        basePath: '/spec3',
        paths: {
          '/bar': {
            get: {
              description: 'spec3',
              response: {
                200: {
                  $ref: '#/definitions/BarResponse'
                },
                default: {
                  $ref: '#/definitions/BarError'
                }
              }
            }
          },
          '/fizz': {
            get: {
              description: 'spec3',
              response: {
                default: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/stuff/things'
                  }
                }
              }
            }
          }
        },
        definitions: {
          BarError: { type: 'number' },
          BarResponse: { type: 'string' },
          stuff: {
            things: { type: 'boolean' }
          }
        },
        tags: [ 'spec2Tag', 'spec3Tag' ]
      };

      const resultSpec = {
        info: {
          title: 'spec1'
        },
        swagger: '2.0',
        securityDefinitions: {
          jwt: {
            in: 'header',
            schema: 'Bearer',
            type: 'http'
          },
          basic: {
            in: 'header',
            type: 'http'
          }
        },
        security: {
          jwt: [
            'write'
          ]
        },
        basePath: '/api',
        paths: {
          '/spec2/foo': {
            get: {
              description: 'spec2',
              response: {
                200: {
                  $ref: '#/definitions/spec2_FooResponse'
                },
                default: {
                  $ref: '#/definitions/spec2_FooError'
                }
              },
              security: {
                jwt: [
                  'read',
                  'write'
                ]
              }
            }
          },
          '/spec3/bar': {
            get: {
              description: 'spec3',
              response: {
                200: {
                  $ref: '#/definitions/spec3_BarResponse'
                },
                default: {
                  $ref: '#/definitions/spec3_BarError'
                }
              }
            }
          },
          '/spec3/fizz': {
            get: {
              description: 'spec3',
              response: {
                default: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/spec3_stuff/things'
                  }
                }
              }
            }
          }
        },
        definitions: {
          FooError: {
            type: 'string'
          },
          spec2_FooError: {
            type: 'number'
          },
          spec2_FooResponse: {
            type: 'string'
          },
          spec3_BarError: {
            type: 'number'
          },
          spec3_BarResponse: {
            type: 'string'
          },
          spec3_stuff: {
            things: {
              type: 'boolean'
            }
          }
        },
        tags: [
          'spec1Tag',
          'spec2Tag',
          'spec3Tag'
        ]
      };

      const merged = swinger.merge([spec1, spec2, spec3]);
      expect(merged).to.deep.equal(resultSpec);
      done();
    });
  });

  describe('securityDefinitions', () => {
    it('should merge security definitions', (done) => {
      const secSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        securityDefinitions: {
          basic: {
            type: 'http',
            scheme: 'basic'
          }
        }
      };

      const secSpec2 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        securityDefinitions: {
          secure: {
            type: 'https',
            scheme: 'basic'
          }
        }
      };

      const merged = swinger.mergeSecurityDefinitions(secSpec1, secSpec2);
      expect(merged.basic).to.deep.equal(secSpec1.securityDefinitions.basic);
      expect(merged.secure).to.deep.equal(secSpec2.securityDefinitions.secure);
      done();
    });

    it('should throw an error if you have different duplicate security definitions', (done) => {
      const secSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        securityDefinitions: {
          basic: {
            type: 'http',
            scheme: 'basic'
          }
        }
      };

      const secSpec2 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        securityDefinitions: {
          basic: {
            type: 'https',
            scheme: 'basic'
          }
        }
      };

      expect(() => swinger.mergeSecurityDefinitions(secSpec1, secSpec2))
        .to.throw(swinger.DuplicateSecurityDefinitionError);
      done();
    });

    it('shouldn\'t throw an error if you have the same duplicate security definitions', (done) => {
      const secSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        securityDefinitions: {
          basic: {
            type: 'http',
            scheme: 'basic'
          }
        }
      };

      const secSpec2 = {
        info: { title: 'bar' },
        swagger: '2.0',
        paths: {},
        securityDefinitions: {
          basic: {
            type: 'http',
            scheme: 'basic'
          }
        }
      };

      const merged = swinger.mergeSecurityDefinitions(secSpec1, secSpec2);
      expect(merged).to.deep.equal(secSpec1.securityDefinitions);
      done();
    });
  });

  describe('tags', () => {
    it('should merge separate lists of tags', (done) => {
      const tagSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        tags: [ 'foo' ]
      };

      const tagSpec2 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        tags: [ 'bar' ]
      };

      const merged = swinger.mergeTags(tagSpec1, tagSpec2);
      expect(merged).to.deep.equal([ 'foo', 'bar']);
      done();
    });

    it('should deduplicate lists of tags', (done) => {
      const tagSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        tags: [ 'foo', 'bar' ]
      };

      const tagSpec2 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        tags: [ 'bar' ]
      };

      const merged = swinger.mergeTags(tagSpec1, tagSpec2);
      expect(merged).to.deep.equal([ 'foo', 'bar']);
      done();
    });
  });

  describe('paths', () => {
    it('should merge paths', (done) => {
      const pathSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {
          '/foo': {
            get: {}
          }
        }
      };

      const pathSpec2 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {
          '/bar': {
            get: {}
          }
        }
      };

      const merged = swinger.mergePaths(pathSpec1, pathSpec2);
      expect(merged).to.deep.equal({
        '/foo': {
          get: {}
        },
        '/bar': {
            get: {}
          }
      });

      done();
    });

    it('should apply basePath to paths', (done) => {
      const pathSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {
          '/foo': {
            get: {}
          }
        }
      };

      const pathSpec2 = {
        info: { title: 'foo' },
        swagger: '2.0',
        basePath: '/fizz',
        paths: {
          '/bar': {
            get: {}
          }
        }
      };

      const merged = swinger.mergePaths(pathSpec1, pathSpec2);
      expect(merged).to.deep.equal({
        '/foo': {
          get: {}
        },
        '/fizz/bar': {
            get: {}
          }
      });

      done();
    });

    it('should throw an error on duplicate paths', (done) => {
      const pathSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {
          '/fizz/bar': {
            get: {}
          }
        }
      };

      const pathSpec2 = {
        info: { title: 'foo' },
        swagger: '2.0',
        basePath: '/fizz',
        paths: {
          '/bar': {
            get: {}
          }
        }
      };

      expect(() => swinger.mergePaths(pathSpec1, pathSpec2)).to.throw(swinger.DuplicatePathError);

      done();
    });

    it('should copy global security into each path it applies to', (done) => {
      const pathSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {
          '/foo': {
            get: {}
          }
        }
      };

      const pathSpec2 = {
        info: { title: 'foo' },
        swagger: '2.0',
        basePath: '/fizz',
        security: {
          basic: []
        },
        paths: {
          '/bar': {
            get: {}
          }
        }
      };

      const merged = swinger.mergePaths(pathSpec1, pathSpec2);
      expect(merged).to.deep.equal({
        '/foo': {
          get: {}
        },
        '/fizz/bar': {
            get: {
              security: {
                basic: []
              }
            }
          }
      });

      done();
    });
  });

  describe('definitions', () => {
    it('should merge definitions, namespacing them by title', (done) => {
      const defSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        definitions: {
          Foo: {
            type: 'string'
          }
        }
      };

      const defSpec2 = {
        info: { title: 'bar' },
        swagger: '2.0',
        paths: {},
        definitions: {
          Bar: {
            type: 'string'
          }
        }
      };

      const merged = swinger.mergeDefinitions(defSpec1, defSpec2);
      expect(merged.definitions).to.deep.equal({
        Foo: {
          type: 'string'
        },
        bar_Bar: {
          type: 'string'
        }
      });
      expect(merged.references).to.deep.equal({
        Bar: 'bar_Bar'
      });

      done();
    });

    it('should should throw an error if there is a duplicate definition', (done) => {
      const defSpec1 = {
        info: { title: 'foo' },
        swagger: '2.0',
        paths: {},
        definitions: {
          bar_Bar: {
            type: 'string'
          }
        }
      };

      const defSpec2 = {
        info: { title: 'bar' },
        swagger: '2.0',
        paths: {},
        definitions: {
          Bar: {
            type: 'string'
          }
        }
      };

      expect(() => swinger.mergeDefinitions(defSpec1, defSpec2)).to.throw(swinger.DuplicateDefinitionError);

      done();
    });
  });

  describe('updateReferences', () => {
    it('should update references', (done) => {
      const replace = {
        Foo: 'foo_Foo',
        Bar: 'bar_Bar',
        Fizz: 'bar_Fizz'
      };

      const before = {
        $ref: '#/definitions/Foo',
        arr: [ // should update any members
          { $ref: '#/definitions/Bar' },
          'string', // should leave alone
          [ { $ref: '#/definitions/Fizz/Buzz'}]
        ],
        skip: true // should leave alone
      };

      const after = {
        $ref: '#/definitions/foo_Foo',
        arr: [
          { $ref: '#/definitions/bar_Bar' },
          'string',
          [ { $ref: '#/definitions/bar_Fizz/Buzz'}]
        ],
        skip: true
      };

      expect(swinger.updateReferences(before, replace)).to.deep.equal(after);
      done();
    });

    it('should do nothing if no references are passed', (done) => {
      const before = {
        $ref: '#/definitions/Foo',
        arr: [ // should update any members
          { $ref: '#/definitions/Bar' },
          'string', // should leave alone
          [ { $ref: '#/definitions/Fizz/Buzz'}]
        ],
        skip: true // should leave alone
      };

      expect(swinger.updateReferences(before, {})).to.deep.equal(before);
      done();
    });
  });
});
