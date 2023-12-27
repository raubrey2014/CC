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

export interface PreYieldStep {
    // expressions that occur before the yield expression
    preYieldStatements: t.Statement[];
    // the expression the yield is a part of
    yieldStatement: t.Statement;
    // the possibly yielded value (which will be an expression itself)
    yieldedValue?: t.Expression;
}
export interface GeneratorComponents {
    name: string;
    parameters: (t.Identifier | t.RestElement | t.Pattern)[];
    yieldType: t.TSType;
    returnType: t.TSType;
    nextStepParamType: t.TSType;
    localVariables: t.VariableDeclaration[];

    /**
     * Steps are built from expressions between yield expressions. The yield expression
     * needs to be broken between steps:
     * - the yielded argument should be returned from step N
     * - the yielded expression should be included in step N+1, with the yield expression replaced with the value parameter
     */
    steps: StateMachineStep[];
}