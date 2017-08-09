import { expect } from 'chai';
import * as swinger from '../index';

describe('Swinger Swagger Aggregator', () => {
  describe('Merge', () => {
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
      const secSpec = {
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

      const merged = swinger.mergeSecurityDefinitions(secSpec, secSpec);
      expect(merged).to.deep.equal(secSpec.securityDefinitions);
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
});
