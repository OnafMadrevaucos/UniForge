import BaseDialog from "./baseDialog.js";
import Dialogs from "./dialog.js";

export default class LineageTypeDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '650px',
            width: '350px'
        }));

        this.ltid = dialogData.ltid; // Código da Árvore de Linhagem.

        this.template = 'lineageTypeDialog'; // Define o template do diálogo.
    }

    static #typesToCommit = new Map();

    get typesToCommit() {
        return LineageTypeDialog.#typesToCommit;
    }
    set typesToCommit(value) {    
        LineageTypeDialog.#typesToCommit = value;
    }

    prepareData() {
        this.prepareList(this.data);        
    }

    async prepareList(data) {
        const lineageCommited = uniforge.doc.lineages.get(this.ltid);
        const typesCommited = lineageCommited?.types.toObject() ?? [];
        const typesNotCommited = [...this.typesToCommit.values()].filter(t => t.dbAction !== 'd');

        data.types = typesCommited.merge(typesNotCommited);
    }

    async configureElements() {
        const typeList = this.querySelector('#typeList');
        const typeListItems = typeList.querySelectorAll('.item');

        typeListItems.forEach(item => { 
            const tag = item.dataset.value;
            item.dataset.label = this.data.types.find(t => t._value === tag).label;

            this._appendDeleteIcon(item); 
        });
    }

    close() {
        super.close();
        this.typesToCommit.clear();
    }

    _activateListeners() {
        super._activateListeners();

        const clearButton = this.querySelector('#clearButton');
        clearButton.addEventListener('click', (event) => { this.onClearTypeClick(event); });

        const addTypeButton = this.querySelector('#addTypeButton');
        addTypeButton.addEventListener('click', (event) => { this.onAddTypeClick(event); });

        const typeList = this.querySelector('#typeList');
        const typeListItems = typeList.querySelectorAll('.item');

        typeListItems.forEach(item => {
            item.addEventListener('dblclick', (event) => { this.onTypeListItemDblClick(event); });
            const removeButton = item.querySelector('.remove-button');
            removeButton.addEventListener('click', (event) => { this.onDeleteTypeClick(event); });
        });
    }

    onClearTypeClick(event) {
        event.stopPropagation();
        const clearButton = event.target;

        const tagInput = this.querySelector('#tagInput');
        const labelInput = this.querySelector('#labelInput');

        const addTypeButton = this.querySelector('#addTypeButton');

        tagInput.value = '';
        labelInput.value = '';
        
        delete this.oldType;

        clearButton.setAttribute('hidden', true);
        addTypeButton.innerText = 'Adicionar Tipo';
    }

    onAddTypeClick(event) {
        event.stopPropagation();

        const tagInput = this.querySelector('#tagInput');
        const labelInput = this.querySelector('#labelInput');

        const rawTag = tagInput.value;
        const tag = rawTag.trim().toLowerCase();

        const label = labelInput.value;

        if (!tag || tag.isEmpty()) {
            this.msgBox.showWarning('Por favor, informe a Tag do Novo Tipo.');
            tagInput.focus();
            return;
        }

        if (!label || label.isEmpty()) {
            this.msgBox.showWarning('Por favor, informe o Label do Novo Tipo.');
            labelInput.focus();
            return;
        }

        const key = this.oldType ? this.oldType._value : tag;        

        const type = {
            _value: key,
            _label: `${label} (${tag})`,
            ltid: this.ltid,
            tag: tag,
            label: label,
            dbAction: 'a'
        }

        this.typesToCommit.set(key, type);
        this.refresh();
    }

    async onDeleteTypeClick(event) {
        event.stopPropagation();
        if (await Dialogs.confirm('Excluir Tipo','Deseja excluir o Tipo?')) {
            const item = event.target.closest('.item');
            const tag = item.dataset.value;
            const label = item.dataset.label;

            const type = {
                _value: tag,
                _label: `${label} (${tag})`,
                ltid: this.ltid,
                tag: tag,
                label: label,
                dbAction: 'd'
            }

            this.typesToCommit.set(tag, type);
            this.refresh();
        }
    }

    onTypeListItemDblClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.item');

        const tag = item.dataset.value;
        const type = this.data.types.find(t => t._value === tag);

        const tagInput = this.querySelector('#tagInput');
        const labelInput = this.querySelector('#labelInput');

        tagInput.value = type.tag;
        labelInput.value = type.label;

        const clearButton = this.querySelector('#clearButton');
        clearButton.removeAttribute('hidden');

        const addTypeButton = this.querySelector('#addTypeButton');
        addTypeButton.innerText = 'Atualizar Tipo';

        this.oldType = type;
    }

    static async configDialog(ltid, options = {}) {   
        options = uniforge.utils.mergeObjects(options, {alwaysClose: true});     
        return new Promise((resolve, reject) => {
            const dialog = new this({
                title: 'Gerenciar Tipos da Linhagem',
                ltid: ltid,
                buttons: {
                    cancel: {
                        label: "Cancelar",
                        icon: "fas fa-xmark",
                        callback: () => {
                            resolve(false);                            
                        }
                    },
                    apply: {
                        label: "Aplicar",
                        icon: "fas fa-check",
                        callback: () => {
                            resolve (new Map(this.#typesToCommit));                            
                        }
                    }
                },
                abort: () => resolve(null)
            }, options);
            dialog.render(true);            
        });
    }

    _appendDeleteIcon(item) {
        const itemContent = item.querySelector('.item-content');
        const a = document.createElement('a');
        a.classList.add('remove-button');
        a.innerHTML = `<i class="fas fa-trash"></i>`;

        itemContent.appendChild(a);
    }
}