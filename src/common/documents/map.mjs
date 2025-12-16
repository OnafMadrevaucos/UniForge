import BaseDocument from "./base.mjs";

export default class MapAtlas extends BaseDocument {
    constructor(data={}) {
        super();
        this.#mid = data?.mid ?? uniforge.db.generateID();

        this.initialize(data);
    }

    #mid = '';
    #isDraft = false;

    get _id() { return this.#mid; }
    get _label() { return this.data.title; }
    get mid() { return this.#mid; }
    get type() { return 'map'; }

    get sid() { return this.data.sid; }
    get title() { return this.data.title; }    
    get flavor() { return this.data.flavor; }
    get img() { return this.data.img; }
    get ext() { return this.data.ext; }
    get elements() { return this.data.elements; }
    get isDraft() { return this.#isDraft; }

    set sid(value) { this.data.sid = value; }
    set title(value) { this.data.title = value; }
    set flavor(value) { this.data.flavor = value; }
    set img(value) { this.data.img = value; }
    set ext(value) { this.data.ext = value; }
    set isDraft(value) { this.#isDraft = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'mid') {
                this.data[key] = value;
            }
        });
    }
}