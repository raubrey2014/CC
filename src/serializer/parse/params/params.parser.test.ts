import * as t from "@babel/types";
import { getGeneratorFromCode } from "../../../util/test-utils";
import { parseGeneratorParametersAsProperties } from "./params.parser";

describe("params parser", () => {
    it("should parse untyped parameter declarations", () => {
        const code = `function* test(a) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsAnyKeyword()), optional: false }]);
    })
    it("should parse untyped rest parameter declarations", () => {
        const code = `function* test(...a) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsAnyKeyword()), optional: false }]);
    })
    it("should parse single identifier parameter declarations", () => {
        const code = `function* test(a: number) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsNumberKeyword()), optional: false }]);
    })
    it("should parse union parameter declarations", () => {
        const code = `function* test(a: number | string) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsUnionType([t.tsNumberKeyword(), t.tsStringKeyword()])), optional: false }]);
    })
    it("should parse optional parameter declarations", () => {
        const code = `function* test(a?: number) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([{ name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsNumberKeyword()), optional: true }]);
    })

    it("should parse object pattern parameter declarations", () => {
        const code = `function* test({ a, b, ...e }: { a: number, b: string, c: number, d: number }) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([
            { name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsAnyKeyword()), optional: false },
            { name: "b", typeAnnotation: t.tsTypeAnnotation(t.tsAnyKeyword()), optional: false },
            { name: "e", typeAnnotation: t.tsTypeAnnotation(t.tsAnyKeyword()), optional: false },
        ]);
    })

    it("should parse array pattern parameter declarations", () => {
        const code = `function* test([a, [b], ...c]: number[][]) {}`;
        const generator = getGeneratorFromCode(code);
        const params = parseGeneratorParametersAsProperties(generator);
        expect(params).toMatchObject([
            { name: "a", typeAnnotation: t.tsTypeAnnotation(t.tsAnyKeyword()), optional: false },
            { name: "b", typeAnnotation: t.tsTypeAnnotation(t.tsAnyKeyword()), optional: false },
            { name: "c", typeAnnotation: t.tsTypeAnnotation(t.tsAnyKeyword()), optional: false }
        ]);
    })
})