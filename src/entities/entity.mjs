import Entry from "./entry.mjs";

export default class Entity extends Entry {
    constructor(data) {
        super(data);
    }

    #type = 'entity';
}