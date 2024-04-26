import { createHash, createHmac } from "node:crypto";

const saltCodeAlg = "sha512";
const hmacAlg = "sha512";
const salt = Buffer.from("a-very-good-salt", "utf-8");

let _aCode: Buffer = undefined;
async function getACode(): Promise<Buffer> {
    if (_aCode !== undefined) {
        return _aCode
    }

    const secret = Buffer.from(process.env.CSRF_SECRET, 'base64');
    const hash = createHash(saltCodeAlg);
    hash.update(secret);
    hash.update(salt);
    _aCode = hash.digest();
    
    return _aCode;
}

export async function generateToken(csrfRandom: string): Promise<string> {
    const hmac = createHmac(hmacAlg, await getACode());
    hmac.update(csrfRandom, "base64");
    return hmac.digest("base64");
}

export async function validateToken(token: string, csrfRandom: string): Promise<boolean> {
    return token === (await generateToken(csrfRandom));
}