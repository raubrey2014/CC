import * as t from '@babel/types';

export interface StateMachineStep {
    /**
     * sum += yield a; // startingYield, we need `sum += `
     * console.log("example")
     * sum += yield b; // we need `b` as returnExpression
     * 
     * ...
     * 
     * case X:
     *    this.state.sum += value; // startingYield from above
     *    return {
     *         value: this.state.b, // returnExpression from above
     *         done: false
     *    }
     */
    startingYield?: t.Statement;
    statements: t.Statement[];
    returnExpression?: t.Expression;
    done: boolean;
}

export interface ParsedParameter {
    name: string;
    typeAnnotation: t.TSTypeAnnotation;
    optional: boolean;
}

export interface GeneratorComponents {
    async: boolean;
    name: string;
    parameters: (t.Identifier | t.RestElement | t.Pattern)[];
    yieldType: t.TSType;
    returnType: t.TSType;
    nextStepParamType: t.TSType;
    localVariables: t.VariableDeclaration[];

    /**
     * Parameters parsed into properties of the state object
     * 
     * ex: function* foo(a?: number) { ... }
     * 
     * as: { a?: number }
     */
    parametersAsProperties: ParsedParameter[]

    /**
     * Parameters parsed into properties of the state object
     * 
     * ex: function* foo(a?: number) {
     *    let b: number = 42;
     * }
     * 
     * as: { b: number }
     */
    localVariablesAsProperties: t.TSPropertySignature[]

    /**
     * Steps are built from expressions between yield expressions. The yield expression
     * needs to be broken between steps:
     * - the yielded argument should be returned from step N
     * - the yielded expression should be included in step N+1, with the yield expression replaced with the value parameter
     */
    steps: StateMachineStep[];
}