import { parseAndGenerateStateMachineComponents } from "../base.e2e";

const generator = `
interface SomeInterface {
    x: string;
}
function* interfaceTypesTest(a: number, b: number): Generator<SomeInterface, SomeInterface, SomeInterface> {
    yield { x: "42" };
    yield { x: "hello world" };
    return { x: "my work here is done" };
}
`;

const expectedStateMachine = `class InterfaceTypesTestGenerator {
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
  nextStep(value: SomeInterface): IteratorResult<SomeInterface, SomeInterface> {
    switch (this.state.nextStep) {
      case 0:
        this.state.nextStep = 1;
        return {
          value: {
            x: "42"
          },
          done: false
        };
      case 1:
        value;
        this.state.nextStep = 2;
        return {
          value: {
            x: "hello world"
          },
          done: false
        };
      case 2:
        value;
        return {
          value: {
            x: "my work here is done"
          },
          done: true
        };
      default:
        throw new Error("Invalid next step");
    }
  }
}`;

describe('e2e serializer of interface return types', () => {
    it('should serialize interface return types', () => {
        const { stateMachine } = parseAndGenerateStateMachineComponents(generator);
        expect(stateMachine).toBe(expectedStateMachine);
    });
});
