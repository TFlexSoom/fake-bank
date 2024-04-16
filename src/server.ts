export interface Server {
    run: () => void
}

export function create() {
    return Object.freeze({
        run: () => {}
    });
}