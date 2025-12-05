import BaseDocument from "./base.mjs";

export default class ChapterType extends BaseDocument{
    constructor(data) {
        super();
        this.#ctid = data?.ctid ?? uniforge.db.generateID();
        this.initialize(data);
    }

    #ctid = '';

    get _id() { return this.#ctid; }
    get _label() { return this.data.title; }
    get ctid() { return this.#ctid; }
    get type() { return 'chapterType'; }

    get title() { return this.data.title; }

    set title(value) { this.data.title = value; }

    initialize(data) {
        super.initialize(data);
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'ctid') {
                this.data[key] = value;
            }
        });
    }
}