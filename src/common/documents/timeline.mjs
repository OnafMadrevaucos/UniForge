import BaseDocument from "./base.mjs";

export default class Timeline extends BaseDocument {
    constructor(data) {
        super();
        this.#tid = data?.tid ?? uniforge.db.generateID();


        this.initialize(data);
    }

    #tid = '';

    get _id() { return this.#tid; }
    get _label() { return this.data.title; }
    get tid() { return this.#tid; }
    get type() { return 'timeline'; }

    get title() { return this.data.title; }
    get flavor() { return this.data.flavor; }
    get events() { return this.data.events; }

    set title(value) { this.data.title = value; }
    set flavor(value) { this.data.flavor = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'tid') {
                this.data[key] = value;
            }
        });
    }
}