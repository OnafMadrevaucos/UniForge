import BaseDocument from "./base.mjs";

export default class CalendarMonths extends BaseDocument {
    constructor(data) {
        super();
        this.#clmid = data?.clmid ?? null;
        this.#pos = data?.pos ?? 0;

        this.initialize(data);
    }

    #clmid = null;

    /** Posição do mês no calendário. 
     * @type {number} */
    #pos = 0;

    get _id() { return this.#clmid; }
    get _label() { return this.label; } 
    get clmid() { return this.#clmid; }
    get type() { return 'calendarMonths'; }

    get label() { return this.data.label; }
    get clid() { return this.data.clid; }
    get size() { return this.data.size; }
    get pos() { return this.#pos; }

    set label(value) { this.data.label = value; }   
    set size(value) { this.data.size = value; } 
    set pos(value) { this.#pos = value; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'clmid' && key !== 'pos') {
                this.data[key] = value;
            }
        });
    }
}