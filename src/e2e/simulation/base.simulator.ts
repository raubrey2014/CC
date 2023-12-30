interface SerializableStateMachine<YieldType, ReturnType> {
    nextStep: (value: any) => IteratorResult<YieldType, ReturnType>;
}
interface ISerializableStateMachine<YieldType, ReturnType> {
    new(...args: any[]): SerializableStateMachine<YieldType, ReturnType>;
}

/**
 * Assumes a NextStepParamType of number to simplify random parameter generation
 */
export function areGeneratorAndStateMachineEquivalent<Args extends any[], YieldType, ReturnType>(
    genFunc1: (...args: Args) => Generator<YieldType, ReturnType, number>,
    StateMachine: ISerializableStateMachine<YieldType, ReturnType>,
    ...args: Args
): boolean {
    const gen1 = genFunc1(...args);
    const gen2 = new StateMachine(...args);

    // Safety measure, limit the iterations to 1000
    let runs = 0;
    while (runs < 1000) {
        runs++;
        const randomValue = Math.random(); // Generate a random number

        let result1: IteratorResult<YieldType, ReturnType>, result2: IteratorResult<YieldType, ReturnType>;

        try {
            result1 = gen1.next(randomValue);
        } catch (e1) {
            try {
                result2 = gen2.nextStep(randomValue);
                return false; // gen1 threw an exception but gen2 did not
            } catch (e2) {
                // Check if both generators threw the same type of exception
                if (e1.constructor === e2.constructor) {
                    continue; // Equivalent at this point, continue to next iteration
                } else {
                    return false; // Different types of exceptions
                }
            }
        }

        try {
            result2 = gen2.nextStep(randomValue);
        } catch (e2) {
            return false; // gen2 threw an exception but gen1 did not
        }

        // Check if both generators are done
        if (result1.done && result2.done) {
            return result1.value === result2.value;
        }

        // Check if one generator finishes before the other
        if (result1.done !== result2.done) {
            return false;
        }

        // Check if the values yielded by the generators differ
        if (result1.value !== result2.value) {
            return false;
        }
    }

    // Our max iterations was exceeded
    return false;
}