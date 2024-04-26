import { createHash, createHmac } from "node:crypto";

const saltCodeAlg = "sha512";
const hmacAlg = "sha512";
const salt = Buffer.from("a-very-good-salt", "utf-8");

let _aCode: Buffer = undefined;
async function getACode(): Promise<Buffer> {
    if (_aCode !== undefined) {
        return _aCode
    }

    const secretBase64 = process.env.CSRF_SECRET;
    if (secretBase64 === undefined) {
        throw new Error("CSRF_SECRET env variable not defined");
    }

    const secret = Buffer.from(secretBase64, 'base64');
    if (secret.length < 64) {
        throw new Error("CSRF_SECRET env variable needs to have more bytes");
    }

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