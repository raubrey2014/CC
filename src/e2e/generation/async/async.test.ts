import { parseAndGenerateStateMachineComponents } from "../../base.e2e";

const generator = `
async function* asyncTest() {
    await Promise.resolve();
}
`;

const expectedStateMachine = `class AsyncTestGenerator {
  private state: {
    nextStep: number;
  };
  constructor() {
    this.state = {
      nextStep: 0
    };
  }
  saveState(): {
    nextStep: number;
  } {
    return {
      ...this.state
    };
  }
  loadState(state: object): void {
    this.state = {
      ...(state as {
        nextStep: number;
      })
    };
  }
  async nextStep(value: any): Promise<IteratorResult<any, any>> {
    switch (this.state.nextStep) {
      case 0:
        await Promise.resolve();
        return {
          value: undefined,
          done: true
        };
      default:
        throw new Error("Invalid next step");
    }
  }
}`;

describe('e2e serializer async generators', () => {
    it('should serialize async generators', () => {
        const { stateMachine } = parseAndGenerateStateMachineComponents(generator);
        expect(stateMachine).toBe(expectedStateMachine);
    });
});
