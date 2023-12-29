/**
 * @fileoverview Serialize the generator functions within the file argument to be serializabled
 * state machines classes.
 */
import { parse } from "@babel/parser";
import * as fs from 'fs';
import { parseGenerators } from "./parse/parser";
import { generateSerializableStateMachine } from "./generate/generator";

// Parse the file argument as an AST
const ast = parse(
    fs.readFileSync(process.argv[2], 'utf8'),
    {
        sourceType: "module",
        plugins: [
            "typescript"
        ],
    });

const generatorComponents = parseGenerators(ast);

// Generate the state machine classes
generatorComponents.map(generatorComponent => {
    const codeString = generateSerializableStateMachine(generatorComponent);
    console.log("\n\nGenerated state machine class for generator \"" + generatorComponent.name + "\":\n\n" + codeString);

    fs.writeFileSync("output/" + generatorComponent.name + ".ts", codeString);

    return codeString;
});
