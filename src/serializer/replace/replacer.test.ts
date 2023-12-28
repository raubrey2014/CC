import * as t from '@babel/types';
import { Replacer } from "./replacer";

const replacer = new Replacer([]);

describe("replacer", () => {
    describe("replaceYieldInStatementWithValue", () => {
        it("should replace yield", () => {
            const replacement: t.Statement = replacer.replaceYieldInStatementWithValue(t.expressionStatement(t.yieldExpression()));
            expect(replacement).toStrictEqual(t.expressionStatement(t.identifier("value")));
        });
        it("should replace yield with argument", () => {
            const replacement: t.Statement = replacer.replaceYieldInStatementWithValue(t.expressionStatement(t.yieldExpression(t.identifier("a"))));
            expect(replacement).toStrictEqual(t.expressionStatement(t.identifier("value")));
        });

        it("should replace yield in assignment expression", () => {
            const replacement: t.Statement = replacer.replaceYieldInStatementWithValue(t.expressionStatement(t.assignmentExpression("+=", t.identifier("a"), t.yieldExpression())));
            expect(replacement).toStrictEqual(t.expressionStatement(t.assignmentExpression("+=", t.identifier("a"), t.identifier("value"))));
        });
    })
})