"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
class DuplicateSecurityDefinitionError extends Error {
}
exports.DuplicateSecurityDefinitionError = DuplicateSecurityDefinitionError;
class DuplicatePathError extends Error {
}
exports.DuplicatePathError = DuplicatePathError;
class DuplicateDefinitionsError extends Error {
}
exports.DuplicateDefinitionsError = DuplicateDefinitionsError;
/**
 * Merge an array of spec JSON objects into a single object.
 * The first object will be assumed as the base object to merge the others into from left to right
 *
 * The following mergers will take place:
 * - Copy any `tags` members into the resulting object
 * - Copy any `securityDefinitions` members into the resulting object
 * - Check if `basePath` is set, if so it will prepend `basePath` to each member of `path`
 * - Prepend `info.title` to any members of `definitions`
 * - Update any `$ref` to the renamed paths
 * - Copy all members of `path` into the resulting object
 * - Copy all memebrs of `definitions` into the resulting object
 *
 * @export
 * @param {SwaggerSpec[]} specs an array of swagger specs
 * @returns {SwaggerSpec} The resulting merged spec
 * @throws Error if specs argument is empty
 * @throws DuplicateSecurityDefinitionError if there two security definitions with the same name
 *                                          but do not specify same rules
 * @throws DuplicatePathError if there are two specs that define the same path (after basePath has been added)
 * @throws DuplicateDefinitionsError if there are two definitions that share a name (after `info.title` has been added)
 */
function merge(specs) {
    if (specs.length === 0) {
        throw new Error('You must pass at least one swagger spec');
    }
    const resultSpec = Object.assign({}, specs[0]);
    if (specs.length === 1) {
        return resultSpec; // only 1 object, no need to merge anything
    }
    for (let i = 1; i < specs.length; i++) {
        const currentSpec = Object.assign({}, specs[i]); // clone the object
        if (currentSpec.hasOwnProperty('tags')) {
            resultSpec.tags = mergeTags(resultSpec, currentSpec);
        }
        if (currentSpec.hasOwnProperty('securityDefinitions')) {
            resultSpec.securityDefinitions = mergeSecurityDefinitions(resultSpec, currentSpec);
        }
    }
    return resultSpec;
}
exports.merge = merge;
/**
 * Merge swagger security definitions
 *
 * @param {SwaggerSpec} left
 * @param {SwaggerSpec} right
 * @returns {{ [key: string]: object }}
 */
function mergeSecurityDefinitions(left, right) {
    const resultSecObject = left.securityDefinitions || {};
    if (right.hasOwnProperty('securityDefinitions')) {
        for (const securityDefinitionName in right.securityDefinitions) {
            if (resultSecObject.hasOwnProperty(securityDefinitionName)) {
                try {
                    // check if they are equal, if they are then we ignore them as non-issue
                    assert.deepEqual(resultSecObject[securityDefinitionName], right.securityDefinitions[securityDefinitionName]);
                }
                catch (err) {
                    throw new DuplicateSecurityDefinitionError(`
            Security Definition '${securityDefinitionName}' is redeclared in ${right.info.title}`);
                }
            }
            else {
                resultSecObject[securityDefinitionName] = right.securityDefinitions[securityDefinitionName];
            }
        }
    }
    return resultSecObject;
}
/**
 * Merge tags
 *
 * @param {SwaggerSpec} left
 * @param {SwaggerSpec} right
 * @returns {string[]}
 */
function mergeTags(left, right) {
    const resultTags = left.tags || [];
    if (right.hasOwnProperty('tags')) {
        resultTags.push(...right.tags);
    }
    return [...new Set(resultTags)]; // dedup
}
//# sourceMappingURL=index.js.map