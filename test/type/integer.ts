import {describe, it} from "mocha";
import {equal, fail, notDeepStrictEqual, notEqual} from "assert";
import {Integer} from "../../src/type/integer";

describe("integers", () => {
    it("should not be directly modifiable", () => {
        const shouldBe = 0;
        const otherNumber = 5;
        let myInt = new Integer(shouldBe);
        try {
            myInt["val"] = otherNumber;
        } catch (err) {
            console.log(`got err: ${err}`);
            return;
        }

        equal(myInt.toNumber(), shouldBe);
        notEqual(myInt.toNumber(), otherNumber);
    });

    it("adding should be sum of self and literal", () => {
        const myInt = new Integer(10);
        const num = 10;
        const sum = myInt.add(num);
        notDeepStrictEqual(myInt, num);
        notEqual(typeof(myInt), typeof(num));
        equal(myInt, myInt);
        notEqual(myInt, sum);
        equal(myInt.toNumber() + num, sum.toNumber());
    });
});