import { parse } from "@babel/parser";
import generate from "@babel/generator";

const code = `
class Example {

    private state: { nextStep: number, a: number, b: number };

    constructor(a: number, b: number) {
        this.state = {
            nextStep: 0,
            a,
            b,
        };
    }
}
`;
const ast = parse(code, {
    sourceType: "module",
    plugins: [
        "typescript"
    ],
});
console.log(JSON.stringify(ast, null, 4));

const output = generate(
    ast,
    {
        plugins: ["typescript"],
    },
);

console.log(JSON.stringify(output, null, 4));

const rawAst = {
    type: "File",
    program: {
        type: "Program",
        body: [
            {
                type: "ClassDeclaration",
                id: {
                    type: "Identifier",
                    name: "Example",
                },
                body: {
                    type: "ClassBody",
                    body: [
                        {
                            type: "ClassProperty",
                            accessibility: "private",
                            static: false,
                            key: {
                                "type": "Identifier",
                                "name": "state"
                            },
                            typeAnnotation: {
                                "type": "TypeAnnotation",
                                "typeAnnotation": {
                                    "type": "TSTypeLiteral",
                                    "members": [
                                        {
                                            "type": "TSPropertySignature",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "nextStep"
                                            },
                                            "typeAnnotation": {
                                                "type": "TypeAnnotation",
                                                "typeAnnotation": {
                                                    "type": "TSNumberKeyword"
                                                }
                                            }
                                        },
                                        {
                                            "type": "TSPropertySignature",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "a"
                                            },
                                            "typeAnnotation": {
                                                "type": "TypeAnnotation",
                                                "typeAnnotation": {
                                                    "type": "TSNumberKeyword"
                                                }
                                            }
                                        },
                                        {
                                            "type": "TSPropertySignature",
                                            "key": {
                                                "type": "Identifier",
                                                "name": "b"
                                            },
                                            "typeAnnotation": {
                                                "type": "TypeAnnotation",
                                                "typeAnnotation": {
                                                    "type": "TSNumberKeyword"
                                                }
                                            }
                                        },
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
                                {
                                    type: "Identifier",
                                    name: "a",
                                    typeAnnotation: {
                                        type: "TypeAnnotation",
                                        typeAnnotation: {
                                            type: "TSNumberKeyword",
                                        },
                                    },
                                },
                                {
                                    type: "Identifier",
                                    name: "b",
                                    typeAnnotation: {
                                        type: "TypeAnnotation",
                                        typeAnnotation: {
                                            type: "TSNumberKeyword",
                                        },
                                    },
                                },
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
                                                    name: "state",
                                                },
                                            },
                                            right: {
                                                type: "ObjectExpression",
                                                properties: [
                                                    {
                                                        type: "ObjectProperty",
                                                        key: {
                                                            type: "Identifier",
                                                            name: "nextStep",
                                                        },
                                                        value: {
                                                            type: "NumericLiteral",
                                                            value: 0,
                                                        },
                                                    },
                                                    {
                                                        type: "ObjectProperty",
                                                        key: {
                                                            type: "Identifier",
                                                            name: "a",
                                                        },
                                                        shorthand: true,
                                                        value: {
                                                            type: "Identifier",
                                                            name: "a",
                                                        },
                                                    },
                                                    {
                                                        type: "ObjectProperty",
                                                        key: {
                                                            type: "Identifier",
                                                            name: "b",
                                                        },
                                                        shorthand: true,
                                                        value: {
                                                            type: "Identifier",
                                                            name: "b",
                                                        },
                                                    },
                                                ],
                                            },
                                        }
                                    }
                                ],
                            },
                        }
                    ],
                },
            },
        ],
    },
}

const output2 = generate(
    rawAst,
    {
        plugins: ["typescript"],
    },
);
console.log(JSON.stringify(output2, null, 4));