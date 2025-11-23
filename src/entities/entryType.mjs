export default class EntryType {
    constructor(data) {
        this.#etid = data?.etid ?? uniforge.db.generateID();

        this.initialize(data);
    }

    #etid = '';
    #data = null;

    get _id() { return this.#etid; }
    get _label() { return this.title; }
    get etid() { return this.#etid; }
    get data() { return this.#data; }

    get title() { return this.#data.title; }
    get icon() { return this.#data.icon; }
    get isMaterial() { return this.#data.isMaterial; }
    get isEntity() { return this.#data.isEntity; }

    set etid(value) { this.#etid = value; }
    set title(value) { this.#data.title = value; }
    set data(value) { this.#data = value; }

    initialize(data) {
        this.#data = {};

        if(!data) return;

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'etid') {
                this.#data[key] = value;
            }
        });
    }
}