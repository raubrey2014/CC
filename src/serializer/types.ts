import * as t from '@babel/types';

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
    parameters: t.Identifier[];
    yieldType: t.TSType;
    returnType: t.TSType;
    nextStepParamType: t.TSType;
    localVariables: t.VariableDeclaration[];
    /**
     * Steps are built from yield expressions. Each yield expression results in a step.
     */
    steps: PreYieldStep[];
}