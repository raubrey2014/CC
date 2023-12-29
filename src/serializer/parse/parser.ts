import * as t from "@babel/types";
import { GeneratorComponents } from "../types";
import { parseLocalVariableDeclarations, parseLocalVariableAsProperties } from "./local-variables/local-variables.parser";
import { parseGeneratorParametersAsProperties } from "./params/params.parser";
import { parseGeneratorReturnType } from "./return-type/return-type.parser";
import { parseStateMachineSteps } from "./steps/steps.parser";

const isGenerator = (node: t.Node): boolean => {
    return t.isFunctionDeclaration(node) && node.generator;
}

export function parseGenerator(generator: t.FunctionDeclaration): GeneratorComponents {
    const { yieldType, returnType, nextStepParamType } = parseGeneratorReturnType(generator);
    return {
        name: generator.id!.name,
        parameters: generator.params,
        parametersAsProperties: parseGeneratorParametersAsProperties(generator),
        yieldType,
        returnType,
        nextStepParamType,
        localVariables: parseLocalVariableDeclarations(generator),
        localVariablesAsProperties: parseLocalVariableAsProperties(generator),
        steps: parseStateMachineSteps(generator)
    };
}

export function parseGenerators(ast: t.File): GeneratorComponents[] {
    const generators = ast.program.body.filter(isGenerator).map((node) => node as t.FunctionDeclaration);
    return generators.map(parseGenerator);
}