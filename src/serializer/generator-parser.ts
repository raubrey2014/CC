import * as t from "@babel/types";
import { GeneratorComponents, PreYieldStep } from "./types";

const doesNodeContainYield = (node: t.Node): boolean => {
    if (t.isYieldExpression(node)) {
        return true;
    }
    if (t.isExpressionStatement(node)) {
        return doesNodeContainYield(node.expression);
    }
    if (t.isBlockStatement(node)) {
        return node.body.some((statement) => doesNodeContainYield(statement));
    }
    if (t.isIfStatement(node)) {
        return doesNodeContainYield(node.consequent) || (!!node.alternate && doesNodeContainYield(node.alternate));
    }
    if (t.isSwitchStatement(node)) {
        return node.cases.some((caseStatement) => caseStatement.consequent.some((statement) => doesNodeContainYield(statement)));
    }
    if (t.isTryStatement(node)) {
        return doesNodeContainYield(node.block) || (!!node.handler && doesNodeContainYield(node.handler.body)) || (!!node.finalizer && doesNodeContainYield(node.finalizer));
    }
    if (t.isWhileStatement(node)) {
        return doesNodeContainYield(node.body);
    }
    if (t.isDoWhileStatement(node)) {
        return doesNodeContainYield(node.body);
    }
    if (t.isForStatement(node)) {
        return doesNodeContainYield(node.body);
    }
    if (t.isForInStatement(node)) {
        return doesNodeContainYield(node.body);
    }
    if (t.isForOfStatement(node)) {
        return doesNodeContainYield(node.body);
    }
    if (t.isLabeledStatement(node)) {
        return doesNodeContainYield(node.body);
    }
    if (t.isWithStatement(node)) {
        return doesNodeContainYield(node.body);
    }
    if (t.isReturnStatement(node)) {
        return !!node.argument && doesNodeContainYield(node.argument);
    }
    if (t.isThrowStatement(node)) {
        return doesNodeContainYield(node.argument);
    }
    if (t.isVariableDeclaration(node)) {
        return node.declarations.some((declaration) => doesNodeContainYield(declaration));
    }
    if (t.isVariableDeclarator(node)) {
        return !!node.init && doesNodeContainYield(node.init);
    }
    if (t.isConditionalExpression(node)) {
        return doesNodeContainYield(node.consequent) || doesNodeContainYield(node.alternate);
    }
    if (t.isLogicalExpression(node)) {
        return doesNodeContainYield(node.left) || doesNodeContainYield(node.right);
    }
    if (t.isBinaryExpression(node)) {
        return doesNodeContainYield(node.left) || doesNodeContainYield(node.right);
    }
    if (t.isUnaryExpression(node)) {
        return doesNodeContainYield(node.argument);
    }
    if (t.isUpdateExpression(node)) {
        return doesNodeContainYield(node.argument);
    }
    if (t.isAssignmentExpression(node)) {
        return doesNodeContainYield(node.left) || doesNodeContainYield(node.right);
    }
    if (t.isSequenceExpression(node)) {
        return node.expressions.some((expression) => doesNodeContainYield(expression));
    }
    if (t.isArrowFunctionExpression(node)) {
        return doesNodeContainYield(node.body);
    }
    if (t.isFunctionExpression(node)) {
        return doesNodeContainYield(node.body);
    }
    if (t.isObjectExpression(node)) {
        return node.properties.some((property) => doesNodeContainYield(property));
    }
    if (t.isObjectProperty(node)) {
        return doesNodeContainYield(node.value);
    }
    if (t.isArrayExpression(node)) {
        return node.elements.some((element) => !!element && doesNodeContainYield(element));
    }
    if (t.isSequenceExpression(node)) {
        return (node as t.SequenceExpression).expressions.some((expression) => doesNodeContainYield(expression));
    }
    if (t.isTemplateLiteral(node)) {
        return node.expressions.some((expression) => doesNodeContainYield(expression));
    }
    if (t.isTaggedTemplateExpression(node)) {
        return doesNodeContainYield(node.tag) || doesNodeContainYield(node.quasi);
    }
    if (t.isSpreadElement(node)) {
        return doesNodeContainYield(node.argument);
    }
    if (t.isAwaitExpression(node)) {
        return doesNodeContainYield(node.argument);
    }
    if (t.isImportExpression(node)) {
        return doesNodeContainYield(node.source);
    }
    return false;
}

const yieldArgumentInNode = (node: t.Node): t.Expression | undefined => {
    if (t.isYieldExpression(node)) {
        return node.argument || undefined;
    }
    if (t.isExpressionStatement(node)) {
        return yieldArgumentInNode(node.expression);
    }
    if (t.isBlockStatement(node)) {
        const [possible] = node.body.map((statement) => yieldArgumentInNode(statement));
        return possible;
    }
    if (t.isIfStatement(node)) {
        return yieldArgumentInNode(node.consequent) || (node.alternate && yieldArgumentInNode(node.alternate)) || undefined;
    }
    if (t.isReturnStatement(node)) {
        return node.argument ? yieldArgumentInNode(node.argument) : undefined;
    }
    if (t.isAssignmentExpression(node)) {
        return yieldArgumentInNode(node.left) || yieldArgumentInNode(node.right);
    }
    return undefined;
}

export function parseGenerator(generator: t.FunctionDeclaration): GeneratorComponents {
    const nameOfGenerator = generator.id!.name;

    // Limitation #1: Only support parameters of Identifier type
    const parameters = generator.params.map((param) => {
        if (t.isIdentifier(param)) {
            return param;
        } else {
            throw new Error("Unsupported parameter type: " + param.type);
        }
    });

    // Limitation #2: Assume perfectly typed Generator<YieldedType, ReturnType, NextStepParamType>
    const [yieldType, returnType, nextStepParamType] = ((generator.returnType as t.TSTypeAnnotation).typeAnnotation as t.TSTypeReference).typeParameters!.params;

    const localVariables = generator.body.body.filter((node) => t.isVariableDeclaration(node)).map((node) => node as t.VariableDeclaration);

    const steps: PreYieldStep[] = []
    let currentPreYieldStatements: t.Statement[] = [];
    for (const statement of generator.body.body) {
        // Check if expression contains a yield expression
        if (doesNodeContainYield(statement)) {
            const yieldedValue = yieldArgumentInNode(statement);
            // If so, add the current pre-yield statements, the yield expression, and the yielded value to the steps
            steps.push({
                preYieldStatements: currentPreYieldStatements,
                yieldStatement: statement,
                yieldedValue: yieldedValue
            });
            currentPreYieldStatements = [];
        } else {
            currentPreYieldStatements.push(statement);
        }
    }

    return {
        name: nameOfGenerator,
        parameters,
        yieldType,
        returnType,
        nextStepParamType,
        localVariables,
        steps,
    };
}

const isGenerator = (node: t.Node): boolean => {
    return t.isFunctionDeclaration(node) && node.generator;
}

export function parseGenerators(ast: t.File): GeneratorComponents[] {
    const generators = ast.program.body.filter(isGenerator).map((node) => node as t.FunctionDeclaration);
    return generators.map(parseGenerator);

}