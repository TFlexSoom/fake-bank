export class Integer {
    private val: Readonly<number>

    constructor(num: number) {
        if (Math.round(num) !== num) {
            throw new Error("number has floating point")
        };

        this.val = num;
        Object.freeze(this);
    }

    addInteger(num: Integer): Integer {
        return new Integer(this.val + num.val);
    }

    add(num: number): Integer {
        return new Integer(this.val + num);
    }

    transform(callable: (number) => number) {
        return callable(this.val);
    }

    toNumber() {
        return this.val;
    }

    toString() {
        return this.val.toString();
    }
}