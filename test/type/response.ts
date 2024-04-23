import {describe, it} from "mocha";
import assert, {deepStrictEqual, fail, notDeepStrictEqual, notEqual} from "assert";
import {endpointImplToIO} from "../../src/type/response";
import {mockRequest} from 'mock-req-res'
import { statusOk } from "../../src/type/status";

describe("responses", () => {
    it("should error for sending multiple responses", async () => {
        const io = await endpointImplToIO("test", mockRequest(), async (req, res) => {
            res = res.handle({ val: "hello" });
            return res.handle({ val: "hello" });
        });

        notDeepStrictEqual(io.errors, []);
    });
    it("should be allowed to send a redirect", async () => {
        const io = await endpointImplToIO("test", mockRequest(), async (req, res) => {
            return res.redirect(new URL("http://example.com"));
        });

        deepStrictEqual(io.errors, []);
        deepStrictEqual(io.warnings, []);
    });
    it("should error when trying to send an error and a response", async () => {
        const io = await endpointImplToIO("test", mockRequest(), async (req, res) => {
            res = res.publicError("bad request");
            return res.handle({ val: "hello" });
        });

        notDeepStrictEqual(io.errors, []);
    });
    it("render blocks responses and uses that reference for next", async () => {
        const shortPath = "/login";
        const io = await endpointImplToIO("test", mockRequest(), async (req, res) => {
            return res.render(shortPath);
        });

        assert(io.useNext);
        deepStrictEqual(io.nextParams[0], shortPath);
    });
    it("response builders should not be equal when there are modifications", async () => {
        await endpointImplToIO("test", mockRequest(), async (req, res) => {
            const notRes = res.status(statusOk());
            notEqual(res, notRes);
            notDeepStrictEqual(res, notRes);
            return notRes;
        });
    });
    it("response builders should not be directly modifiable", async () => {
        let io;
        try {
            io = await endpointImplToIO("test", mockRequest(), async (req, res) => {
                res["hasResponse"] = true;
                assert(!res["hasResponse"]);
                return res;
            });
        } catch (err) {
            console.log(`error received ${err}`);
        }

        assert(io?.useNext);
    });
});