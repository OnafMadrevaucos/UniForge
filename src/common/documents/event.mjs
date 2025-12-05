import CustomDate from "../primitives/date.mjs";
import BaseDocument from "./base.mjs";

export default class EntryEvent extends BaseDocument {
    constructor(data) {
        super();        
        this.#evid = data?.evid ?? uniforge.db.generateID();
        this.#isDraft = data?.isDraft ?? false;

        this.initialize(data);
    }
    
    #evid = '';
    #isDraft = false;

    get _id() { return this.#evid; }
    get _value() { return this.#evid; } 
    get _label() { return this.title; }
    get _icon() { return '<i class="fa-solid fa-calendar-days"></i>'; }

    get evid() { return this.#evid; }
    get type() { return 'event'; }    
    get isDraft() { return this.#isDraft; }

    get eid() { return this.data.source; }
    get sid() { return this.data.sid; }
    get etid() { return this.data.etid; }
    get title() { return this.data.title; }
    get flavor() { return this.data.flavor; }
    get relevance() { return this.data.relevance; }
    get source() { return this.data.source; }   
    get clid() { return this.data.clid; }

    get calendar() { return this.data.calendar; }
    get date() { return this.data.date; }
    get entry() { return this.data.entry; }
    get entryType() { return this.data.entryType; }

    initialize(data) {
        super.initialize(data);

        Object.entries(data).forEach(([key, value]) => {
            if(key !== 'evid') {
                this.data[key] = value;
            }
        });

        this.data.calendar = data.calendar ?? uniforge.doc.calendars.get(this.data.clid);

        const start = new CustomDate(this.calendar, { day: this.data.s_day, month: this.data.s_month, year: this.data.s_year });
        const end = this.data.e_day ? new CustomDate(this.calendar, { day: this.data.e_day, month: this.data.e_month, year: this.data.e_year }) : null;

        this.data.date = {
            start: start,
            end: end
        };
    }
}