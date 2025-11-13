export default class Entry {
    constructor(data) {
        this.#eid = data?.eid ?? uniforge.db.generateID();
        this.#title = data?.title ?? '';
        this.#isDraft = data?.isDraft ?? false;

        this.#data = data ?? {};
    }

    #eid = '';
    #type = 'entry';
    #title = '';
    #data = {};
    #isDraft = false;

    get eid() { return this.#eid; }
    get type() { return this.#type; }
    get title() { return this.#title; }
    get data() { return this.#data; }
    get isDraft() { return this.#isDraft; }

    set title(value) { this.#title = value; }
    set isDraft(value) { this.#isDraft = value; }
}