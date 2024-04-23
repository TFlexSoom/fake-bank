import { v4 as uuid, validate as uuidValidate, version as uuidVersion } from 'uuid';

const version = 4;

export class Uuid {
    private val: string;

    private constructor(paramVal: string) {
        this.val = paramVal;
        Object.freeze(this);
    }

    static createUuid(): Uuid {
        return new Uuid(uuid());
    }

    static fromString(from: string): Uuid {
        if (!uuidValidate(from)) {
            throw new Error("not a valid uuid");
        } else if (uuidVersion(from) !== version) {
            throw new Error("not a valid uuid version");
        }

        return new Uuid(from);
    }

    toString(): string {
        return this.val;
    }
}