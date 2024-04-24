import { PrismaClient } from '@prisma/client';
import { Uuid } from '../type/uuid';
import { HashedPassword } from '../auth/password';
import { Integer } from '../type/integer';

const client = new PrismaClient();

export interface User {
    id: Integer,
    uuid: Uuid,
    username: string,
    password: string,
}

export interface Account {
    id: Integer,
    uuid: Uuid,
    cents: Integer,
}

export interface UserAndAccounts {
    user: User,
    accounts: Array<Account>,
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
            id: new Integer(dbUser.id),
            uuid: Uuid.fromString(dbUser.uuid), // Uuid shoudl clone by default
            username: username,
            password: hashed.toString(),
        }
    } catch (err) {
        console.error("DB Error: ", err);
    }

    return undefined;
}

export async function getUserAndAccountsFromUuid(uuid: Uuid): Promise<UserAndAccounts> {
    const emptyResponse: UserAndAccounts = {
        user: getEmptyUser(),
        accounts: [],
    };

    try {
        const user = await client.user.findUnique({
            where: {
                uuid: uuid.toString(),
            },
            include: {
                Accounts: true,
            }
        });

        if (user === null) {
            return emptyResponse;
        }

        return {
            user: {
                id: new Integer(user.id),
                uuid: Uuid.fromString(user.uuid),
                username: structuredClone(user.username),
                password: structuredClone(user.password),
            },
            accounts: [],
        }

    } catch (err) {
        console.log("DB Error: ", err);
    }

    return emptyResponse;
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
            id: new Integer(user.id),
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
        id: new Integer(0),
        uuid: Uuid.createUuid(),
        username: "",
        password: "",
    };
}

export function isEmptyUser(user: User): boolean {
    return user.id.toNumber() === 0;
}