import {describe, it} from "mocha";
import assert from "assert";
import {Method} from "../../src/type/apiEndpoint";

describe("methods", () => {
    it("should always be lowercase in name", () => {
        for(const name of Object.keys(Method)) {
            assert(/[a-z]*/.test(Method[name]));
        }
    });
});