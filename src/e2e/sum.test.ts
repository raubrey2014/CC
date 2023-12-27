import { parse } from "@babel/parser";
import { parseGenerators } from "../serializer/generator-parser";
import { generateSerializableStateMachine } from "../serializer/generate-state-machine";

const sum = `
function* sum(a: number, b: number): Generator<number, number, number> {
    let sum: number = 0;
    sum += yield a;
    sum += yield b;
    return sum;
}
`;

const sumStateMachine = `class SumGenerator {
  private state: {
    nextStep: number;
    sum: number;
    a: number;
    b: number;
  };
  constructor(a: number, b: number) {
    this.state = {
      nextStep: 0,
      a: a,
      b: b,
      sum: 0
    };
  }
  saveState(): {
    nextStep: number;
    sum: number;
    a: number;
    b: number;
  } {
    return {
      ...this.state
    };
  }
  loadState(state: object): void {
    this.state = {
      ...(state as {
        nextStep: number;
        sum: number;
        a: number;
        b: number;
      })
    };
  }
  nextStep(value: number): IteratorResult<number, number> {
    switch (this.state.nextStep) {
      case 0:
        this.state.sum = 0;
        this.state.nextStep = 1;
        return {
          value: this.state.a,
          done: false
        };
      case 1:
        this.state.sum += value;
        this.state.nextStep = 2;
        return {
          value: this.state.b,
          done: false
        };
      case 2:
        this.state.sum += value;
        return {
          value: this.state.sum,
          done: true
        };
      default:
        throw new Error("Invalid next step");
    }
  }
}`;

describe('e2e serializer', () => {
  it('should serialize sum.ts', () => {
    const ast = parse(sum, { sourceType: "module", plugins: ["typescript"] });

    const generatorComponents = parseGenerators(ast);

    expect(generatorComponents.length).toBe(1);

    const stateMachine = generateSerializableStateMachine(generatorComponents[0]);

    expect(stateMachine).toBe(sumStateMachine);
  });
});
