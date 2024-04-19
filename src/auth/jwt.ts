import { SignJWT, jwtVerify, importJWK, KeyLike } from "jose";
import { Uuid, uuidFromString } from "../type/uuid";

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
        uuidStr: uuid as string
    })
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setIssuer(iss)
        .setExpirationTime('1h')
        .sign(await getSecret())
        ;
}

export async function validateToken(authString: string): Promise<Uuid | null> {
    const pieces = authString.split(' ', 2);
    if (pieces.length != 2) {
        return null;
    }

    if (pieces[0] !== 'Bearer') {
        return null;
    }

    const token = pieces[1];
    const result = await jwtVerify(token, await getSecret(), {
        issuer: iss,
    });


    const { uuidStr } = result.payload as { uuidStr: string };
    const uuid = uuidFromString(uuidStr);
    return uuid;
}