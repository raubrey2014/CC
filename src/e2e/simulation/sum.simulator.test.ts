import { areGeneratorAndStateMachineEquivalent } from "./base.simulator";
import { SumGenerator, sum } from "./generated-simulators/sum";

describe("simulate sum", () => {
    it("should simulate the same behavior as a serialized state machine", () => {
        const areEquivalent = areGeneratorAndStateMachineEquivalent(sum, SumGenerator, 1, 2);
        expect(areEquivalent).toBe(true);
    })
});