function* sum(a: number | string = "asdf", b: number): Generator<number | string, number, number> {
    let sum: number = 0;
    yield a;
    sum += yield b;
    return sum;
}