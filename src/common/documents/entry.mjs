import BaseDocument from "./base.mjs";

export default class Entry extends BaseDocument {
    constructor(data={}) {
        super();
        this.#eid = data?.eid ?? uniforge.db.generateID();
        this.#isDraft = data?.isDraft ?? false;

        this.initialize(data);
    }

    #eid = '';
    #isDraft = false;

    get type() { return 'entry'; }

    get _id() { return this.#eid; }
    get _label() { return this.title; }
    
    get eid() { return this.#eid; }        
    
    get sid() { return this.data.sid; }
    get etid() { return this.data.entryType.etid;}
    get img() { return this.data.img; }
    get title() { return this.data.title; }
    get isDraft() { return this.#isDraft; }
    get flavor() { return this.data.flavor; }
    get htmlString() { return this.data.htmlString; }
    get events() { return this.data.events; }    
    get section() { return this.data.section; }
    get entryType() { return this.data.entryType; }
    get isEntity() { return this.entryType.isEntity; }

    /** 
     * Objeto contendo os dados dos Campos Extras da Entrada.
     * @type {Object}
     * 
     * @property {string} title             - Título do Campo Extra.
     * @property {string} description       - Descrição adicional do Campo.
     * @property {Object|null} list         - (Opicional) Lista de Items do Campo Extra.
     * @property {string} list.title        - Título do item da Lista.
     * @property {string} list.description  - Descrição adicional do Item da Lista.
     */
    get infoData() { return this.data.infoData; }

    set title(value) { this.data.title = value; }
    set img(value) { this.data.img = value; }
    set isDraft(value) { this.#isDraft = value; }
    set flavor(value) { this.data.flavor = value; }
    set htmlString(value) { this.data.htmlString = value; }
    set infoData(value) { this.data.infoData = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'eid') {
                this.data[key] = value;
            }            

            if(key === 'infoData' && (typeof value === 'string')) {
                this.data[key] = JSON.parse(value);
            }
        });
    }
}