import { PrismaClient } from '@prisma/client';
import { Uuid } from '../type/uuid';

const client = new PrismaClient();

export interface User {
    uuid: Uuid,
    username: string,
    password: string,
}

export interface UserPayload {
    uuid: Uuid,
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
            username: user.username,
            password: user.password,
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