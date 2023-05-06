export class RandomPalette {
    constructor(palette) {
        this.palette = palette;
    }
    get() {
        return this.palette[Math.floor(Math.random() * this.palette.length)];
    }
}

export class CyclePalette {
    constructor(palette) {
        this.palette = palette;
        this.idx = -1;
    }
    get() {
        this.idx = (this.idx + 1) % this.palette.length;
        return this.palette[this.idx];
    }
}

export const palette01 = [
    0xFFD429,
    0x68DF58,
    0xFC3646,
    0x206DFA
]