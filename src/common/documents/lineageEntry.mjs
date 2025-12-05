import Entry from "./entry.mjs";

export default class LineageEntry extends Entry {
    constructor(data) {
        super(data);

        this.#isRoot = Boolean(data?.isRoot) ?? false;
        this.#isVirtual = Boolean(data?.isVirtual) ?? false;
    }

    #isRoot = false;
    #isVirtual = false;

    get type() { return 'lineageEntry'; }

    get _id() { return this.data.code; }
    get _value() { return this.eid; }
    get _label() { return this.title; }
    get code() { return this.data.code; }
    get ltid() { return this.data.ltid; }
    get eid() { return this.data.eid; }
    get isRoot() { return this.#isRoot; }
    get isVirtual() { return this.#isVirtual; }

    set isRoot(value) { this.#isRoot = value; }
    set isVirtual(value) { this.#isVirtual = value; }
}