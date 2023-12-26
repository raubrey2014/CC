/**
 * @fileoverview Serialize the generator functions within the file argument to be serializabled
 * state machines classes.
 * 
 * https://www.notion.so/Typescript-Coroutine-to-Statemachine-Compiler-11f327d2824f477e8467ced8e77f5c81
 */
import { parse } from "@babel/parser";
import * as t from "@babel/types";
import * as fs from 'fs';
import { parseGenerator } from "./generator-parser";
import { generateSerializableStateMachine } from "./generate-state-machine";

// Parse the file argument as an AST
console.log('Reading file: ' + process.argv[2]);
const ast = parse(
    fs.readFileSync(process.argv[2], 'utf8'),
    {
        sourceType: "module",
        plugins: [
            "typescript"
        ],
    });
// console.log(JSON.stringify(ast, null, 4));

// Micro-pass #0: Find the generators within the file
const generators = ast.program.body.filter((node) => t.isFunctionDeclaration(node) && (node as t.FunctionDeclaration).generator).map((node) => node as t.FunctionDeclaration);
console.log("Micro-pass #0: Found " + generators.length + " generators");

// Micro-pass #1-4: Identify the parameters, return type components, local variables, and steps of the soon to be state machine of each generator
const generatorComponents = generators.map((generator) => parseGenerator(generator));
console.log("Micro-pass #1-4: Parsed " + generatorComponents.length + " generators");

// Micro-pass #5: Generate the state machine classes
generatorComponents.forEach((generatorComponent) => {
    const codeString = generateSerializableStateMachine(generatorComponent);
    console.log("\n\nMicro-pass #5: Generated state machine class for generator \"" + generatorComponent.name + "\":\n\n" + codeString);
});