import { parseAndGenerateStateMachineComponents } from "../base.e2e";

const generator = `
function* untypedTest(a, ...b): Generator<number, number, number> {
    yield 42;
    yield "hello world";
    return "my work here is done";
}
`;

const expectedStateMachine = `class UntypedTestGenerator {
  private state: {
    nextStep: number;
    a: any;
    b: any[];
  };
  constructor(a, ...b) {
    this.state = {
      nextStep: 0,
      a: a,
      b: b
    };
  }
  saveState(): {
    nextStep: number;
    a: any;
    b: any[];
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
        b: any[];
      })
    };
  }
  nextStep(value: number): IteratorResult<number, number> {
    switch (this.state.nextStep) {
      case 0:
        this.state.nextStep = 1;
        return {
          value: 42,
          done: false
        };
      case 1:
        value;
        this.state.nextStep = 2;
        return {
          value: "hello world",
          done: false
        };
      case 2:
        value;
        return {
          value: "my work here is done",
          done: true
        };
      default:
        throw new Error("Invalid next step");
    }
  }
}`;

describe('e2e serializer of untyped parameter types', () => {
  it('should serialize untyped parameter types', () => {
    const { stateMachine } = parseAndGenerateStateMachineComponents(generator);
    expect(stateMachine).toBe(expectedStateMachine);
  });
});
