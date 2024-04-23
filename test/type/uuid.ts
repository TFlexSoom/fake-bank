import {describe, it} from "mocha";
import {deepStrictEqual, fail} from "assert";
import {Uuid} from "../../src/type/uuid";

describe("uuids", () => {
    it("should not be editable", () => {
        let uuid = Uuid.createUuid();
        try {
            uuid["val"] = "hello there";
            fail("could modify value");
        } catch (err) {
            // console.log(`got err: ${err}`);
        }
    });

    it("should validate itself from toString", () => {
        let uuid = Uuid.createUuid();
        let other = Uuid.fromString(uuid.toString());
        deepStrictEqual(uuid, other);
    });
});