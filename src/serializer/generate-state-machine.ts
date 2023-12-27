import generate from "@babel/generator";
import { GeneratorComponents } from "./types";
import * as t from "@babel/types";
import { replaceIdentifiersWithStateMemberAccess, replaceLocalVariableWithStateAssignment, replaceYieldInStatementWithValue } from "./replace/replacer";

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
const localVariableToStateAssignment = (declarator: t.VariableDeclarator) => {
    if (declarator.init?.type === "NumericLiteral") {
        return t.numericLiteral((declarator.init as t.NumericLiteral).value);
    } else if (declarator.init?.type === "StringLiteral") {
        return t.stringLiteral((declarator.init as t.StringLiteral).value);
    } else if (declarator.init?.type === "Identifier") {
        return t.identifier((declarator.init as t.Identifier).name);
    } else {
        throw new Error("Unsupported local variable declaration to state assignment conversion. " + JSON.stringify(declarator, null, 4));
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
        console.log('Rest element: ', parameter);
        return parameter.typeAnnotation;
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
    const stateMembersTypes = [
        // nextStep
        t.tsPropertySignature(
            t.identifier("nextStep"),
            t.tsTypeAnnotation(t.tsNumberKeyword()),
        ),
        // local variables
        ...generatorComponents.localVariables.flatMap(localVar => localVar.declarations).map((declaration) => ({
            type: "TSPropertySignature",
            key: {
                type: "Identifier",
                name: (declaration.id as t.Identifier).name,
            },
            typeAnnotation: (declaration.id as t.Identifier).typeAnnotation,
            optional: (declaration.id as t.Identifier).optional || false
        })),
        ...generatorComponents.parameters.map((parameter) => ({
            type: "TSPropertySignature",
            key: t.identifier(getParameterName(parameter)),
            typeAnnotation: getParameterType(parameter),
            optional: isParameterOptional(parameter)
        })),
    ]

    const constructorParameters = generatorComponents.parameters;

    const constructorStateAssignments = {
        type: "ObjectExpression",
        properties: [
            {
                type: "ObjectProperty",
                key: {
                    type: "Identifier",
                    name: "nextStep"
                },
                value: {
                    type: "NumericLiteral",
                    value: 0,
                }
            },
            ...generatorComponents.parameters.map((parameter) => ({
                type: "ObjectProperty",
                key: t.identifier(getParameterName(parameter)),
                value: t.identifier(getParameterName(parameter)),
                shorthand: false,
            })),
            ...generatorComponents.localVariables.flatMap(localVar => localVar.declarations).map((declarator) => ({
                type: "ObjectProperty",
                key: t.identifier((declarator.id as t.Identifier).name),
                value: localVariableToStateAssignment(declarator)
            })),
        ]
    }

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
                        object: {
                            type: "ThisExpression",
                        },
                        property: {
                            type: "Identifier",
                            name: "state"
                        },
                    },
                    property: {
                        type: "Identifier",
                        name: "nextStep"
                    }
                },
                right: {
                    type: "NumericLiteral",
                    value: index + 1,
                }
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
                        "value": step.returnExpression ? replaceIdentifiersWithStateMemberAccess(step.returnExpression) : null
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
            replaceLocalVariableWithStateAssignment(replaceYieldInStatementWithValue(step.startingYield)) : [];
        const consequent = isLastStep ?
            [...replacedYieldedExpression, ...step.statements.flatMap(replaceLocalVariableWithStateAssignment), returnStatement] :
            [...replacedYieldedExpression, ...step.statements.flatMap(replaceLocalVariableWithStateAssignment), incrementNextStepStatement, returnStatement];
        return {
            type: "SwitchCase",
            test: {
                type: "NumericLiteral",
                value: index,
            },
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
                    id: {
                        type: "Identifier",
                        name: upperFirst(generatorComponents.name) + "Generator",
                    },
                    body: {
                        type: "ClassBody",
                        body: [
                            {
                                type: "ClassProperty",
                                accessibility: "private",
                                static: false,
                                key: {
                                    type: "Identifier",
                                    name: "state"
                                },
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
                                key: {
                                    type: "Identifier",
                                    name: "constructor",
                                },
                                kind: "constructor",
                                params: [
                                    ...constructorParameters,
                                ],
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
                                                    object: {
                                                        type: "ThisExpression",
                                                    },
                                                    property: {
                                                        type: "Identifier",
                                                        name: "state"
                                                    }
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
                                                        {
                                                            type: "ThrowStatement",
                                                            argument: {
                                                                type: "NewExpression",
                                                                callee: {
                                                                    type: "Identifier",
                                                                    name: "Error"
                                                                },
                                                                arguments: [
                                                                    {
                                                                        type: "StringLiteral",
                                                                        value: "Invalid next step"
                                                                    }
                                                                ]
                                                            }
                                                        }
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

    return output.code;
}