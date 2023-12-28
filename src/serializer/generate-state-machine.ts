import generate from "@babel/generator";
import { GeneratorComponents } from "./types";
import * as t from "@babel/types";
import { Replacer } from "./replace/replacer";
import { ParseResult, parse } from "@babel/parser";
import { traverse } from "@babel/types";

const upperFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Converts a local variable declaration to a state assignment.
 * 
 * i.e.
 * 
 * let a: number = 0;
 * 
 * to
 * 
 * state.a = 0;
 */
const localVariableConstructorInstantiation = (declarator: t.VariableDeclarator): t.Expression => {
    if (declarator.id.type !== "Identifier") {
        throw new Error("Unsupported local variable declaration to state assignment conversion. " + JSON.stringify(declarator, null, 4));
    }

    const declaration = declarator.id as t.Identifier;
    if (declaration.typeAnnotation && t.isTSTypeAnnotation(declaration.typeAnnotation)) {
        switch (declaration.typeAnnotation.typeAnnotation.type) {
            case "TSNumberKeyword":
                return t.numericLiteral(0);
            case "TSStringKeyword":
                return t.stringLiteral("");
            case "TSBooleanKeyword":
                return t.booleanLiteral(false);
            case "TSAnyKeyword":
                return t.buildUndefinedNode();
            case "TSArrayType":
                return t.arrayExpression([]);
            case "TSUnionType":
                return t.objectExpression([]);
            case "TSTypeReference":
                return t.objectExpression([]);
            default:
                throw new Error("Unsupported local variable declaration to state assignment conversion for given type. " + JSON.stringify(declarator, null, 4));
        }
    } else {
        return t.buildUndefinedNode();
    }
}

