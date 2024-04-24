import { SignJWT, jwtVerify, importJWK, KeyLike } from "jose";
import { Uuid } from "../type/uuid";

const alg = "HS256";
const iss = "fakebank";

type Secret = Uint8Array | KeyLike | undefined;

let _secret: Secret = undefined;
async function getSecret(): Promise<Secret> {
    if (_secret !== undefined) {
        return _secret
    }

    const jwk = JSON.parse(Buffer.from(process.env.AUTH_SECRET, 'base64').toString());
    _secret = await importJWK(jwk, alg);
    return _secret;
}

export async function generateToken(uuid: Uuid): Promise<string> {
    return await new SignJWT({
        uuidStr: uuid.toString()
    })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setIssuer(iss)
        .setExpirationTime('1h')
        .sign(await getSecret())
        ;
}

export async function validateToken(authString: string): Promise<Uuid | undefined> {
    const result = await jwtVerify(authString, await getSecret(), {
        issuer: iss,
    });


    const { uuidStr } = result.payload as { uuidStr: string };
    const uuid = Uuid.fromString(uuidStr);
    return uuid;
}