import BaseDocument from "./base.mjs";

export default class Relevance extends BaseDocument{
    constructor(data) {
        super();        
        this.#rid = data?.rid ?? uniforge.db.generateID();
        this.initialize(data);
    }

    #rid = '';

    get _id() { return this.#rid; }
    get _label() { return this.data.title; }

    get rid() { return this.#rid; }
    get type() { return 'relevance'; }
    
    get title() { return this.data.title; }
    get value() { return this.data.title.toLowerCase(); }
    
    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'rid') {
                this.data[key] = value;
            }
        });
    }
}