import { parseAndGenerateStateMachineComponents } from "../base.e2e";

const generator = `
function* untypedTest(a: number, b: number) {
    yield 42;
    yield "hello world";
    return "my work here is done";
}
`;

const expectedStateMachine = `class UntypedTestGenerator {
  private state: {
    nextStep: number;
    a: number;
    b: number;
  };
  constructor(a: number, b: number) {
    this.state = {
      nextStep: 0,
      a: a,
      b: b
    };
  }
  saveState(): {
    nextStep: number;
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
        a: number;
        b: number;
      })
    };
  }
  nextStep(value: any): IteratorResult<any, any> {
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

describe('e2e serializer of untyped return types', () => {
  it('should serialize untyped return types', () => {
    const { stateMachine } = parseAndGenerateStateMachineComponents(generator);
    expect(stateMachine).toBe(expectedStateMachine);
  });
});
