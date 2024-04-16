export type StatusCode = number;

export function statusContinue(): StatusCode {
    return 100 as StatusCode;
}

export function statusOk(): StatusCode {
    return 200 as StatusCode;
}

export function statusCreated(): StatusCode {
    return 201 as StatusCode;
}

export function statusAccepted(): StatusCode {
    return 202 as StatusCode;
}

export function statusNoContent(): StatusCode {
    return 204 as StatusCode;
}

export function statusBadRequest(): StatusCode {
    return 400 as StatusCode;
}

export function statusUnAuthorized(): StatusCode {
    return 401 as StatusCode;
}

export function statusForbidden(): StatusCode {
    return 403 as StatusCode;
}

export function statusNotFound(): StatusCode {
    return 404 as StatusCode;
}

// Add other status codes as necessary