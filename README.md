### Generator to State Machine Compiler

Given a Typescript generator function like:

```
function* foo(a: number, b: number): Generator<number, number, number> {
  let sum = 0;
  sum += yield a;
  sum += yield b;
  return sum;
}
```

Generate a state machine that looks like:

```
class FooGenerator extends SerializableGenerator<number, number, number> {
    
    // State of the generator 
    private state: { sum: number, nextStep: number, a: number, b: number };

    constructor(a: number, b: number) {
        super();
        this.state = { sum: 0, nextStep: 0, a: a, b: b };
    }

    next(value?: number): IteratorResult<number, number> {
        switch (this.state.nextStep) {
            case 0:
                this.state.nextStep = 1;
                return { value: this.state.a, done: false };
            case 1:
                this.state.sum += value ?? 0;
                this.state.nextStep = 2;
                return { value: this.state.b, done: false };
            case 2:
                this.state.sum += value ?? 0;
                return { value: this.state.sum, done: true };
            default:
                return { value: 0, done: true };
        }
    }

    saveState(): object {
        return { ...this.state };
    }

    loadState(state: object): void {
        this.state = { ...state as { sum: number, nextStep: number, a: number, b: number } };
    }
}
```

### How does it work?

To accomplish both the **Parse** and **Generate** steps, we use the [Babel](https://babeljs.io/) toolchain.

**Parse**
- Parse the input program, build a useful intermediate representation
- Using our intermediate representation, identify...
    - The parameters to the Generator function
    - Each component of the Generator function's return type
    - Identify the local variables in the generator function
    - Identify the yield statements in the generator function and use them to break out the steps of the state machine

**Generate**
- Create a Generator class
    - Create a state variable containing a `nextStep` parameter, local variables, and parameters
    - Create a constructor that takes the parameters as arguments and initializes the state variable
    - Create loadState and saveState methods
    - Create nextStep method
        - Single parameter of `value` 
        - Return type of IteratorResult is driven by return type of Generator function
        - Construct a switch statement from the previously identified yield "steps" of the Generator function
            - The return argument of the yield statement is the return value of the case statement
            - `value` parameter replaces yield expressions
            - Local variables are updated to reference the state variable


### Improvements
- [ ] Improve code
    - [ ] Improve the logical separation between parsing and generation
    - [ ] Get rid of replacer logic, use babel's built in traversal and replaceWith
    - [ ] Consider use of @babel/template for code generation
    - [ ] Improve babel typing throughout and consolidate to all `t.*` calls rather than raw node construction
- [ ] Improved generator types
    - [ ] Support for async generators
- [ ] Improved parameter parsing
    - [ ] Support for object destructuring
    - [ ] Support for array destructuring
- [ ] Improved state type
    - [ ] Consider collecting state type object into an interface (i.e. `interface FooGeneratorState { ... }`) and referencing that throughout the generated class
- [ ] Improved local variable parsing
    - [ ] Support for object destructuring
    - [ ] Support for array destructuring
- [ ] Improved state machine generation
    - [ ] Support `if/else` with terminal return statements
- [ ] Improved yield parsing
    - [ ] Support for `yield*`
    - [ ] Support for `yield` in `try/catch/finally`
    - [ ] Support for `yield` in `switch`
    - [ ] Support for `yield` in `if/else`
    - [ ] Support for `yield` in `for/while/do`
    - [ ] Support for `yield` in `return`

