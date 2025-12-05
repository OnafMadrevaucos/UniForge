import BaseDocument from "./base.mjs";

export default class TextImage extends BaseDocument {
    constructor(data) {
        super();
        this.#uuid = data?.uuid ?? uniforge.db.generateID();

        this.initialize(data);
    }

    #uuid = '';

    get _id() { return this.#uuid; }
    get uuid() { return this.#uuid; }
    get type() { return 'textImage'; }

    get raw() { return this.data.raw; }
    get ext() { return this.data.ext; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'uuid') {
                this.data[key] = value;
            }
        });
    }
}