import { PrismaClient } from '@prisma/client'
import { Integer } from '../type/integer'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration);

const client = new PrismaClient();

enum Action {
    Register = "register",
    LoginAttempt = "login",
    Transaction = "transaction",
}

interface Limit {
    increment: Integer,
    score: Integer,
    per: duration.Duration,
}

const limits: Record<Action, Limit> = {
    [Action.Register]: {
        increment: new Integer(1),
        score: new Integer(5),
        per: dayjs.duration({
            months: 1
        }),
    },
    [Action.LoginAttempt]: {
        increment: new Integer(1),
        score: new Integer(5),
        per: dayjs.duration({
            minutes: 5
        }),
    },
    [Action.Transaction]: {
        increment: new Integer(1),
        score: new Integer(10),
        per: dayjs.duration({
            days: 1
        }),
    },
}

async function lockRequest(ip: string, action: string): Promise<boolean> {
    const limit: Limit = limits[action];
    if (limit === undefined) {
        throw new Error(`cannot lock action ${action} with no limit`);
    }

    return await client.$transaction(async (tx) => {
        const rates = await tx.rateLimit.findMany({
            where: {
                ip: ip,
                createdAt: {
                    gte: dayjs().subtract(limit.per).toDate(),
                },
            }
        });

        let sum = 0;
        for (const rate of rates) {
            sum += rate.score;
        }

        if (sum >= limit.score.toNumber()) {
            console.warn(`Ip ${ip} tried to surpass '${action}' rate limit`);
            return false;
        }

        await tx.rateLimit.create({
            data: {
                ip: ip,
                action: action,
                score: limit.increment.toNumber(),
            }
        });

        return true;
    },
        {
            maxWait: 2000,
            timeout: 5000,
        });
}

export async function lockRegisterRequest(ip: string): Promise<boolean> {
    return lockRequest(ip, Action.Register);
}

export async function lockLoginRequest(ip: string): Promise<boolean> {
    return lockRequest(ip, Action.LoginAttempt);
}

export async function lockTransaction(ip: string): Promise<boolean> {
    return lockRequest(ip, Action.Transaction);
}