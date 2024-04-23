import { PrismaClient } from '@prisma/client';
import { Uuid } from '../type/uuid';
import { HashedPassword } from '../auth/password';

const client = new PrismaClient();

export interface User {
    uuid: Uuid,
    username: string,
    password: string,
}

export interface UserPayload {
    uuid: Uuid,
}

export async function createUser(username: string, hashed: HashedPassword): Promise<User | undefined> {
    try {
        const dbUser = await client.user.create({
            data: {
                uuid: Uuid.createUuid().toString(),
                username: username,
                password: hashed.toString(),
            }
        });

        // No need to clone as we are returning the paramters here
        return {
            uuid: Uuid.fromString(dbUser.uuid), // Uuid shoudl clone by default
            username: username,
            password: hashed.toString(),
        }
    } catch (err) {
        console.error("DB Error: ", err);
    }

    return undefined;
}

export async function getUserFromUsername(username: string): Promise<User> {
    try {
        const user = await client.user.findUnique({
            where: {
                username: username,
            },
        });

        if (user === null) {
            return getEmptyUser();
        }

        return {
            uuid: Uuid.fromString(user.uuid),
            username: structuredClone(user.username),
            password: structuredClone(user.password),
        }

    } catch (err) {
        console.log("DB Error: ", err);
    }

    return getEmptyUser();

}

export function getEmptyUser(): User {
    return {
        uuid: Uuid.createUuid(),
        username: "",
        password: "",
    };
}