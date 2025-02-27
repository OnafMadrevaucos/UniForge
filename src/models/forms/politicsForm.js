import FamilyManager from "../../scripts/managers/familyManger.js";
import DatePicker  from "../datePicker.js";
import FamilyDialog from "../dialogs/familyDialog.js";
import EntryForm from "./entryForm.js";

/**
  * Formulário para lidar com entradas do tipo político.
  * @class
  * @extends EntryForm
  * 
  */
export default class PoliticsForm extends EntryForm {
    /**
      * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
      * @class
      * @extends EntryForm
      * 
      * @param {HTMLElement} title   - O título do formulário.
      */
    constructor(title) {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super(title);

        this.template = 'politicsForm'; // Define o template do formulário. 

        this.type = 'politics'; // Define o tipo do formulário.   
        
        this.manager = new FamilyManager(this); // Define o gerenciador de árvores genealógicas.

        /**
         * @property {Object} datePickers - Um objeto que gerencia os seletores de data para registro de entradas.
         * Contém duas instâncias de `DatePicker` para 'startDate' (data de início) e 'endDate' (data de término).
         */
        this.datePickers = {            
            start: new DatePicker('startDate'),
            end: new DatePicker('endDate')
        }
    }
    /* ---------------------------------------------------------------------------------------------------------------- */
    // GETTERS E SETTERS
    /**
    * Obtém os dados unificados necessários para o funcionamento do formulário.
    * @implements Implemente um método filho para as especificidades de cada formulário.
    * @async
    * @returns {object}  - Objeto de dados unificado.
    */
    prepareData() {
        super.prepareData();

        this.data.entryTypes = uniforge.doc.entryTypes.toObject();
        this.data.calendars = uniforge.doc.calendars.toObject();

        return this.data;
    }
    /* ---------------------------------------------------------------------------------------------------------------- */
    // INTERFACE DE USUÁRIO
    /**
       * Habilita/desabilita os controles do formulário.
       * @param {Number} state - O novo estado do formulário.
       * @protected
       */
    controlStates(state) {
        super.controlStates(state);
        const flavorEditor = tinymce.get('flavorEditor');

        switch (state) {
            // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA.
            case this.states.newEntry: {
                flavorEditor.mode.set('readonly');
            } break;
            // ESTADO DE EDIÇÃO DE ENTRADA.
            case this.states.adding: {
                flavorEditor.mode.set('design');
            } break;
            // ESTADO DE DELEÇÃO DE DADOS.
            case this.states.editing: {
                flavorEditor.mode.set('design');
            } break;
            // ESTADO PADRÃO.
            default: {
                flavorEditor.mode.set('readonly');
            } break;
        }
    }
    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÕES
    /**
    * Configura o conteúdo do formulário associado à instância.
    * Este método sobrescreve a implementação da classe pai e adiciona configurações específicas.
    * 
    * @override
    * @param {HTMLElement} form - O elemento que representa o formulário a ser configurado.
    */
    async configureContent(form) {
        // Chama o método de configuração da classe pai para configurar o formulário base.
        await super.configureContent(form);   
        
        // Configura o editor TinyMCE de floreio associado ao formulário.
        await this.configureFlavorTinyMCE();
    }

    /**
    * Limpa o conteúdo do formulário
    * 
    * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar.
    */
    clearContent(clearSidebar = true) {
        super.clearContent(clearSidebar);        

        const entryTypeSelect = this.querySelector('#entryType');
        entryTypeSelect.value = 0;
    }

    /**
    * Configura o editor TinyMCE para o texto de floreio da Entrada.
    */
    async configureFlavorTinyMCE() {
        if (tinymce.get('flavorEditor')) {
            tinymce.remove('#flavorEditor');
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
            selector: 'div#flavorEditor',
            placeholder: "Texto de floreio...",
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupInlineTinyMCE(editor); }
        });

        await tinymce.init(options);
    }    
    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
    * Configura ouvintes de eventos básicos para o formulário.
    * @inheritdoc
    */
    activateListeners() {
        super.activateListeners();

        const addFamilyButton = this.querySelector('.add-button.family');
        addFamilyButton.addEventListener('click', (event) => { this.onAddFamilyClick(event); });
    } 
    
    /**
    * Trata o evento de registro de uma nova entrada.
    * @interface
    * @param {Event} event      - Evento de clique no botão de Salvar.
    * @param {Object} data      - Dados padrão de qualquer entrada.
    * @param {Object} options   - Opções de salvamento da entrada.
    */
    async onSaveClick(event, data, options = {}) {
        event.stopPropagation();
        const isUpdate = options.isUpdate ?? false;        

        const headerInfo = this.querySelector('.header-info');

        const entryType = this.querySelector('#entryType');

        uniforge.utils.mergeObjects(data, {
            etid: entryType.value,
            sid: headerInfo.dataset.sid,
            htmlString: tinymce.get('mainEditor').getContent() ?? '',            
            text: ''
        });

        const validate = uniforge.db.validatePolitics(data);
        if (validate !== '') {
            this.msgBox.showWarning(validate);
            return false;
        }

        if (isUpdate) {
            data.eid = options.id;

            await uniforge.db.updateEntry(data);
            this.msgBox.showInfo('Entrada atualizada com sucesso.');
        }
        else {
            const result = await uniforge.db.addEntry(data);
            this.msgBox.showInfo('Entrada criada com sucesso.');
        }
        return true;
    }
    /**
    * Trata o evento de criação de uma nova entrada.
    * @interface
    * @param {Event} event - Evento de clique no botão de Nova Entrada.
    */
    async onNewClick(event) {
        this.clearContent(false);
    }
    /**
    * Gerencia cliques duplos em itens de entrada.
    * @inheritdoc
    * @param {MouseEvent} event - O evento de clique duplo.
    */
    async onEntryItemDoubleClick(event) {
        await super.onEntryItemDoubleClick(event);
        const entry = this.data.entry;

        if (entry) {
            const entryType = this.querySelector('#entryType');
            entryType.value = entry.etid;

            tinymce.get('flavorEditor').setContent(entry.flavor ?? '');
            tinymce.get('mainEditor').setContent(entry.htmlString);
        } else {
            this.msgBox.showWarning('Erro ao carregar a entrada.');
        }
    }    

    onAddFamilyClick(event) {
        event.stopPropagation();
        FamilyDialog.configDialog();
    }
}