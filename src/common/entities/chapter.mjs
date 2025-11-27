import BaseDocument from "./base.mjs";

export default class Chapter extends BaseDocument {
    constructor(data) {
        super();
        this.#cid = data?.cid ?? uniforge.db.generateID();

        this.initializie(data);
    }

    #cid = '';  

    get _id() { return this.#cid; }
    get _label() { return this.data.title; }

    get cid() { return this.#cid; }
    get type() { return 'chapter'; }
    
    get tome() { return this.data.tome; }
    get title() { return this.data.title; }
    get icon() { return this.data.icon; }
    get cType() { return this.data.type; }
    get hasLineage() { return this.data.hasLineage; }
    get sections() { return this.data.sections; }

    set tome(value) { this.data.tome = value; }
    set title(value) { this.data.title = value; }
    set icon(value) { this.data.icon = value; }
    set cType(value) { this.data.type = value; }
    set hasLineage(value) { this.data.hasLineage = value; }

    initializie(data) {        
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if(key !== 'cid') {
                this.data[key] = value;
            } 
        });
    }
} 