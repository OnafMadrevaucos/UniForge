import BaseDocument from "./base.mjs";

export default class EntryType extends BaseDocument {
    constructor(data) {
        super();        
        this.#etid = data?.etid ?? uniforge.db.generateID();

        this.initialize(data);
    }

    #etid = '';

    get _id() { return this.#etid; }
    get _label() { return this.title; }
    get etid() { return this.#etid; }
    
    get title() { return this.data.title; }
    get icon() { return this.data.icon; }
    get isMaterial() { return this.data.isMaterial; }
    get isEntity() { return this.data.isEntity; }

    set etid(value) { this.#etid = value; }
    set title(value) { this.data.title = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'etid') {
                this.data[key] = value;
            }
        });
    }
}