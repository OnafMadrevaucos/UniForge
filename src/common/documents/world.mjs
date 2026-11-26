import BaseDocument from "./base.mjs";

export default class World extends BaseDocument {
    constructor(data = {}) {
        super();
        this.#wid = data?.wid ?? uniforge.db.generateID();
        this.#hasMap = (data?.hasMap === 1) ?? true;

        this.initialize(data);
    }

    #wid = '';
    #hasMap = true;

    get type() { return 'entry'; }

    get _id() { return this.#wid; }
    get _label() { return this.title; }

    get wid() { return this.#wid; }

    get title() { return this.data.title; }
    get description() { return this.data.description; }
    get theme() { return this.data.theme; }
    get hasMap() { return this.#hasMap; }   

    set title(value) { this.data.title = value; }
    set description(value) { this.data.description = value; }
    set theme(value) { this.data.theme = value; }
    set hasMap(value) { this.#hasMap = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'wid') {
                this.data[key] = value;
            }            
        });
    }
}