const getParameterName = (parameter: t.Identifier | t.Pattern | t.RestElement): string => {
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

const getParameterType = (parameter: t.Identifier | t.Pattern | t.RestElement): t.TypeAnnotation | t.TSTypeAnnotation | t.Noop | null | undefined => {
    if (t.isIdentifier(parameter)) {
        return parameter.typeAnnotation || t.tsTypeAnnotation(t.tsAnyKeyword());
    }
    if (t.isAssignmentPattern(parameter)) {
        if (t.isIdentifier(parameter.left)) {
            return getParameterType(parameter.left);
        }
    }
    if (t.isRestElement(parameter)) {
        return parameter.typeAnnotation || t.tsTypeAnnotation(t.tsArrayType(t.tsAnyKeyword()));
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
    throw new Error("Unsupported parameter type, cannot parse if is optional: " + JSON.stringify(parameter, null, 4));
}


/**
 * Generates a Generator class (as a code string) from the parsed components of a generator function.
 */
export function generateSerializableStateMachine(generatorComponents: GeneratorComponents): string {

    const localVariableStateMembers = generatorComponents.localVariables.flatMap(localVar => localVar.declarations).map((declaration) => ({
        type: "TSPropertySignature",
        key: t.identifier((declaration.id as t.Identifier).name),
        typeAnnotation: (declaration.id as t.Identifier).typeAnnotation,
        optional: (declaration.id as t.Identifier).optional || false
    }));
    const parameterStateMembers = generatorComponents.parameters.map((parameter) => ({
        type: "TSPropertySignature",
        key: t.identifier(getParameterName(parameter)),
        typeAnnotation: getParameterType(parameter),
        optional: isParameterOptional(parameter)
    }));

    const stateMembersTypes = [
        // nextStep
        t.tsPropertySignature(
            t.identifier("nextStep"),
            t.tsTypeAnnotation(t.tsNumberKeyword()),
        ),
        // local variables
        ...localVariableStateMembers,
        ...parameterStateMembers,
    ];

    const identifyNamesToBeReplacedWithState = [
        ...localVariableStateMembers.map(member => member.key.name),
        ...parameterStateMembers.map(member => member.key.name),
    ];

    const replacer = new Replacer(identifyNamesToBeReplacedWithState);


    const constructorStateAssignments = t.objectExpression([
        t.objectProperty(
            t.identifier("nextStep"),
            t.numericLiteral(0),
        ),
        ...generatorComponents.parameters.map((parameter) =>
            t.objectProperty(
                t.identifier(getParameterName(parameter)),
                t.identifier(getParameterName(parameter)),
            )),
        ...generatorComponents.localVariables.flatMap(localVar => localVar.declarations).map((declarator) =>
            t.objectProperty(
                t.identifier((declarator.id as t.Identifier).name),
                t.tsInstantiationExpression(localVariableConstructorInstantiation(declarator))
            )),
    ]);

    const stateMachineCases = generatorComponents.steps.map((step, index) => {
        const isLastStep = index === generatorComponents.steps.length - 1;
        const incrementNextStepStatement = {
            type: "ExpressionStatement",
            expression: {
                type: "AssignmentExpression",
                operator: "=",
                left: {
                    type: "MemberExpression",
                    object: {
                        type: "MemberExpression",
                        object: t.thisExpression(),
                        property: t.identifier("state"),
                    },
                    property: t.identifier("nextStep"),
                },
                right: t.numericLiteral(index + 1),
            }
        };
        const returnStatement = {
            type: "ReturnStatement",
            argument: {
                type: "ObjectExpression",
                properties: [
                    {
                        "type": "ObjectProperty",
                        "key": t.identifier("value"),
                        "value": step.returnExpression ? replacer.replaceIdentifiersWithStateMemberAccess(step.returnExpression) : null
                    },
                    {
                        "type": "ObjectProperty",
                        "key": t.identifier("done"),
                        "value": t.booleanLiteral(isLastStep),
                    }
                ]
            }
        };

        const replacedYieldedExpression = step.startingYield ?
            replacer.replaceLocalVariableWithState(replacer.replaceYieldInStatementWithValue(step.startingYield)) : [];
        const consequent = isLastStep ?
            [...replacedYieldedExpression, ...step.statements.flatMap(replacer.replaceLocalVariableWithState), returnStatement] :
            [...replacedYieldedExpression, ...step.statements.flatMap(replacer.replaceLocalVariableWithState), incrementNextStepStatement, returnStatement];
        return {
            type: "SwitchCase",
            test: t.numericLiteral(index),
            consequent: consequent,
        }
    });

    const ast = {
        type: "File",
        program: {
            type: "Program",
            body: [
                {
                    type: "ClassDeclaration",
                    id: t.identifier(upperFirst(generatorComponents.name) + "Generator"),
                    body: {
                        type: "ClassBody",
                        body: [
                            {
                                type: "ClassProperty",
                                accessibility: "private",
                                key: t.identifier("state"),
                                typeAnnotation: {
                                    type: "TypeAnnotation",
                                    typeAnnotation: {
                                        type: "TSTypeLiteral",
                                        members: [
                                            ...stateMembersTypes,
                                        ]
                                    }
                                }
                            },
                            {
                                type: "ClassMethod",
                                key: t.identifier("constructor"),
                                kind: "constructor",
                                params: generatorComponents.parameters,
                                body: {
                                    type: "BlockStatement",
                                    body: [
                                        {
                                            type: "ExpressionStatement",
                                            expression: {
                                                type: "AssignmentExpression",
                                                operator: "=",
                                                left: {
                                                    type: "MemberExpression",
                                                    object: t.thisExpression(),
                                                    property: t.identifier("state"),
                                                },
                                                right: constructorStateAssignments
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                type: "ClassMethod",
                                key: t.identifier("saveState"),
                                params: [],
                                returnType: {
                                    type: "TSTypeAnnotation",
                                    typeAnnotation: {
                                        type: "TSTypeLiteral",
                                        members: [
                                            ...stateMembersTypes,
                                        ]
                                    }
                                },
                                body: {
                                    type: "BlockStatement",
                                    body: [
                                        {
                                            type: "ReturnStatement",
                                            argument: {
                                                type: "ObjectExpression",
                                                properties: [
                                                    {
                                                        type: "SpreadElement",
                                                        argument: {
                                                            type: "MemberExpression",
                                                            object: t.thisExpression(),
                                                            property: t.identifier("state"),
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                type: "ClassMethod",
                                key: t.identifier("loadState"),
                                params: [
                                    {
                                        type: "Identifier",
                                        name: "state",
                                        typeAnnotation: {
                                            type: "TSTypeAnnotation",
                                            typeAnnotation: {
                                                type: "TSObjectKeyword",
                                            }
                                        }
                                    }
                                ],
                                returnType: t.tsTypeAnnotation(t.tsVoidKeyword()),
                                body: {
                                    type: "BlockStatement",
                                    body: [
                                        {
                                            type: "ExpressionStatement",
                                            expression: {
                                                type: "AssignmentExpression",
                                                operator: "=",
                                                left: {
                                                    type: "MemberExpression",
                                                    object: t.thisExpression(),
                                                    property: t.identifier("state"),
                                                },
                                                right: {
                                                    type: "ObjectExpression",
                                                    properties: [
                                                        {
                                                            type: "SpreadElement",
                                                            argument: {
                                                                type: "TSAsExpression",
                                                                expression: t.identifier("state"),
                                                                typeAnnotation: {
                                                                    type: "TSTypeLiteral",
                                                                    members: [
                                                                        ...stateMembersTypes,
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                type: "ClassMethod",
                                key: t.identifier("nextStep"),
                                params: [
                                    {
                                        type: "Identifier",
                                        name: "value",
                                        typeAnnotation: {
                                            type: "TSTypeAnnotation",
                                            typeAnnotation: generatorComponents.nextStepParamType,
                                        }
                                    }
                                ],
                                returnType: {
                                    type: "TSTypeAnnotation",
                                    typeAnnotation: {
                                        type: "TSTypeReference",
                                        typeName: t.identifier("IteratorResult"),
                                        typeParameters: {
                                            type: "TSTypeParameterInstantiation",
                                            params: [
                                                generatorComponents.yieldType,
                                                generatorComponents.returnType
                                            ]
                                        }
                                    }
                                },
                                body: {
                                    type: "BlockStatement",
                                    body: [
                                        {
                                            type: "SwitchStatement",
                                            discriminant: {
                                                type: "MemberExpression",
                                                object: {
                                                    type: "MemberExpression",
                                                    object: t.thisExpression(),
                                                    property: t.identifier("state"),
                                                },
                                                property: t.identifier("nextStep"),
                                            },
                                            cases: [
                                                ...stateMachineCases,
                                                {
                                                    type: "SwitchCase",
                                                    test: null,
                                                    consequent: [
                                                        t.throwStatement(t.newExpression(t.identifier("Error"), [t.stringLiteral("Invalid next step")]))
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };

    const output = generate(
        ast as t.File
    );

    const fullAst = parse(output.code, {
        sourceType: "module",
        plugins: [
            "typescript",
        ]
    });

    traverse(fullAst as ParseResult<t.File>, {
        enter(path) {
            if (t.isClassMethod(path) && t.isIdentifier(path.key) && ((path as t.ClassMethod).key as t.Identifier).name === "nextStep") {
                traverse(path, {
                    enter(innerPath, parents) {
                        // Replace all usages of local variables with state member access
                        if (t.isIdentifier(innerPath) && identifyNamesToBeReplacedWithState.includes(innerPath.name) && parents[parents.length - 1].node.type !== "MemberExpression") {
                            const tmp = t.memberExpression(
                                t.memberExpression(
                                    t.thisExpression(),
                                    t.identifier("state"),
                                ),
                                t.identifier(innerPath.name),
                            );
                            Object.assign(innerPath, tmp);
                        }
                    }
                })
            }
        }
    });

    return generate(fullAst as t.File).code;
}