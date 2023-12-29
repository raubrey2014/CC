import * as t from "@babel/types";
import { parse } from "@babel/parser";

export const getGeneratorFromCode = (code: string): t.FunctionDeclaration =>
    parse(code, { sourceType: "module", plugins: ["typescript"] }).program.body[0] as t.FunctionDeclaration;
