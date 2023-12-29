import * as t from "@babel/types";
import { parseLocalVariableAsProperties } from "./local-variables.parser";
import { getGeneratorFromCode } from "../../util/test-utils";

describe("local variable parser", () => {
    it("should parse single identifier variable declarations", () => {
        const code = `function* foo() { let a: number = 0; }`;
        const generator = getGeneratorFromCode(code);
        const localVariables = parseLocalVariableAsProperties(generator);
        expect(localVariables).toHaveLength(1);
        expect(localVariables[0]).toMatchObject(
            t.tsPropertySignature(
                t.identifier("a"),
                t.tsTypeAnnotation(t.tsNumberKeyword())
            )
        );
    })
    it("should parse multiple identifier variable declarations", () => {
        const code = `function* foo() { let a: number = 0, b: string = "42"; }`;
        const generator = getGeneratorFromCode(code);
        const localVariables = parseLocalVariableAsProperties(generator);
        expect(localVariables).toHaveLength(2);
        expect(localVariables[0]).toMatchObject(
            t.tsPropertySignature(
                t.identifier("a"),
                t.tsTypeAnnotation(t.tsNumberKeyword())
            )
        );
        expect(localVariables[1]).toMatchObject(
            t.tsPropertySignature(
                t.identifier("b"),
                t.tsTypeAnnotation(t.tsStringKeyword())
            )
        );
    })
})