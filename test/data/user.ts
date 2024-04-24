import { describe, it } from "mocha";
import assert from "assert";
import { getEmptyUser, isEmptyUser } from "../../src/data/user";

describe("users", () => {
    it("should be identifiable as empty", async () => {
        assert(isEmptyUser(getEmptyUser()));
    });
});