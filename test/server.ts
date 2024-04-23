import { describe, it } from "mocha"
import { fail } from "assert"
import { create } from "../src/server";

describe("Server", () => {
    it("should not be modifiable", () => {
        let server = create([]);
        try {
            server.run = () => {};
            fail("was able to modify server");
        } catch(err) {
            // console.log(`error received: ${err}`);
        }
    });
    it("should not run on too high of a port", () => {
        try {
            let server = create(["70000"]);
            fail("was able to make server with bad port");
        } catch (err) {
            // console.log(`error received: ${err}`);
        }
    });

    it("should not run on a string name port", () => {
        let oldProcess = process;
        try {
            let server = create(["not a port"]);
            fail("was able to make server with bad port");
        } catch (err) {
            // console.log(`error received: ${err}`);
        }
    });

    // Could add a timeout check to make sure it's running on
    // the proper port
});