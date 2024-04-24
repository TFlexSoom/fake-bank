const minimumUsernameByteLength = 4;
const maxUsernameByteLength = 256;

export function isValidUsername(username: string | undefined): boolean {
    return username !== undefined
        && username.length >= minimumUsernameByteLength
        && username.length <= maxUsernameByteLength;
}