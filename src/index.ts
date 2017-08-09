import * as assert from 'assert';

export class DuplicateSecurityDefinitionError extends Error {}
export class DuplicatePathError extends Error {}
export class DuplicateDefinitionError extends Error {}
export class VersionMismatchError extends Error {}

/**
 * Only the portions we care about at the moment
 * A combination of 2.0 and 3.0 pieces to try and support both
 *
 * @export
 * @interface SwaggerSpec
 */
export interface SwaggerSpec {
  info: {
    title: string;
  };
  swagger?: string;
  openapi?: string;
  securityDefinitions?: { [key: string]: object };
  security?: { [key: string]: object };
  basePath?: string;
  paths: { [key: string]: object };
  definitions?: { [key: string]: object };
  tags?: string[];
}

/**
 * Merge an array of spec JSON objects into a single object.
 * The first object will be assumed as the base object to merge the others into from left to right
 *
 * The following mergers will take place:
 * - Copy any `tags` members into the resulting object
 * - Copy any `securityDefinitions` members into the resulting object
 * - Check if `basePath` is set, if so it will prepend `basePath` to each member of `path`
 * - Apply any global `security` settings to each path individually
 * - Prepend `info.title` to any members of `definitions` if there are collisions
 * - Update any `$ref` to the renamed paths
 * - Copy all members of `path` into the resulting object
 * - Copy all members of `definitions` into the resulting object
 *
 * @export
 * @param {SwaggerSpec[]} specs an array of swagger specs
 * @returns {SwaggerSpec} The resulting merged spec
 * @throws Error if specs argument is empty
 * @throws VersionMismatchError if you try to merge specs that are different versions
 * @throws DuplicateSecurityDefinitionError if there two security definitions with the same name
 *                                          but do not specify same rules
 * @throws DuplicatePathError if there are two specs that define the same path (after basePath has been added)
 * @throws DuplicateDefinitionError if there are two definitions that share a name (after `info.title` has been added)
 */
export function merge(specs: SwaggerSpec[]): SwaggerSpec {
  if (specs.length === 0) {
    throw new Error('You must pass at least one swagger spec');
  }

  const resultSpec = Object.assign({}, specs[0]);
  if(specs.length === 1) {
    return resultSpec; // only 1 object, no need to merge anything
  }

  for (let i = 1; i < specs.length; i++) {
    const currentSpec = Object.assign({}, specs[i]); // clone the object

    // Version Checks
    // 2.0
    if (resultSpec.hasOwnProperty('swagger') &&
      (!currentSpec.hasOwnProperty('swagger') || resultSpec.swagger !== currentSpec.swagger)
    ) {
      throw new VersionMismatchError(`${currentSpec.info.title} does not match the final spec version`);
    }

    // 3.0
    if (resultSpec.hasOwnProperty('openapi') &&
      (!currentSpec.hasOwnProperty('openapi') || resultSpec.openapi !== currentSpec.openapi)
    ) {
      throw new VersionMismatchError(`${currentSpec.info.title} does not match the final spec version`);
    }

    // Merge
    if (currentSpec.hasOwnProperty('tags')) {
      resultSpec.tags = mergeTags(resultSpec, currentSpec);
    }

    if (currentSpec.hasOwnProperty('securityDefinitions')) {
      resultSpec.securityDefinitions = mergeSecurityDefinitions(resultSpec, currentSpec);
    }

    let referenceUpdates = {};
    if (currentSpec.hasOwnProperty('definitions')) {
      const mergedDefinitions = mergeDefinitions(resultSpec, currentSpec);
      referenceUpdates = mergedDefinitions.references;
      resultSpec.definitions = updateReferences(mergedDefinitions.definitions, referenceUpdates);
    }

    // paths is required in both versions, so no need to check
    resultSpec.paths = mergePaths(resultSpec, updateReferences(currentSpec, referenceUpdates) as SwaggerSpec);
  }

  return resultSpec;
}

/**
 * Merge swagger security definitions
 *
 * @param {SwaggerSpec} left
 * @param {SwaggerSpec} right
 * @returns {{ [key: string]: object }}
 */
