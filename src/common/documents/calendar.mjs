import BaseDocument from "./base.mjs";

export default class Calendar extends BaseDocument {
    constructor(data) {
        super();
        this.#clid = data?.clid ?? uniforge.db.generateID();

        this.initialize(data);
    }

    #clid = '';

    get _id() { return this.#clid; }
    get _label() { return this.data.label; }
    get clid() { return this.#clid; }
    get type() { return 'calendar'; }

    get label() { return this.data.label; }
    get suffix() { return this.data.suffix || ''; }
    get prefix() { return this.data.prefix || ''; }
    get months() { return this.data.months; }
    get days() { return this.data.days; }

    set label(value) { this.data.label = value; }
    set suffix(value) { this.data.suffix = value; }
    set prefix(value) { this.data.prefix = value; }
    set months(value) { this.data.months = value; }
    set days(value) { this.data.days = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'clid') {
                this.data[key] = value;
            }
        });
    }
}