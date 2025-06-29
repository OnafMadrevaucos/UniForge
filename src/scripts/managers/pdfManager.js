import { jsPDF } from '../../common/jspdf/jspdf.mjs';
export default class PDFManager {
    #doc = null;

    init(html=null) {
        this.#doc = new jsPDF();

        if(html) {
            this.fromHTML(html);
        }
    }

    fromHTML(html) {
        
        this.#doc.html(html, {
            callback: async function (doc) { await doc.save(); },
            margin: [3, 2, 3, 2],
            autoPaging: 'text'
        });
    }
}