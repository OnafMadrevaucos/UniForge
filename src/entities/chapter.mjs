export default class Chapter {
    constructor(data) {
        this.#cid = data?.cid ?? uniforge.db.generateID();

        this.initializie(data);
    }

    #cid = '';    
    #data = {};    

    get _id() { return this.#cid; }
    get _label() { return this.#data.title; }

    get cid() { return this.#cid; }
    get type() { return 'chapter'; }
    get data() { return this.#data; }
    get tome() { return this.#data.tome; }
    get title() { return this.#data.title; }
    get icon() { return this.#data.icon; }
    get cType() { return this.#data.type; }
    get hasLineage() { return this.#data.hasLineage; }
    get sections() { return this.#data.sections; }

    set tome(value) { this.#data.tome = value; }
    set title(value) { this.#data.title = value; }
    set icon(value) { this.#data.icon = value; }
    set cType(value) { this.#data.type = value; }
    set hasLineage(value) { this.#data.hasLineage = value; }

    initializie(data) {        
        this.#data = {};

        if(!data) return;

        Object.entries(data).forEach(([key, value]) => {
            if(key !== 'cid') {
                this.#data[key] = value;
            } 
        });
    }
} 