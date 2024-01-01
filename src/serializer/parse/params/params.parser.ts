import * as t from "@babel/types";
import { ParsedParameter } from "../../types";

const isTsType = (type: t.TSTypeAnnotation | t.TypeAnnotation | t.Noop | undefined | null): type is t.TSTypeAnnotation =>
    !!type && !t.isNoop(type) && t.isTSTypeAnnotation(type);

const validTsTypeOrDefault = (type: t.TSTypeAnnotation | t.TypeAnnotation | t.Noop | undefined | null, theDefault: t.TSTypeAnnotation): t.TSTypeAnnotation =>
    isTsType(type) ? type : theDefault

/**
 * Given a generator function, parse its parameters and return a list of
 * parameter names and types. These names and types will eventually be
 * used as part of the state machine `state` object.
 * 
 * ex:
 * function* sum(a?: number) {
 *    ...
 * }
 * 
 * returns:
 * [
 *   {
 *     name: "a",
 *     typeAnnotation: t.tsTypeAnnotation(t.tsNumberKeyword()),
 *     optional: true
 *   }
 * ]
 */
export function parseGeneratorParametersAsProperties(generator: t.FunctionDeclaration): ParsedParameter[] {
    // Individual parameter declarations
    return generator.params.flatMap(param => parseParameter(param));
}

const parseParameter = (parameter: t.Identifier | t.Pattern | t.RestElement): ParsedParameter[] => {
    if (t.isIdentifier(parameter)) {
        return [{
            name: parameter.name,
            typeAnnotation: validTsTypeOrDefault(parameter.typeAnnotation, t.tsTypeAnnotation(t.tsAnyKeyword())),
            optional: isParameterOptional(parameter)
        }];
    }
    if (t.isAssignmentPattern(parameter)) {
        if (t.isIdentifier(parameter.left)) {
            return parseParameter(parameter.left);
        }
    }
    if (t.isRestElement(parameter)) {
        if (t.isIdentifier(parameter.argument)) {
            return [{
                name: parameter.argument.name,
                typeAnnotation: validTsTypeOrDefault(parameter.typeAnnotation, t.tsTypeAnnotation(t.tsAnyKeyword())),
                optional: false
            }];
        }
    }
    if (t.isObjectPattern(parameter)) {
        return parameter.properties.reduce((acc, property) => {
            if (t.isRestElement(property)) {
                acc = acc.concat(parseParameter(property));
            }
            if (t.isObjectProperty(property)) {
                if (t.isIdentifier(property.key)) {
                    acc = acc.concat(parseParameter(property.key));
                }
                if (t.isAssignmentPattern(property.value)) {
                    if (t.isIdentifier(property.value.left)) {
                        acc = acc.concat(parseParameter(property.value.left));
                    }
                }
            }
            return acc;
        }, [] as ParsedParameter[]);
    }
    if (t.isArrayPattern(parameter)) {
        return parameter.elements.flatMap(element => {
            if (t.isIdentifier(element) || t.isPattern(element) || t.isRestElement(element)) {
                return parseParameter(element)
            } else {
                throw new Error("Unsupported array pattern element type: " + JSON.stringify(element, null, 4));
            }
        });
    }
    return [];
}

const isParameterOptional = (parameter: t.Identifier | t.Pattern | t.RestElement): boolean => {
    if (t.isIdentifier(parameter)) {
        return parameter.optional || false;
    }
    if (t.isAssignmentPattern(parameter)) {
        if (t.isIdentifier(parameter.left)) {
            return isParameterOptional(parameter.left);
        }
    }
    if (t.isRestElement(parameter)) {
        // Rest parameters cannot be optional
        return false;
    }
    if (t.isObjectPattern(parameter)) {
        // TODO: Object patterns can certainly have optional properties, but we don't support that yet
        return true;
    }
    throw new Error("Unsupported parameter type, cannot parse if is optional: " + JSON.stringify(parameter, null, 4));
}
