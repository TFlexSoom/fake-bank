export class Integer {
    private val: number

    constructor(num: number) {
        if (Math.round(num) !== num) {
            throw new Error("number has floating point")
        };

        this.val = num;
    }

    addInteger(num: Integer) {
        this.val + num.val;
    }

    add(num: number) {
        this.addInteger(new Integer(num))
    }
}