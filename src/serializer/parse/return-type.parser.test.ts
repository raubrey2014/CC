import * as t from "@babel/types";
import { getGeneratorFromCode } from "../../util/test-utils";
import { parseGeneratorReturnType } from "./return-type.parser";

describe("return type parser", () => {
    it("should parse untyped return type declarations", () => {
        const code = `function* test() {}`;
        const generator = getGeneratorFromCode(code);
        const returnType = parseGeneratorReturnType(generator);
        expect(returnType).toMatchObject({ yieldType: t.tsAnyKeyword(), returnType: t.tsAnyKeyword(), nextStepParamType: t.tsAnyKeyword() });
    })
    it("should parse full typed return type declarations", () => {
        const code = `function* test(): Generator<number, number, number> {}`;
        const generator = getGeneratorFromCode(code);
        const returnType = parseGeneratorReturnType(generator);
        expect(returnType).toMatchObject({ yieldType: t.tsNumberKeyword(), returnType: t.tsNumberKeyword(), nextStepParamType: t.tsNumberKeyword() });
    })
})