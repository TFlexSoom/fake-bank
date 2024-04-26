import assert, {equal} from "assert"
import {describe, it} from "mocha";
import { randomBytes } from "crypto";
import { generateToken, validateToken } from "../../src/csrf/token";

describe("csrf tokens", function(){
    it('generate token using random bytes', async function(){
        await generateToken(randomBytes(64).toString("base64"));
    });
    it('generated token should validate', async function(){
        const csrfRandomStr = randomBytes(64).toString("base64");
        const token = await generateToken(csrfRandomStr);
        assert(await validateToken(token, csrfRandomStr));
    });
    it('invalid token should not validate', async function(){
        const csrfRandomStr = randomBytes(64).toString("base64");
        assert(!(await validateToken(csrfRandomStr, csrfRandomStr)));
    });
    it('invalid random should not validate', async function(){
        const csrfRandomStr = randomBytes(64).toString("base64");
        const otherRandom = (
            (csrfRandomStr[0] !== 'a' ? 'a' : 'b') + csrfRandomStr.substring(1)
        );
        const token = await generateToken(csrfRandomStr);
        assert(!(await validateToken(token, otherRandom)));
    });
});