build.parse.file:
	./node_modules/typescript/bin/tsc --lib es6,dom --outdir build src/util/parse-file.ts

run.parse.file:
	node build/parse-file.js $(file)

build.serializer:
	./node_modules/typescript/bin/tsc --lib es6,dom --outdir build src/serializer/serializer.ts

run.serializer:
	node build/serializer.js $(file)

test:
	./node_modules/.bin/jest