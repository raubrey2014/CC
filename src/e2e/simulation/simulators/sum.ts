function* sum(a: number, b: number): Generator<number, number, number> {
    let sum: number = 0;
    sum += yield a;
    sum += yield b;
    return sum;
}