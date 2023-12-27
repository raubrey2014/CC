/**
 * Parse an input file into an AST. Useful for debugging alongside https://ts-ast-viewer.com/
 */
import * as babelParser from '@babel/parser';
import * as fs from 'fs';

const sourceFile = babelParser.parse(
    fs.readFileSync(process.argv[2], 'utf8'),
    {
        sourceType: "module",
        plugins: [
            "typescript"
        ],
    }
)

console.log(JSON.stringify(sourceFile, null, 4))

