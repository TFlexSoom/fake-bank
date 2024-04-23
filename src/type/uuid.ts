import { v5 as uuid, validate as uuidValidate, version as uuidVersion } from 'uuid';

const namespace = process.env.UUID_NAMESPACE || "83249340-d2cb-47be-b0e9-19079c640573";
const dns = process.env.DNS || "https://fake-bank.com"


export class Uuid {
    private val: string;

    private constructor(paramVal: string) {
        this.val = paramVal;
        Object.freeze(this);
    }

    static createUuid(): Uuid {
        return new Uuid(uuid(dns, namespace));
    }

    static fromString(from: string): Uuid {
        if (!uuidValidate(from)) {
            throw new Error("not a valid uuid");
        } else if (uuidVersion(from) !== 5) {
            throw new Error("not a valid uuid version");
        }

        return new Uuid(from);
    }

    toString(): string {
        return this.val;
    }
}