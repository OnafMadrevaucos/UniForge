import BaseDocument from "./base.mjs";

export default class CalendarDays extends BaseDocument {
    constructor(data) {
        super();
        this.#cldid = data?.cldid ?? uniforge.db.generateID();

        this.initialize(data);
    }

    #cldid = '';

    get _id() { return this.#cldid; }
    get _label() { return this.data.label; }
    get cldid() { return this.#cldid; }
    get type() { return 'calendarDays'; }

    get label() { return this.data.label; }
    get name() { return this.data.name; }
    get clid() { return this.data.clid; }

    set label(value) { this.data.label = value; }
    set name(value) { this.data.name = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'cldid') {
                this.data[key] = value;
            }
        });
    }
}