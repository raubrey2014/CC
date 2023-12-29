import * as t from "@babel/types";
import { getGeneratorFromCode } from "../../util/test-utils";
import { parseGeneratorParametersAsProperties } from "./params.parser";

describe("params parser", () => {
    it("should parse untyped parameter declarations", () => {
        const code = `function* test(a) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsAnyKeyword()) }]);
    })
    it("should parse untyped rest parameter declarations", () => {
        const code = `function* test(...a) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsArrayType(t.tsAnyKeyword())) }]);
    })
    it("should parse single identifier parameter declarations", () => {
        const code = `function* test(a: number) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsNumberKeyword()) }]);
    })
    it("should parse union parameter declarations", () => {
        const code = `function* test(a: number | string) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsUnionType([t.tsNumberKeyword(), t.tsStringKeyword()])) }]);
    })
    it("should parse optional parameter declarations", () => {
        const code = `function* test(a?: number) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsUnionType([t.tsNumberKeyword(), t.tsUndefinedKeyword()])) }]);
    })
})