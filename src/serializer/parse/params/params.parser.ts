import * as t from "@babel/types";
import { ParsedParameter } from "../../types";

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
 *     typeAnnotation: t.tsTypeAnnotation(t.tsUnionType([t.tsNumberKeyword(), t.tsUndefinedKeyword()]))
 *   }
 * ]
 */
export function parseGeneratorParametersAsProperties(generator: t.FunctionDeclaration): ParsedParameter[] {
    // Individual parameter declarations
    return generator.params.map((parameter) => {
        const type: t.TSType = getParameterTypeUnderlying(parameter);

        const typeAnnotation = t.tsTypeAnnotation(isParameterOptional(parameter) ? t.tsUnionType([type, t.tsUndefinedKeyword()]) : type);

        return {
            name: getParameterName(parameter),
            typeAnnotation
        };
    });
}

const getParameterName = (parameter: t.Node): string => {
    if (t.isIdentifier(parameter)) {
        return parameter.name;
    }
    if (t.isAssignmentPattern(parameter)) {
        if (t.isIdentifier(parameter.left)) {
            return getParameterName(parameter.left);
        }
    }
    if (t.isRestElement(parameter)) {
        if (t.isIdentifier(parameter.argument)) {
            return getParameterName(parameter.argument);
        }
    }
    throw new Error("Unsupported parameter type: " + JSON.stringify(parameter, null, 4));
}

const isTsType = (type: t.TSTypeAnnotation | t.TypeAnnotation | t.Noop | undefined | null): type is t.TSTypeAnnotation =>
    !!type && !t.isNoop(type) && t.isTSTypeAnnotation(type);

const getParameterTypeUnderlying = (parameter: t.Identifier | t.Pattern | t.RestElement): t.TSType => {
    if (t.isIdentifier(parameter)) {
        return isTsType(parameter.typeAnnotation) ? parameter.typeAnnotation.typeAnnotation : t.tsAnyKeyword();
    }
    if (t.isAssignmentPattern(parameter)) {
        if (t.isIdentifier(parameter.left)) {
            return getParameterTypeUnderlying(parameter.left);
        }
    }
    if (t.isRestElement(parameter)) {
        return isTsType(parameter.typeAnnotation) ? parameter.typeAnnotation.typeAnnotation : t.tsArrayType(t.tsAnyKeyword());
    }
    if (t.isObjectPattern(parameter)) {
        return t.tsAnyKeyword();
    }
    throw new Error("Unsupported parameter type: " + JSON.stringify(parameter, null, 4));
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
