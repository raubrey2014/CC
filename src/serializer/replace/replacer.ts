import * as t from "@babel/types";

export const replaceYieldInStatementWithValue = (node: t.Node): t.Node => {
    if (t.isYieldExpression(node)) {
        return t.identifier("value");
    }
    if (t.isExpressionStatement(node)) {
        return t.expressionStatement(
            replaceYieldInStatementWithValue(node.expression) as t.Expression
        )
    }
    if (t.isAssignmentExpression(node)) {
        return t.assignmentExpression(
            node.operator,
            replaceYieldInStatementWithValue(node.left) as t.OptionalMemberExpression | t.LVal,
            replaceYieldInStatementWithValue(node.right) as t.Expression,
        )
    }
    return node;
}


export const replaceLocalVariableWithStateAssignment = (node: t.Node): t.Node[] => {
    if (t.isVariableDeclaration(node)) {
        return node.declarations.map((declaration) => {
            return t.expressionStatement(
                t.assignmentExpression(
                    "=",
                    t.memberExpression(
                        t.memberExpression(
                            t.thisExpression(),
                            t.identifier("state"),
                        ),
                        t.identifier((declaration.id as t.Identifier).name),
                    ),
                    declaration.init as t.Expression,
                )
            );
        });
    }
    if (t.isExpressionStatement(node) && t.isAssignmentExpression(node.expression)) {
        return [
            t.expressionStatement(
                t.assignmentExpression(
                    node.expression.operator,
                    t.memberExpression(
                        t.memberExpression(
                            t.thisExpression(),
                            t.identifier("state"),
                        ),
                        t.identifier((node.expression.left as t.Identifier).name),
                    ),
                    node.expression.right as t.Expression,
                )
            )
        ]
    }

    return [node];
}

export const replaceIdentifiersWithStateMemberAccess = (node: t.Node): t.Node => {
    if (t.isIdentifier(node)) {
        return t.memberExpression(
            t.memberExpression(
                t.thisExpression(),
                t.identifier("state"),
            ),
            t.identifier(node.name),
        );
    }
    if (t.isExpressionStatement(node)) {
        return t.expressionStatement(
            replaceIdentifiersWithStateMemberAccess(node.expression) as t.Expression
        )
    }
    return node;
}