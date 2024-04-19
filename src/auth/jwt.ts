import { jwtVerify } from "jose";

async function validateToken(authString: string): Promise<boolean> {
    const pieces = authString.split(' ', 2);
    if(pieces.length != 2) {
        return false;
    }

    if(pieces[0] !== 'Bearer') {
        return false;
    }

    const token = pieces[1];
    const result = await jwtVerify(token, )

    return false;
}