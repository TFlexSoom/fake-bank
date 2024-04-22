import { v5 as uuid, validate as uuidValidate, version as uuidVersion } from 'uuid';

const namespace = "83249340-d2cb-47be-b0e9-19079c640573";

export class Uuid {
    private val: string;

    private constructor(paramVal: string) {
        this.val = paramVal;
    }

    static createUuid(): Uuid {
        return new Uuid(uuid("https://fake-bank.com", namespace));
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