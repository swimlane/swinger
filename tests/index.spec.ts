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

        const merged = swinger.merge([secSpec1, secSpec2]);
        expect(merged.securityDefinitions.basic).to.deep.equal(secSpec1.securityDefinitions.basic);
        expect(merged.securityDefinitions.secure).to.deep.equal(secSpec2.securityDefinitions.secure);
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

        expect(() => swinger.merge([secSpec1, secSpec2])).to.throw(swinger.DuplicateSecurityDefinitionError);
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

        const merged = swinger.merge([secSpec, secSpec]);
        expect(merged.securityDefinitions).to.deep.equal(secSpec.securityDefinitions);
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

        const merged = swinger.merge([tagSpec1, tagSpec2]);
        expect(merged.tags).to.deep.equal([ 'foo', 'bar']);
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

        const merged = swinger.merge([tagSpec1, tagSpec2]);
        expect(merged.tags).to.deep.equal([ 'foo', 'bar']);
        done();
      });
    });
  });
});