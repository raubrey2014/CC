import generate from "@babel/generator";
import { ParseResult, parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { GeneratorComponents } from "../types";

export class Replacer {

    private identityAccessToBeReplacedWithStateAccess: string[] = [];

    constructor(generatorComponents: GeneratorComponents) {
        // TODO: completely rethink this :puke:
        this.identityAccessToBeReplacedWithStateAccess = [
            ...generatorComponents.localVariablesAsProperties.filter(member => "key" in member && "name" in member.key).map(member => member.key["name"]),
            ...generatorComponents.parametersAsProperties.map(member => member.name),
        ];
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

    /**
     * let a: number = 123;
     * 
     * becomes..
     * 
     * this.state.a = 123;
     */
    public replaceLocalVariableWithState(node: t.Node): t.Node[] {
        if (t.isIdentifier(node)) {
            if (this.identityAccessToBeReplacedWithStateAccess.includes(node.name)) {
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

    public replaceLocalVariableAccessWithStateAccessInPlace(ast: ParseResult<t.File>) {
        traverse(ast as ParseResult<t.File>, {
            enter(path, { identifyNamesToBeReplacedWithState }) {
                if (t.isClassMethod(path.node) && t.isIdentifier(path.node.key) && path.node.key.name === "nextStep") {
                    path.traverse({
                        enter(innerPath) {
                            // Replace all usages of local variables with state member access
                            if (t.isIdentifier(innerPath.node) && identifyNamesToBeReplacedWithState.includes(innerPath.node.name) && !t.isMemberExpression(innerPath.parent)) {
                                innerPath.replaceWith(t.memberExpression(
                                    t.memberExpression(
                                        t.thisExpression(),
                                        t.identifier("state"),
                                    ),
                                    t.identifier(innerPath.node.name),
                                ))
                            }
                        }
                    })
                }
            }
        }, undefined, { identifyNamesToBeReplacedWithState: this.identityAccessToBeReplacedWithStateAccess });
    }
}


