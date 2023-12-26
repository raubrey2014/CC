import generate from "@babel/generator";
import { GeneratorComponents } from "./types";
import * as t from "@babel/types";

const upperFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Generates a Generator class (as a code string) from the parsed components of a generator function.
 */
export function generateSerializableStateMachine(generatorComponents: GeneratorComponents): string {

    const stateMembersTypes = [
        // nextStep
        {
            type: "TSPropertySignature",
            key: {
                type: "Identifier",
                name: "nextStep"
            },
            typeAnnotation: {
                type: "TypeAnnotation",
                typeAnnotation: {
                    type: "TSNumberKeyword"
                },
            },
        },
        // local variables
        ...generatorComponents.localVariables.flatMap(localVar => localVar.declarations).map((declaration) => ({
            type: "TSPropertySignature",
            key: {
                type: "Identifier",
                name: (declaration.id as t.Identifier).name,
            },
            typeAnnotation: {
                type: "TypeAnnotation",
                typeAnnotation: {
                    type: ((declaration.id as t.Identifier).typeAnnotation as t.TSTypeAnnotation).typeAnnotation.type,
                },
            },
        })),
        // parameters
        ...generatorComponents.parameters.map((parameter) => ({
            type: "TSPropertySignature",
            key: {
                type: "Identifier",
                name: parameter.name,
            },
            typeAnnotation: {
                type: "TypeAnnotation",
                typeAnnotation: {
                    type: (parameter.typeAnnotation as t.TSTypeAnnotation).typeAnnotation.type,
                },
            },
        })),
    ]

    const constructorParameters = [
        ...generatorComponents.parameters.map((parameter) => ({
            type: "Identifier",
            name: parameter.name,
            typeAnnotation: {
                type: "TypeAnnotation",
                typeAnnotation: {
                    type: (parameter.typeAnnotation as t.TSTypeAnnotation).typeAnnotation.type,
                },
            },
        })),
    ];

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
        // console.log("Converting: ", JSON.stringify(declarator, null, 4));
        if (declarator.init?.type === "NumericLiteral") {
            return {
                type: "NumericLiteral",
                value: (declarator.init as t.NumericLiteral).value,
            }
        } else if (declarator.init?.type === "StringLiteral") {
            return {
                type: "StringLiteral",
                value: (declarator.init as t.StringLiteral).value,
            }
        } else if (declarator.init?.type === "Identifier") {
            return {
                type: "Identifier",
                name: (declarator.init as t.Identifier).name,
            }
        } else {
            throw new Error("Unsupported local variable declaration to state assignment conversion. " + JSON.stringify(declarator, null, 4));
        }
    }


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
                key: {
                    type: "Identifier",
                    name: parameter.name,
                },
                value: {
                    type: "Identifier",
                    name: parameter.name,
                },
                shorthand: false,
            })),
            ...generatorComponents.localVariables.flatMap(localVar => localVar.declarations).map((declarator) => ({
                type: "ObjectProperty",
                key: {
                    type: "Identifier",
                    name: (declarator.id as t.Identifier).name,
                },
                value: localVariableToStateAssignment(declarator)
            })),
        ]
    }

    const stateMachineCases = generatorComponents.steps.map((step, index) => {

        return {
            type: "SwitchCase",
            test: {
                type: "NumericLiteral",
                value: index,
            },
            consequent: [
                {
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
                        },
                    },
                },
                ...step.preYieldStatements,
                {
                    type: "ReturnStatement",
                    "argument": {
                        "type": "ObjectExpression",
                        "properties": [
                            {
                                "type": "ObjectProperty",
                                "key": {
                                    "type": "Identifier",
                                    "name": "value"
                                },
                                "value": step.yieldedValue || null
                            },
                            {
                                "type": "ObjectProperty",
                                "key": {
                                    "type": "Identifier",
                                    "name": "done"
                                },
                                "value": {
                                    "type": "BooleanLiteral",
                                    "value": index === generatorComponents.steps.length - 1
                                }
                            }
                        ]
                    }
                }
            ],
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
                                "type": "ClassMethod",
                                "static": false,
                                "key": {
                                    "type": "Identifier",
                                    "name": "saveState"
                                },
                                "params": [],
                                "returnType": {
                                    "type": "TSTypeAnnotation",
                                    "typeAnnotation": {
                                        "type": "TSTypeLiteral",
                                        "members": [
                                            ...stateMembersTypes,
                                        ]
                                    }
                                },
                                "body": {
                                    "type": "BlockStatement",

                                    "body": [
                                        {
                                            "type": "ReturnStatement",
                                            "argument": {
                                                "type": "ObjectExpression",
                                                "properties": [
                                                    {
                                                        "type": "SpreadElement",
                                                        "argument": {
                                                            "type": "MemberExpression",
                                                            "object": {
                                                                "type": "ThisExpression",
                                                            },
                                                            "computed": false,
                                                            "property": {
                                                                "type": "Identifier",
                                                                "name": "state"
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ],
                                    "directives": []
                                }
                            },
                            {
                                "type": "ClassMethod",
                                "key": {
                                    "type": "Identifier",
                                    "name": "loadState"
                                },
                                "params": [
                                    {
                                        "type": "Identifier",
                                        "name": "state",
                                        "typeAnnotation": {
                                            "type": "TSTypeAnnotation",
                                            "typeAnnotation": {
                                                "type": "TSObjectKeyword",
                                            }
                                        }
                                    }
                                ],
                                "returnType": {
                                    "type": "TSTypeAnnotation",
                                    "typeAnnotation": {
                                        "type": "TSVoidKeyword",
                                    }
                                },
                                "body": {
                                    "type": "BlockStatement",
                                    "body": [
                                        {
                                            "type": "ExpressionStatement",
                                            "expression": {
                                                "type": "AssignmentExpression",
                                                "operator": "=",
                                                "left": {
                                                    "type": "MemberExpression",
                                                    "object": {
                                                        "type": "ThisExpression",
                                                    },
                                                    "property": {
                                                        "type": "Identifier",
                                                        "name": "state"
                                                    }
                                                },
                                                "right": {
                                                    "type": "ObjectExpression",
                                                    "properties": [
                                                        {
                                                            "type": "SpreadElement",
                                                            "argument": {
                                                                "type": "TSAsExpression",
                                                                "expression": {
                                                                    "type": "Identifier",
                                                                    "name": "state"
                                                                },
                                                                "typeAnnotation": {
                                                                    "type": "TSTypeLiteral",
                                                                    "members": [
                                                                        ...stateMembersTypes,
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                    "directives": []
                                }
                            },
                            {
                                "type": "ClassMethod",
                                "key": {
                                    "type": "Identifier",
                                    "name": "nextStep"
                                },
                                "params": [
                                    {
                                        "type": "Identifier",
                                        "name": "value",
                                        "optional": true,
                                        "typeAnnotation": {
                                            "type": "TSTypeAnnotation",
                                            "typeAnnotation": {
                                                "type": "TSNumberKeyword",
                                            }
                                        }
                                    }
                                ],
                                "returnType": {
                                    "type": "TSTypeAnnotation",
                                    "typeAnnotation": {
                                        "type": "TSTypeReference",
                                        "typeName": {
                                            "type": "Identifier",
                                            "name": "IteratorResult"
                                        },
                                        "typeParameters": {
                                            "type": "TSTypeParameterInstantiation",
                                            "params": [
                                                {
                                                    "type": generatorComponents.yieldType.type,
                                                },
                                                {
                                                    "type": generatorComponents.returnType.type,
                                                }
                                            ]
                                        }
                                    }
                                },
                                "body": {
                                    "type": "BlockStatement",
                                    "body": [
                                        {
                                            type: "SwitchStatement",
                                            discriminant: {
                                                type: "MemberExpression",
                                                object: {
                                                    type: "MemberExpression",
                                                    object: {
                                                        type: "ThisExpression",
                                                    },
                                                    property: {
                                                        type: "Identifier",
                                                        name: "state"
                                                    }
                                                },
                                                property: {
                                                    type: "Identifier",
                                                    name: "nextStep"
                                                }
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
                                                    ],
                                                }
                                            ],
                                        }
                                    ],
                                    "directives": []
                                }
                            }
                        ],
                    },
                },
            ],
        },
    };

    const output = generate(
        ast,
        {
            plugins: ["typescript"],
        }
    );

    console.log(JSON.stringify(output, null, 4));

    return output.code;
}