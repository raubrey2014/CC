import { parseAndGenerateStateMachineComponents } from "../../base.e2e";

const generator = `
interface Example {
    a: number;
}
function* objectPatternTest({ a }: Example): Generator<number, number, number> {
    yield a;
    return 42;
}
`;

const expectedStateMachine = `class ObjectPatternTestGenerator {
  private state: {
    nextStep: number;
    a: any;
  };
  constructor({
    a
  }: Example) {
    this.state = {
      nextStep: 0,
      a: a
    };
  }
  saveState(): {
    nextStep: number;
    a: any;
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

describe('e2e serializer of object pattern parameter types', () => {
  it('should serialize object pattern parameter param types', () => {
    const { stateMachine } = parseAndGenerateStateMachineComponents(generator);
    expect(stateMachine).toBe(expectedStateMachine);
  });
});
