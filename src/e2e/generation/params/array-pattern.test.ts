import { parseAndGenerateStateMachineComponents } from "../../base.e2e";

const generator = `
function* arrayPatternTest([a, b, c]: number[]): Generator<number, number, number> {
    yield a;
    return 42;
}
`;

const expectedStateMachine = `class ArrayPatternTestGenerator {
  private state: {
    nextStep: number;
    a: any;
    b: any;
    c: any;
  };
  constructor([a, b, c]: number[]) {
    this.state = {
      nextStep: 0,
      a: a,
      b: b,
      c: c
    };
  }
  saveState(): {
    nextStep: number;
    a: any;
    b: any;
    c: any;
  } {
    return {
      ...this.state
    };
  }
  loadState(state: object): void {
    this.state = {
      ...(state as {
        nextStep: number;
        a: any;
        b: any;
        c: any;
      })
    };
  }
  nextStep(value: number): IteratorResult<number, number> {
    switch (this.state.nextStep) {
      case 0:
        this.state.nextStep = 1;
        return {
          value: this.state.a,
          done: false
        };
      case 1:
        value;
        return {
          value: 42,
          done: true
        };
      default:
        throw new Error("Invalid next step");
    }
  }
}`;

describe('e2e serializer of array pattern parameter types', () => {
  it('should serialize arrat pattern parameter param types', () => {
    const { stateMachine } = parseAndGenerateStateMachineComponents(generator);
    expect(stateMachine).toBe(expectedStateMachine);
  });
});
