import Entry from "./entry.mjs";
import LineageTree from "./lineageTree.mjs";

export default class Entity extends Entry {
    constructor(data) {
        super(data);
        this.#lineage = data?.lineage ?? new LineageTree({
            eid: this.eid,
            title: '',
            flavor: '',
            root: '',
            tree: '',
            entity: this,
            entries: new Set(),
            types: new Set()
        });
    }
    #lineage = null;

    get type() { return 'entity'; }
    get ltid() { return this.#lineage.ltid; }

    get lineage() { return this.#lineage; }
    set lineage(value) { this.#lineage = value; }
}