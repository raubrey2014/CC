import * as t from '@babel/types';
import { Replacer } from "./replacer";
import { GeneratorComponents } from '../../types';

const replacer = new Replacer({ localVariablesAsProperties: [], parametersAsProperties: [] } as unknown as GeneratorComponents);

describe("replacer", () => {
    describe("replaceYieldInStatementWithValue", () => {
        it("should replace yield", () => {
            const replacement = replacer.replaceYieldInStatementWithValue(t.expressionStatement(t.yieldExpression()));
            expect(replacement).toStrictEqual(t.expressionStatement(t.identifier("value")));
        });
        it("should replace yield with argument", () => {
            const replacement = replacer.replaceYieldInStatementWithValue(t.expressionStatement(t.yieldExpression(t.identifier("a"))));
            expect(replacement).toStrictEqual(t.expressionStatement(t.identifier("value")));
        });

        it("should replace yield in assignment expression", () => {
            const replacement = replacer.replaceYieldInStatementWithValue(t.expressionStatement(t.assignmentExpression("+=", t.identifier("a"), t.yieldExpression())));
            expect(replacement).toStrictEqual(t.expressionStatement(t.assignmentExpression("+=", t.identifier("a"), t.identifier("value"))));
        });
    })
})