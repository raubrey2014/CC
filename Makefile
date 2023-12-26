tsc:
	./node_modules/typescript/bin/tsc --lib es6,dom --outdir build src/ast/ast.ts

babel:
	./node_modules/typescript/bin/tsc --lib es6,dom --outdir build src/ast/babel-ast.ts

babel-generate:
	./node_modules/typescript/bin/tsc --lib es6,dom --outdir build src/generate/babel-generate.ts

run:
	node build/ast.js $(file)

run-babel:
	node build/babel-ast.js $(file)

run-babel-generate:
	node build/babel-generate.js


build.serializer:
	./node_modules/typescript/bin/tsc --lib es6,dom --outdir build src/serializer/serializer.ts

run.serializer:
	node build/serializer.js $(file)