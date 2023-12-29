import * as t from '@babel/types';
import { StateMachineStep } from '../../types';

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

const doesNodeContainReturn = (node: t.Node): boolean => {
    if (t.isReturnStatement(node)) {
        return true;
    }
    if (t.isExpressionStatement(node)) {
        return doesNodeContainReturn(node.expression);
    }
    if (t.isBlockStatement(node)) {
        return node.body.some((statement) => doesNodeContainReturn(statement));
    }
    if (t.isIfStatement(node)) {
        return doesNodeContainReturn(node.consequent) || (!!node.alternate && doesNodeContainReturn(node.alternate));
    }
    if (t.isSwitchStatement(node)) {
        return node.cases.some((caseStatement) => caseStatement.consequent.some((statement) => doesNodeContainReturn(statement)));
    }
    if (t.isTryStatement(node)) {
        return doesNodeContainReturn(node.block) || (!!node.handler && doesNodeContainReturn(node.handler.body)) || (!!node.finalizer && doesNodeContainReturn(node.finalizer));
    }
    if (t.isWhileStatement(node)) {
        return doesNodeContainReturn(node.body);
    }
    if (t.isDoWhileStatement(node)) {
        return doesNodeContainReturn(node.body);
    }
    if (t.isForStatement(node)) {
        return doesNodeContainReturn(node.body);
    }
    if (t.isForInStatement(node)) {
        return doesNodeContainReturn(node.body);
    }
    if (t.isForOfStatement(node)) {
        return doesNodeContainReturn(node.body);
    }
    if (t.isLabeledStatement(node)) {
        return doesNodeContainReturn(node.body);
    }
    if (t.isWithStatement(node)) {
        return doesNodeContainReturn(node.body);
    }
    if (t.isThrowStatement(node)) {
        return doesNodeContainReturn(node.argument);
    }
    if (t.isVariableDeclaration(node)) {
        return node.declarations.some((declaration) => doesNodeContainReturn(declaration));
    }
    if (t.isVariableDeclarator(node)) {
        return !!node.init && doesNodeContainReturn(node.init);
    }
    if (t.isConditionalExpression(node)) {
        return doesNodeContainReturn(node.consequent) || doesNodeContainReturn(node.alternate);
    }
    if (t.isLogicalExpression(node)) {
        return doesNodeContainReturn(node.left) || doesNodeContainReturn(node.right);
    }
    if (t.isBinaryExpression(node)) {
        return doesNodeContainReturn(node.left) || doesNodeContainReturn(node.right);
    }
    return false;
}

const returnArgumentInNode = (node: t.Node): t.Expression | undefined => {
    if (t.isReturnStatement(node)) {
        return node.argument || undefined;
    }
    if (t.isExpressionStatement(node)) {
        return returnArgumentInNode(node.expression);
    }
    if (t.isBlockStatement(node)) {
        const [possible] = node.body.map((statement) => returnArgumentInNode(statement));
        return possible;
    }
    if (t.isIfStatement(node)) {
        return returnArgumentInNode(node.consequent) || (node.alternate && returnArgumentInNode(node.alternate)) || undefined;
    }
    if (t.isAssignmentExpression(node)) {
        return returnArgumentInNode(node.left) || returnArgumentInNode(node.right);
    }
    return undefined;
}

export const parseStateMachineSteps = (generator: t.FunctionDeclaration): StateMachineStep[] => {
    const steps: StateMachineStep[] = [];
    // Go through each statement until a yield expression is found
    // Collect all expressions and yield argument into first step
    // Put yield expression but replaced with `value` identifier into second step
    let currentStep: Partial<StateMachineStep> = {
        statements: []
    };
    for (let i = 0; i < generator.body.body.length; i++) {
        const lastStatement = i === generator.body.body.length - 1;
        const statement = generator.body.body[i];
        // Check if expression contains a yield expression
        if (doesNodeContainYield(statement)) {
            const yieldedValue = yieldArgumentInNode(statement);
            // If so, add the current pre-yield statements, the yield expression, and the yielded value to the steps
            currentStep.returnExpression = yieldedValue;
            steps.push(Object.assign({}, currentStep, { done: lastStatement }) as StateMachineStep);
            currentStep = {
                startingYield: statement,
                statements: []
            };
        } else if (doesNodeContainReturn(statement)) {
            const returnedValue = returnArgumentInNode(statement);
            currentStep.returnExpression = returnedValue;
            steps.push(Object.assign({}, currentStep, { done: true }) as StateMachineStep);
            currentStep = {
                statements: []
            };
        } else {
            currentStep.statements?.push(statement);
        }
    }

    if (currentStep.startingYield || currentStep.statements?.length) {
        steps.push(Object.assign({}, currentStep, { done: true }) as StateMachineStep);
    }

    return steps;
}