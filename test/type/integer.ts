import {describe, it} from "mocha";
import {equal, fail, notDeepStrictEqual, notEqual} from "assert";
import {Integer} from "../../src/type/integer";

describe("integers", () => {
    it("should not be directly editable", () => {
        let myInt = new Integer(0);
        try {
            myInt["val"] = 5;
            fail("could modify value");
        } catch (err) {
            // console.log(`got err: ${err}`);
        }
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