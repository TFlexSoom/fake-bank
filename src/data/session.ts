import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { Uuid } from '../type/uuid';
import { randomBytes } from "node:crypto";

dayjs.extend(duration);

const client = new PrismaClient();
const maxAge: duration.Duration = dayjs.duration({
    hours: 1,
});

export interface Session {
    uuid: Uuid,
    csrfRandom: string,
}

export async function getOrCreateSession(uuid: Uuid | undefined): Promise<Session> {
    if (uuid !== undefined) {
        const maybeSession = await client.session.findUnique({
            where: {
                uuid: uuid.toString(),
            }
        });

        if (maybeSession !== null && dayjs(maybeSession.createdAt).add(maxAge).isAfter(dayjs())) {
            return {
                uuid: Uuid.fromString(maybeSession.uuid),
                csrfRandom: maybeSession.csrfRandom,
            }
        }
    }

    const session = {
        uuid: Uuid.createUuid(),
        csrfRandom: Buffer.from(randomBytes(64)).toString('base64'),
    }

    await client.session.create({
        data: {
            uuid: session.uuid.toString(),
            csrfRandom: session.csrfRandom,
        }
    });

    return session;
}

export async function upsertNewRandomForSession(uuid: Uuid | undefined): Promise<Session> {
    const result = await client.session.upsert({
        create: {
            uuid: Uuid.createUuid().toString(),
            csrfRandom: Buffer.from(randomBytes(64)).toString('base64'),
        },
        update: {
            csrfRandom: Buffer.from(randomBytes(64)).toString('base64'),
        },
        where: {
            uuid: uuid?.toString() || "",
            createdAt: {
                gte: dayjs().subtract(maxAge).toDate(),
            }
        }
    });

    return {
        uuid: Uuid.fromString(result.uuid),
        csrfRandom: result.csrfRandom,
    };
}