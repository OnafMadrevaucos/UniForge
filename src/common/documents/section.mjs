import BaseDocument from "./base.mjs";

export default class Section extends BaseDocument { 
    constructor(data={}) {
        super();        
        this.#sid = data?.sid ?? uniforge.db.generateID();
        this.#isDraft = data?.isDraft ?? false;

        this.initialize(data);
    }

    #sid = '';
    #isDraft = false;

    get _id() { return this.#sid; }
    get _label() { return this.data.title; }

    get sid() { return this.#sid; }
    get type() { return 'section'; }
    
    get isDraft() { return this.#isDraft; }
    get cid() { return this.data.cid; }
    get title() { return this.data.title; }   
    get htmlString() { return this.data.htmlString; } 
    get tome() { return this.data.chapter.tome; }
    get chapterType() { return this.data.chapter.cType; }
    get chapter() { return this.data.chapter; }
    get hasLineage() { return this.data.chapterhasLineage; }
    get entries() { return this.data.entries; }
    get events() { return this.data.events; }

    set title(value) { this.data.title = value; }
    set htmlString(value) { this.data.htmlString = value; }
    set isDraft(value) { this.#isDraft = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'sid') {
                this.data[key] = value;
            }
        });
    }
}