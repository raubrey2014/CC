### Generator to State Machine Compiler

What do we need to do? These could be considered the "micro passes" of our compiler. The micro passes will prioritize clear understanding over performance.

Micro passes:
0. Parse the input program
1. Identify the parameters to our generator function
2. Break down the return type of the Generator function
    1. Remember: `Generator<YieldedType, ReturnedType, NextParamType>`
3. Identify the local variables in the generator function
4. Identify the yield statements in the generator function
5. Create a Generator class
    1. Create a constructor that takes the parameters as arguments
    2. Construct a state variable containing a `nextStep` parameter, local variables, and parameters (initialized by the constructor parameters)
    3. Construct the Generator next method
        1. Single parameter of `value` 
        2. Return type of IteratorResult
        type IteratorResult<T, TReturn = any> =
            | IteratorYieldResult<T>
            | IteratorReturnResult<TReturn>;
        3. Yield statements form the case statements of a switch statement
        4. The return value of the yield statement is the return value of the case statement
        5. Local variables are updated to reference the state variable
        6. `value` parameter replaces yield expressions


### Parse the input program, build a useful intermediate representation

We need a useful representation of the input program. Our options:
- TS compiler: while useful, it's API requires walking the nodes of the AST
- Babel parser: includes Typescript support and yields a full AST object with more helpful metadata (ex: `generator: boolean` flag on `FunctionDeclaration` nodes)

We'll use Babel parser for now.

Babel parsing out `sum.ts` program yields:

```
{
    ...
    "program": {
        ...
        body: [
            {
                "type": "FunctionDeclaration",
                "id": {
                    "type": "Identifier",
                    ...
                    "name": "foo"
                },
                "generator": true,
                "async": false,
                "params": [
                    {
                        "type": "Identifier",
                        ...
                        "name": "a",
                        "typeAnnotation": {
                            "type": "TypeAnnotation",
                            ...
                            "typeAnnotation": {
                                "type": "NumberKeyword"
                            }
                        }
                    },
                    {
                        "type": "Identifier",
                        ...
                        "name": "b",
                        "typeAnnotation": {
                            "type": "TSTypeAnnotation",
                            ...
                            "typeAnnotation": {
                                "type": "NumberKeyword"
                            }
                        }
                    }
                ],
                "body": {
                    "type": "BlockStatement",
                    ...
                    "body": [
                        {
                            "type": "VariableDeclaration",
                            ...
                            "declarations": [
                                {
                                    "type": "VariableDeclarator",
                                    ...
                                    "id": {
                                        "type": "Identifier",
                                        ...
                                        "name": "sum"
                                    },
                                    "init": {
                                        "type": "NumericLiteral",
                                        ...
                                        "value": 0,
                                    }
                                }
                            ],
                        }
                    ]
                },
                "returnType": {
                    "type": "TSTypeAnnotation",
                    ...
                    "typeAnnotation": {
                        "type": "TSTypeReference",
                        "typeName": {
                            "type": "Identifier",
                            ...
                            "name": "Generator",
                        },
                        "typeParameters": {
                            "type": "TSTypeParameterInstantiation",
                            ...
                            "params": [
                                {
                                    "type": "TSNumberKeyword"
                                    ...
                                },
                                {
                                    "type": "TSNumberKeyword"
                                    ...
                                },
                                {
                                    "type": "TSNumberKeyword"
                                    ...
                                }
                            ]
                        }
                    }
                },
            },
            ...
        ]
    }
}
```


### Using our intermediate representation, identify...

1. The parameters to the Generator function

From above:

```
const parsed = babelParser.parseFile('simple.ts', {
    sourceType: 'module',
    plugins: ['typescript']
});

// Naive approach assumes Generator function is the first function declaration in the program
const generatorFunction = parsed.program.body[0];
const parameters = generatorFunction.params;
```

2. Each component of the Generator function's return type

```
const [yieldType, returnType, nextParamType] = generatorFunction.returnType.typeAnnotation.typeParameters.params;
```


3. Identify the local variables in the generator function

This will need to be iterative, as I'm still shaky on how many different forms a variable declaration can take.

First, we'll observe the NumericLiteral assignment found in `sum.ts` - `const sum = 0;`

```
const declarations = generatorFunction.body.body.filter(expr => expr.type === 'VariableDeclaration').declarations;
```

Note, this ignores trickier cases like `const [a, b] = [1, 2];`, `const { a, b } = { a: 1, b: 2 };`, and `for (let i = 0; i < 10; i++) { ... }`. We'll need to handle these later.

4. Identify the yield statements in the generator function

This can be tricky. Yield statements can be found in a number of places:
- Standalone: `yield 1;`
- In an assignment: `const a = yield 1;`
- In a return statement: `return yield 1;`

In the standalone case, we can simply match on `YieldExpression` nodes. But for the assignment or return case, we'll need to match on `AssignmentExpression` and `ReturnStatement` nodes, respectively, and then match on the `YieldExpression` node within. There must be a more generic way to do this, but I'm not sure what it is. Possibly:
- within any expression, traverse the tree and match on `YieldExpression` nodes
- if you find a YieldExpression, you need to replace the yield expression with the `value` parameter in the state machine once it is constructed
- while traversing expressions in the body searching for YieldExpressions, you'll need to keep track of the statements that occur between yield statements. These will be the bodies of the case statements in the state machine.
- The value of the yield (i.e. `1` in the above examples) will be returned from that given step in the state machine.

So rather than simply collecting an array of yieldStatements, we'll need to collect an array of objects that contain:
- the expressions that occurred before the yield statement (these will be standalone)
- the expression that is the yield statement is a part of;
- the yield statement's return value


5. Create a Generator class

I think we can also use Babel for this.

`@babel/generator` can be used to generate code from an AST. We'll use this to generate the Generator class.

Sure enough, check out `babel-generate.ts`'s example.

