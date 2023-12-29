import * as t from '@babel/types';

/**
 * Parse local variable declarations in the generator function.
 */
export function parseLocalVariableDeclarations(generator: t.FunctionDeclaration): t.VariableDeclaration[] {
    return generator.body.body.filter((node) => t.isVariableDeclaration(node)).map((node) => node as t.VariableDeclaration);
}

/**
 * Parse local variable declarations in the generator function and return a list of
 * parameter names and types. These names and types will eventually be used as part
 * of the state machine `state` object.
 * 
 * ex:
 * function* sum() {
 *   let a: number = 0;
 *   ...
 * }
 * 
 * returns:
 * [
 *   t.tsPropertySignature(
 *     t.identifier("a"),
 *     t.tsTypeAnnotation(t.tsNumberKeyword()),
 *   )
 * ]
 */
export function parseLocalVariableAsProperties(generator: t.FunctionDeclaration): t.TSPropertySignature[] {
    return parseLocalVariableDeclarations(generator).flatMap(localVar => localVar.declarations).map((declaration) => {
        if (t.isIdentifier(declaration.id)) {
            const identifier = declaration.id as t.Identifier;
            let type: t.TSTypeAnnotation = (!!identifier.typeAnnotation && !t.isNoop(identifier.typeAnnotation)) ? identifier.typeAnnotation as t.TSTypeAnnotation : t.tsTypeAnnotation(t.tSAnyKeyword());
            if (identifier.optional) type = t.tsTypeAnnotation(t.tsOptionalType(type.typeAnnotation));
            return t.tsPropertySignature(
                t.identifier(declaration.id.name),
                type,
            );
        }
        // TODO: object binding, array binding, rest element binding, etc.
        throw new Error("Unsupported local variable declaration type");
    });
}
