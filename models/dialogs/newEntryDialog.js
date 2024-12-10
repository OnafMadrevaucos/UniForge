import Dialog from "./dialog.js";

export default class NewEntryDialog extends Dialog {
    constructor(folder) {
        const body = document.createElement('div');
        body.className = 'data-group text';

        const input = document.createElement('input');
        input.id = 'entryTitle';
        input.type = 'text';
        input.className = 'data';
        input.placeholder = 'Título...';

        body.appendChild(input);

        // Configuração de botões
        const buttons = [
            {
                label: "Cancelar",
                icon: "fas fa-xmark",
                onClick: () => {
                    this.closeDialog();
                },
            },
            {
                label: "Confirmar",
                icon: "fas fa-check",
                onClick: () => { this.createNewEntry(folder); },
            }
        ];

        super('Nova Entrada', body.outerHTML, buttons);

        this.db = CONFIG.db;
    }

    /**
   * Gera uma nova entrada e a registra em uma folder (categoria).
   * @param {Object} data - Conjunto de dados que representam a nova entrada.
   * @returns {HTMLElement} - O elemento da entrada já devidamente configurada.
   */
    async createNewEntry(folder) {
        const entryList = folder.querySelector('.entry-list');
        const entryTitle = this.dialog.querySelector('#entryTitle');

        const data = await this.db.newEntry(entryTitle.value);        

        const entryItem = this.createEntryItem(data);

        entryItem.addEventListener('click', (event) => {
            this.onEntryItemClick(event);
        });
        entryItem.addEventListener('dblclick', (event) => {
            this.onEntryItemDoubleClick(event);
        });

        entryList.appendChild(entryItem);

        this.dialog.closeDialog();
        this.updateEntryItems();
    }
}