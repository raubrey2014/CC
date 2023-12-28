import { ParseResult, parse } from "@babel/parser";
import { generateSerializableStateMachine } from "../serializer/generator";
import { parseGenerators } from "../serializer/parser";
import { File } from "@babel/types";
import { GeneratorComponents } from "../serializer/types";

export function parseAndGenerateStateMachineComponents(code: string): { ast: ParseResult<File>, generatorComponents: GeneratorComponents, stateMachine: string } {
    const ast = parse(code, { sourceType: "module", plugins: ["typescript"] });
    const generatorComponents = parseGenerators(ast);

    expect(generatorComponents.length).toBe(1);

    const generator = parseGenerators(ast)[0];
    const stateMachine = generateSerializableStateMachine(generator);

    return { ast, generatorComponents: generator, stateMachine };
}