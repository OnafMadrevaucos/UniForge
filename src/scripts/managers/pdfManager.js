import { jsPDF } from '../../common/jspdf/jspdf.mjs';
import FilePickerDialog from '../../models/dialogs/filePickerDialog.js';
export default class PDFManager {
    #doc = null;

    init(html=null) {
        this.#doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true
        });

        if(html) {
            this.fromHTML(html);
        }
    }

    fromHTML(html) {
        
        this.#doc.html(html, {
            callback: this._onCreatePDF.bind(this),
            margin: [30, 20, 30, 20],
            autoPaging: 'text'
        });
    }

    async _onCreatePDF() {
        const result = await FilePickerDialog.configDialog(null, {onlyFolders: true, type: 'pdf'});
        if(!result) return;

        const pdfBuffer = this.#doc.output("arraybuffer");
        uniforge.pdfCtrl.save(result.path, result.name || 'document.pdf', pdfBuffer);
    }
}