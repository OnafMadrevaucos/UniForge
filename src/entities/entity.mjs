import Entry from "./entry.mjs";

export default class Entity extends Entry {
    constructor(data) {
        super(data);

        let lineages = Object.values(uniforge.doc.lineages.toObject());
        let lineage = lineages.find(l => l.eid === data.eid) ?? null;

        this.#ltid = lineage?.ltid ?? '';
        this.data.lineage = lineage ?? null;
    }

    #type = 'entity';
    #ltid = '';

    get ltid() { return this.#ltid; }
    get lineage() { return this.data.lineage; }
}