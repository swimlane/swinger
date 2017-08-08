export declare class DuplicateSecurityDefinitionError extends Error {
}
export declare class DuplicatePathError extends Error {
}
export declare class DuplicateDefinitionsError extends Error {
}
export interface SwaggerSpec {
    info: {
        title: string;
    };
    securityDefinitions?: {
        [key: string]: object;
    };
    swagger: string;
    basePath?: string;
    paths: {
        [key: string]: object;
    };
    definitions?: {
        [key: string]: object;
    };
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
export declare function merge(specs: SwaggerSpec[]): SwaggerSpec;
