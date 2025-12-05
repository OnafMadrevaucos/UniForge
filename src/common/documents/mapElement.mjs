import BaseDocument from "./base.mjs";

export default class MapElement extends BaseDocument {
    constructor(data) {
        super();
        this.#meid = data?.meid ?? uniforge.db.generateID();

        this.initialize(data);
    }

    #meid = '';

    get _id() { return this.#meid; }
    get meid() { return this.#meid; }
    get type() { return 'mapElement'; }

    get mid() { return this.data.mid; }
    get epoch() { return this.data.epoch; }
    get mType() { return this.data.type; }
    get icon() { return this.data.icon; }
    get source() { return this.data.source; }
    get points() { return this.data.points; }

    set mid(value) { this.data.mid = value; }
    set epoch(value) { this.data.epoch = value; }
    set mType(value) { this.data.type = value; }
    set icon(value) { this.data.icon = value; }
    set source(value) { this.data.source = value; }
    set points(value) { this.data.points = value; }

    initialize(data) {
        super.initialize(data);
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'meid') {
                this.data[key] = value;
            }
        });
    }
}