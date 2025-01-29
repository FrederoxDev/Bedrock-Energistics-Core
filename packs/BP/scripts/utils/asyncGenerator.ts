export function* asyncAsGenerator<T>(asyncFn: () => Promise<T>): Generator<void, T, void> {
    let isWaiting = true;
    let res: T | undefined;

    asyncFn().then((result) => {
        isWaiting = false;
        res = result;
    }).catch((error: unknown) => {
        isWaiting = false;
        throw error;
    });

    while (isWaiting as boolean) {
        yield;
    }

    return res as T;
}