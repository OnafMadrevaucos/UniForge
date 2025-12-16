import BaseDocument from "./base.mjs";

export default class LineageTree extends BaseDocument{
    constructor(data={}) {
        super();        
        this.#ltid = data?.ltid ?? uniforge.db.generateID();

        if(!data.eid) throw new Error('Entitade de Origem para a Linhagem não informado.');

        this.#eid = data?.eid;
        this.#isDraft = data?.isDraft ?? false;

        this.initialize(data);
    }

    #ltid = '';
    #eid = '';
    #root = '';
    #isDraft = false;

    get ltid() { return this.#ltid; }
    get eid() { return this.#eid; }
    get type() { return 'lineageTree'; }
    get root() { return this.#root; }    
    get isDraft() { return this.#isDraft; }

    get title() { return this.data.title; }
    get flavor() { return this.data.flavor; }
    get tree() { return this.data.tree; }
    get entity() { return this.data.entity; }
    get entries() { return this.data.entries; }
    get types() { return this.data.types; }

    set title(value) { this.data.title = value; }
    set flavor(value) { this.data.flavor = value; }
    set tree(value) { this.data.tree = value; }
    set entity(value) { this.data.entity = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'ltid' && key !== 'eid') {
                this.data[key] = value;
            }
            
            if(key === 'entries') {
                value.toArray().forEach(entry => {
                    if(entry.isRoot) this.#root = entry.code;
                });
            }
        });
    }
}