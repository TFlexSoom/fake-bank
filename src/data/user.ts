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

export async function createAccountForUser(user: User): Promise<Account | undefined> {
    try {
        const dbAccount = await client.account.create({
            data: {
                uuid: Uuid.createUuid().toString(),
                userId: user.id.toNumber(),
                cents: 0,
            }
        });

        return {
            id: new Integer(dbAccount.id),
            uuid: Uuid.fromString(dbAccount.uuid),
            cents: new Integer(dbAccount.cents),
        };
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
            accounts: user.Accounts.map((account) => Object.seal({
                id: new Integer(account.id),
                uuid: Uuid.fromString(account.uuid),
                cents: new Integer(account.cents),
            })),
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

const maxLoanRate = 100_000;
const maxTransferRate = 100_000;
const maxAccountValue = 100_000_000_000;

export async function loanMoneyToAccount(
    receiverUuid: Uuid,
    recieverAccount: Uuid,
    cents: Integer,
): Promise<string | undefined> {
    if (cents.toNumber() < 0) {
        // unreachable as caller should be checking
        // against it. Redundant
        return "NO GOINT INTO DEBT";
    }

    if (cents.toNumber() > maxLoanRate) {
        return "WOAH TAKE IT EASY";
    }

    try {
        const result = await client.account.update({
            data: {
                cents: {
                    increment: cents.toNumber()
                }
            },
            where: {
                uuid: recieverAccount.toString(),
                user: {
                    uuid: receiverUuid.toString(),
                }
            }
        });


        return undefined;
    } catch (err) {
        console.log(err); // probably just Row DNE    
    }

    return "ACCOUNT DOES NOT EXIST OR IS NOT OWNED";
}


export async function transferFromAccountToAccount(
    senderUuid: Uuid,
    senderAccount: Uuid,
    receiverAccount: Uuid,
    cents: Integer
): Promise<string | undefined> {
    if (cents.toNumber() < 0) {
        // unreachable as caller should be checking
        // against it. Redundant
        return "NO STEALING";
    }

    if (cents.toNumber() > maxTransferRate) {
        return "WOAH TAKE IT EASY";
    }

    return await client.$transaction(async (tx) => {
        const userAndAccounts = await client.user.findUnique({
            where: {
                uuid: senderUuid.toString(),
            },
            include: {
                Accounts: true,
            },
        });

        if (userAndAccounts === null) {
            return "user does not exist";
        }

        const maybeSender = userAndAccounts.Accounts.filter(
            (account) => senderAccount.toString() === account.uuid
        );

        if (maybeSender.length === 0) {
            return "sender account does not exist";
        }

        const sender = maybeSender[0];
        if (sender.cents < cents.toNumber()) {
            return "sender does not have that much";
        }

        const maybeReceiver = await client.account.findUnique({
            where: {
                uuid: receiverAccount.toString(),
            },
        });
        if (maybeReceiver === null) {
            return "receiving account does not exist";
        } else if ((maybeReceiver.cents + cents.toNumber()) > maxAccountValue) {
            return "receiving account cannot receive that much value";
        }
        const receiver = maybeReceiver;

        await client.account.update({
            where: {
                id: sender.id,
            },
            data: {
                cents: sender.cents - cents.toNumber(),
            }
        });

        await client.account.update({
            where: {
                id: receiver.id,
            },
            data: {
                cents: receiver.cents + cents.toNumber(),
            }
        });

        return undefined;
    },
        {
            maxWait: 10000,
            timeout: 5000,
        });
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