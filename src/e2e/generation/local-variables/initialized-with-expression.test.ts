import { parseAndGenerateStateMachineComponents } from "../../base.e2e";

const generator = `
function* sum(a: number, b: number): Generator<number, number, number> {
    let c: number = a + b;
    let sum: number = c;
    sum += yield a;
    sum += yield b;
    return sum;
}
`;

const expectedStateMachine = `class SumGenerator {
  private state: {
    nextStep: number;
    c: number;
    sum: number;
    a: number;
    b: number;
  };
  constructor(a: number, b: number) {
    this.state = {
      nextStep: 0,
      a: a,
      b: b,
      c: 0,
      sum: 0
    };
  }
  saveState(): {
    nextStep: number;
    c: number;
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
        c: number;
        sum: number;
        a: number;
        b: number;
      })
    };
  }
  nextStep(value: number): IteratorResult<number, number> {
    switch (this.state.nextStep) {
      case 0:
        this.state.c = this.state.a + this.state.b;
        this.state.sum = this.state.c;
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
  it('should serialize sum', () => {
    const { stateMachine } = parseAndGenerateStateMachineComponents(generator);
    expect(stateMachine).toBe(expectedStateMachine);
  });
});