export function mergeSecurityDefinitions(left: SwaggerSpec, right: SwaggerSpec): { [key: string]: object } {
  const resultSecObject = left.securityDefinitions || {};

  if (right.hasOwnProperty('securityDefinitions')) {
    for (const securityDefinitionName in right.securityDefinitions) {
      if (resultSecObject.hasOwnProperty(securityDefinitionName)) {
        try {
          // check if they are equal, if they are then we ignore them as non-issue
          assert.deepEqual(resultSecObject[securityDefinitionName], right.securityDefinitions[securityDefinitionName]);
        } catch (err) {
          throw new DuplicateSecurityDefinitionError(`
            Security Definition '${securityDefinitionName}' is redeclared in ${right.info.title}`
          );
        }
      } else {
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
export function mergeTags(left: SwaggerSpec, right: SwaggerSpec): string[] {
  const resultTags = left.tags || [];

  if (right.hasOwnProperty('tags')) {
    resultTags.push(...right.tags);
  }

  return [...new Set(resultTags)]; // dedup
}

/**
 * Merge paths
 *
 * @export
 * @param {SwaggerSpec} left
 * @param {SwaggerSpec} right
 * @returns {{ [key: string]: object }}
 */
export function mergePaths(left: SwaggerSpec, right: SwaggerSpec): { [key: string]: object } {
  const resultPaths = left.paths || {};

  if (right.hasOwnProperty('paths')) {
    const base = right.basePath || '';
    for(const path in right.paths) {
      const finalPath = base + path;
      if (left.paths.hasOwnProperty(finalPath)) {
        throw new DuplicatePathError(`Path ${finalPath} is redeclared in ${right.info.title}`);
      }

      resultPaths[finalPath] = right.paths[path];

      // copy global security to each path that doesn't have it
      if (right.hasOwnProperty('security')) {
        for (const method in resultPaths[finalPath]) {
          switch (method) {
            case 'get':
            case 'post':
            case 'put':
            case 'delete':
            case 'options':
            case 'head':
            case 'patch':
              if (!resultPaths[finalPath][method].hasOwnProperty('security')) {
                resultPaths[finalPath][method].security = right.security;
              }
            default:
              // do nothing
          }
        }
      }
    }
  }

  return resultPaths;
}

/**
 * Merge definitions and return both the definitions and any references that need updating
 *
 * @export
 * @param {SwaggerSpec} left
 * @param {SwaggerSpec} right
 * @returns {{ definitions: { [key: string]: any }, references: { [key: string]: string } }}
 */
export function mergeDefinitions(left: SwaggerSpec, right: SwaggerSpec):
  { definitions: { [key: string]: any }, references: { [key: string]: string } } {
  const resultDefinitions = left.definitions || {};
  const resultReferences = {};

  if (right.hasOwnProperty('definitions')) {
    const prefix = right.info.title || '';
    for (const definitionName in right.definitions) {
      let finalDefinitionName = definitionName;
      // only rename if there is a collision
      if (resultDefinitions.hasOwnProperty(finalDefinitionName)) {
        // if their signatures are the same, we can skip it and reuse the current one
        try {
          assert.deepEqual(resultDefinitions[finalDefinitionName], right.definitions[definitionName]);
          continue; // on to the next one
        } catch (err) {
          finalDefinitionName = `${prefix}_${definitionName}`;
          resultReferences[definitionName] = finalDefinitionName;
        }
      }

      if (resultDefinitions.hasOwnProperty(finalDefinitionName)) {
        throw new DuplicateDefinitionError(
          `Definition ${finalDefinitionName} is redeclared in ${right.info.title}`
        );
      }

      resultDefinitions[finalDefinitionName] = right.definitions[definitionName];
    }
  }

  return {
    definitions: resultDefinitions,
    references: resultReferences
  };
}

/**
 * Update any references ($ref) based on a map of old -> new keys
 *
 * @export
 * @param {{ [key: string]: any }} target
 * @param {{ [key: string]: string }} references
 * @returns {{ [key: string]: any }}
 */
export function updateReferences(target: { [key: string]: any }, references: { [key: string]: string }):
  { [key: string]: any } {
    // check for empty references and just return
    if (Object.keys(references).length === 0) {
      return target; // nothing to do
    }

    const type = typeof target;
    // check for object
    if (!(target !== null && (type === 'object' || type === 'function'))) {
      return target; // it's not an object/array
    } else if (Array.isArray(target)) {
      return target.map((val) => updateReferences(val, references));
    } else {
      const definitionMatch = /\#\/definitions\/([^\/]+)/;
      return Object.keys(target).reduce((newObj, key) => {
        if (key === '$ref') {
          const match = definitionMatch.exec(target[key]);
          if (match && match.length === 2 && references.hasOwnProperty(match[1])) {
            newObj[key] = target[key].replace(match[1], references[match[1]]);
          } else {
            newObj[key] = target[key];
          }
        } else {
          newObj[key] = updateReferences(target[key], references);
        }

        return newObj;
      }, {});
    }
  }
