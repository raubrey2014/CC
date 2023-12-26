import * as ts from 'typescript';
import * as fs from 'fs';

const walkNode = (sourceFile: ts.SourceFile, node: ts.Node, depth: number) => {
    console.log(`${'-'.repeat(depth)}${ts.SyntaxKind[node.kind]}: ${node.getText(sourceFile)}`);
    node.forEachChild(child => walkNode(sourceFile, child, depth + 1));
}

const sourceFile = ts.createSourceFile(
    'foo.ts',
    fs.readFileSync(process.argv[2], 'utf8'),
    ts.ScriptTarget.Latest
)

walkNode(sourceFile, sourceFile, 0);

