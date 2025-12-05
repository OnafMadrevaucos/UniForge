import BaseDocument from "./base.mjs";

export default class Tome extends BaseDocument {
    constructor(data) {
        super();

        this.initialize(data);
    }

    get _id() { return this.data.title; }
    get _label() { return this.data.label; }
    get type() { return 'tome'; }

    get title() { return this.data.title; }
    get label() { return this.data.label; }
    get icon() { return this.data.icon; }
    get enabled() { return this.data.enabled; }
}