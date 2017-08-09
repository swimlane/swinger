export declare class DuplicateSecurityDefinitionError extends Error {
}
export declare class DuplicatePathError extends Error {
}
export declare class DuplicateDefinitionError extends Error {
}
export declare class DuplicateComponentError extends Error {
}
export declare class VersionMismatchError extends Error {
}
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
    securityDefinitions?: {
        [key: string]: object;
    };
    security?: {
        [key: string]: object;
    };
    basePath?: string;
    paths: {
        [key: string]: object;
    };
    definitions?: {
        [key: string]: object;
    };
    components?: {
        schemas: {
            [key: string]: object;
        };
        responses: {
            [key: string]: object;
        };
        parameters: {
            [key: string]: object;
        };
        examples: {
            [key: string]: object;
        };
        requestBodies: {
            [key: string]: object;
        };
        headers: {
            [key: string]: object;
        };
        securitySchemes: {
            [key: string]: object;
        };
        links: {
            [key: string]: object;
        };
        callbacks: {
            [key: string]: object;
        };
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
 * - Apply any global `security` settings to each path individually
 * - Prepend `info.title` to any members of `definitions` and `components` if there are collisions
 * - Update any `$ref` to the renamed paths
 * - Copy all members of `path` into the resulting object
 * - Copy all members of `definitions` into the resulting object
 * - Copy all members of `components` into resulting object
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
 * @throws DuplicateComponentError if there are two components that share a name (after `info.title` has been added)
 */
export declare function merge(specs: SwaggerSpec[]): SwaggerSpec;
/**
 * Merge swagger security definitions
 *
 * @param {SwaggerSpec} left
 * @param {SwaggerSpec} right
 * @returns {{ [key: string]: object }}
 */
export declare function mergeSecurityDefinitions(left: SwaggerSpec, right: SwaggerSpec): {
    [key: string]: object;
};
/**
 * Merge tags
 *
 * @param {SwaggerSpec} left
 * @param {SwaggerSpec} right
 * @returns {string[]}
 */
export declare function mergeTags(left: SwaggerSpec, right: SwaggerSpec): string[];
/**
 * Merge paths
 *
 * @export
 * @param {SwaggerSpec} left
 * @param {SwaggerSpec} right
 * @returns {{ [key: string]: object }}
 */
export declare function mergePaths(left: SwaggerSpec, right: SwaggerSpec): {
    [key: string]: object;
};
/**
 * Merge definitions and return both the definitions and any references that need updating
 *
 * @export
 * @param {SwaggerSpec} left
 * @param {SwaggerSpec} right
 * @returns {{ definitions: { [key: string]: any }, references: { [key: string]: string } }}
 */
export declare function mergeDefinitions(left: SwaggerSpec, right: SwaggerSpec): {
    definitions: {
        [key: string]: any;
    };
    references: {
        [key: string]: string;
    };
};
/**
 * Update any references ($ref) based on a map of old -> new keys
 *
 * @export
 * @param {{ [key: string]: any }} target
 * @param {{ [key: string]: string }} references
 * @returns {{ [key: string]: any }}
 */
export declare function updateReferences(target: {
    [key: string]: any;
}, references: {
    [key: string]: string;
}): {
    [key: string]: any;
};
