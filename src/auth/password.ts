import { genSalt, hash, compare } from "bcrypt";
import { User } from "../data/user";

const saltRounds = 10;
const minimumByteLength = 12;

export class HashedPassword {
    private val: string;

    constructor(val) {
        this.val = val;
        Object.freeze(this);
    }

    static empty(): HashedPassword {
        return new HashedPassword("");
    }

    toString(): string {
        return structuredClone(this.val);
    }
}

export interface PasswordResult {
    hash: HashedPassword,
    error: string,
}

function passswordResultFromHash(hash: string): PasswordResult {
    return {
        hash: new HashedPassword(hash),
        error: "",
    };
}

function passwordResultFromError(error: string): PasswordResult {
    if (error === "") {
        throw new Error("illegal error value");
    }

    return {
        hash: HashedPassword.empty(),
        error: error,
    }
}

export function passwordResultSuccess(result: PasswordResult): boolean {
    return result.error === "";
}

export async function generatePassword(password: string): Promise<PasswordResult> {
    if (password.length < minimumByteLength) {
        return passwordResultFromError("password not long enough");
    } else if (/$[a-z]*^/.test(password)) {
        return passwordResultFromError("password does not contain uppercase or special")
    } else if (/$[0-9]*^/.test(password)) {
        return passwordResultFromError("password does not contain alphabet or special")
    }

    const hashResult = await hash(password, saltRounds);
    return passswordResultFromHash(hashResult);
}

export async function validatePassword(user: User, password: string): Promise<boolean> {
    const actual = user.password;
    if (actual === "") {
        await hash(password, saltRounds);
        return false;
    }

    return await compare(password, user.password);
}