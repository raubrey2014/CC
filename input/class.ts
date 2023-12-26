class ExampleClass {

    private state: { nextStep: number, a: number };

    saveState(): { a: number } {
        return { ...this.state };
    }

    loadState(state: object): void {
        this.state = { ...state as { nextStep: number, a: number } };
    }

    nextStep(value?: number): IteratorResult<number, number> {
        switch (this.state.nextStep) {
            case 0:
                this.state.nextStep = 1;
                return { value: 123, done: false };
            case 1:
                return { value: 42, done: true };
            default:
                return { value: 0, done: true };
        }
    }
}