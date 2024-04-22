import { PrismaClient } from 'prisma';
import { Uuid } from '../type/uuid';
import { Integer } from '../type/integer';

export interface User {
    uuid: Uuid,
    cents: Integer,
    username: string,
    password: string,
}

export interface UserPayload {
    uuid: Uuid,
    cents: Integer,
}

export async function getUserFromUsername(username: string): Promise<User> {
    return {
        uuid: Uuid.createUuid(),
        cents: new Integer(0),
        username: "",
        password: "",
    };
}

export function getEmptyUser(): User {
    return {
        uuid: Uuid.createUuid(),
        cents: new Integer(0),
        username: "",
        password: "",
    };
}