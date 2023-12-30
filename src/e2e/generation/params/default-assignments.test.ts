import { parseAndGenerateStateMachineComponents } from "../base.e2e";

const generator = `
function* defaultAssignmentTest(a: number, b: number = 42): Generator<number, number, number> {
    yield a;
    yield b;
    return 42;
}
`;

const expectedStateMachine = `class DefaultAssignmentTestGenerator {
  private state: {
    nextStep: number;
    a: number;
    b: number;
  };
  constructor(a: number, b: number = 42) {
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
        this.state.nextStep = 2;
        return {
          value: this.state.b,
          done: false
        };
      case 2:
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

describe('e2e serializer of complex parameter types', () => {
    it('should serialize union param types', () => {
        const { stateMachine } = parseAndGenerateStateMachineComponents(generator);
        expect(stateMachine).toBe(expectedStateMachine);
    });
});
