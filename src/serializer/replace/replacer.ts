import * as t from "@babel/types";

export class Replacer {

    constructor(private identifyNamesToBeReplacedWithState: string[]) {

    }

    public replaceYieldInStatementWithValue(node: t.Node): t.Node {
        if (t.isYieldExpression(node)) {
            return t.identifier("value");
        }
        if (t.isExpressionStatement(node)) {
            return t.expressionStatement(
                this.replaceYieldInStatementWithValue(node.expression) as t.Expression
            )
        }
        if (t.isAssignmentExpression(node)) {
            return t.assignmentExpression(
                node.operator,
                this.replaceYieldInStatementWithValue(node.left) as t.OptionalMemberExpression | t.LVal,
                this.replaceYieldInStatementWithValue(node.right) as t.Expression,
            )
        }
        return node;
    }

    public replaceIdentifiersWithStateMemberAccess(node: t.Node): t.Node {
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
                this.replaceIdentifiersWithStateMemberAccess(node.expression) as t.Expression
            )
        }
        return node;
    }

    public replaceLocalVariableWithState(node: t.Node): t.Node[] {

        if (t.isIdentifier(node)) {
            if (this.identifyNamesToBeReplacedWithState.includes(node.name)) {
                return [t.memberExpression(
                    t.memberExpression(
                        t.thisExpression(),
                        t.identifier("state"),
                    ),
                    t.identifier(node.name),
                )];
            }
        }


        if (t.isVariableDeclaration(node)) {
            return node.declarations.map((declaration) => {
                return t.variableDeclarator(
                    t.memberExpression(
                        t.memberExpression(
                            t.thisExpression(),
                            t.identifier("state"),
                        ),
                        t.identifier((declaration.id as t.Identifier).name),
                    ),
                    declaration.init as t.Expression,
                );
            });
        }

        if (t.isExpressionStatement(node) && t.isAssignmentExpression(node.expression)) {
            return [t.expressionStatement(
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
            )]
        }


        return [node];
    }
}


