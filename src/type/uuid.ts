import { v5 as uuid, validate as uuidValidate, version as uuidVersion } from 'uuid';

const namespace = "83249340-d2cb-47be-b0e9-19079c640573";

export type Uuid = string;

export function createUuid(): Uuid {
    return uuid("https://fake-bank.com", namespace) as Uuid;
}

export function uuidFromString(from: string): Uuid {
    if (!uuidValidate(from)) {
        throw new Error("not a valid uuid");
    } else if (uuidVersion(from) !== 5) {
        throw new Error("not a valid uuid version");
    }

    return from as Uuid;
}