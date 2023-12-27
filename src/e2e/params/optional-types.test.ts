import { parseAndGenerateStateMachineComponents } from "../base.e2e";

const generator = `
function* optionalTest(a?: number, b?: number): Generator<number, number, number> {
    yield 42;
    yield 42;
    return 42;
}
`;

const expectedStateMachine = `class OptionalTestGenerator {
  private state: {
    nextStep: number;
    a?: number;
    b?: number;
  };
  constructor(a?: number, b?: number) {
    this.state = {
      nextStep: 0,
      a: a,
      b: b
    };
  }
  saveState(): {
    nextStep: number;
    a?: number;
    b?: number;
  } {
    return {
      ...this.state
    };
  }
  loadState(state: object): void {
    this.state = {
      ...(state as {
        nextStep: number;
        a?: number;
        b?: number;
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
          value: 42,
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

describe('e2e serializer of optional parameter types', () => {
    it('should serialize optional param types', () => {
        const { stateMachine } = parseAndGenerateStateMachineComponents(generator);
        expect(stateMachine).toBe(expectedStateMachine);
    });
});
