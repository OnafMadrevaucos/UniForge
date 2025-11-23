export default class Section {
    constructor(data) {
        this.#sid = data?.sid ?? uniforge.db.generateID();
        this.#isDraft = data?.isDraft ?? false;

        this.initialize(data);
    }

    #sid = '';
    #data = {};
    #isDraft = false;

    get _id() { return this.#sid; }
    get _label() { return this.#data.title; }

    get sid() { return this.#sid; }
    get type() { return 'section'; }
    get data() { return this.#data; }
    get isDraft() { return this.#isDraft; }
    get cid() { return this.#data.cid; }
    get title() { return this.#data.title; }   
    get htmlString() { return this.#data.htmlString; } 

    set title(value) { this.#data.title = value; }
    set htmlString(value) { this.#data.htmlString = value; }
    set isDraft(value) { this.#isDraft = value; }

    initialize(data) {
        this.#data = {};

        if(!data) return;

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'sid') {
                this.#data[key] = value;
            }
        });
    }
}