function* sum(a: number, b: number, c: number): Generator<number, number, number> {
    let sum: number = 0;
    let anotherSum: string = "hello";
    yield 42;
    sum += yield a;
    sum += yield b;
    return sum;
}

const s = sum(2, 4, 5);
s.next();
s.next();
s.next();
