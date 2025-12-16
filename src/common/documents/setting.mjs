import BaseDocument from "./base.mjs";

export default class Setting extends BaseDocument {
    constructor(data) {
        super();
        this.#tag = data.tag;

        this.initialize(data);
    }

    #tag = '';

    get _id() { return this.#tag; }
    get tag() { return this.#tag; }
    get group() { return this.data.group; }
    get value() { return this.data.value; }

    set tag(value) { this.#tag = value; }
    set group(value) { this.data.group = value; }
    set value(value) { this.data.value = value; }

    initialize(data) {
        super.initialize(data);
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'tag') {
                this.data[key] = value;
            }
        });
    }
}