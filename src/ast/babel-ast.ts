import * as babelParser from '@babel/parser';
import * as fs from 'fs';

const sourceFile = babelParser.parse(
    fs.readFileSync(process.argv[2], 'utf8'),
    {
        // parse in strict mode and allow module declarations
        sourceType: "module",
        plugins: [
            "typescript"
        ],
    }
)

console.log(JSON.stringify(sourceFile, null, 4))

