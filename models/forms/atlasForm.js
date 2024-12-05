import EntryForm from "./entryForm.js";

export class AtlasForm extends EntryForm {
    constructor(overlay) {
        super(overlay);

        this.configureContent(this.form);
    }
}