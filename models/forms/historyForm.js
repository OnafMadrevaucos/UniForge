import { DatePickerManager } from "../datePickerManager.js";
import EntryForm from "./entryForm.js";
import Dialog from "../dialogs/dialog.js";

/**
  * Formulário para lidar com entradas do tipo histórico.
  * @class
  * @extends EntryForm
  * 
  */
export class HistoryForm extends EntryForm {
    /**
      * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
      * @class
      * @extends EntryForm
      * 
      * @param {Object} overlay - O objeto overlay passado para a classe pai e utilizado para configurar esta instância.
      */
    constructor(overlay) {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super(overlay);

        /**
         * @property {Array} importances - Os tipos de importância de eventos disponíveis para esta instância.
         * Esta propriedade é inicializada usando o método `getImportances()` da classe pai.
         */
        this.importances = this.getImportances();

        /**
         * @property {Object} datePickers - Um objeto que gerencia os seletores de data para registro de entradas.
         * Contém duas instâncias de `DatePickerManager` para 'startDate' (data de início) e 'endDate' (data de término).
         */
        this.datePickers = {
            start: new DatePickerManager('startDate'),
            end: new DatePickerManager('endDate')
        }       

        /**
         * Configura o conteúdo do formulário associado a esta instância.
         * @method configureContent
         * @param {HTMLElement} this.form - O elemento de formulário a ser configurado.
         */
        this.configureContent(this.form);
    }

    /**
   * Obtém os dados unificados necessários para o funcionamento do formulário.
   * @implements Implemente um método filho para as especificidades de cada formulário.
   * @async
   * @returns {object}  - Objeto de dados unificado.
   */
    async getData() {
        const data = await super.getData();

        data.calendars = await this.getCalendars();
        data.importances = await this.getImportances();

        return data;
    }


    /**
    * Configura o conteúdo do formulário associado à instância.
    * Este método sobrescreve a implementação da classe pai e adiciona configurações específicas.
    * 
    * @override
    * @param {HTMLElement} form - O elemento que representa o formulário a ser configurado.
    */
    async configureContent(form) {
        // Obtém objeto com todos os dados unificados necessários para o funcionamento do formulário.         
        this.data = await this.getData();

        // Chama o método de configuração da classe pai para configurar o formulário base.
        await super.configureContent(form);

        // Configura o seletor de importâncias de evento usando o método da classe pai.
        await super.configureImportanceSelect(form);

        // Configura o seletor de tipos de entrada usando o método da classe pai.
        await super.configureEntryTypeSelect(form);

        // Configura o seletor de calendários usando o método da classe pai.
        await super.configureCalendarSelect(form);

        // Configura o recipiente de imagem usando o método da classe pai.
        super.configureImageContainer(form);

        // Configura o editor TinyMCE principal associado ao formulário.
        super._configureTinyMCE();

        // Configura o editor TinyMCE de floreio associado ao formulário.
        this.configureFlavorTinyMCE();

        // Carrega os DatePickers associados ao formulário.
        this.loadDatePickers();
    }

    /**
    * Configura o editor TinyMCE para o texto de floreio da Entrada.
    */
    configureFlavorTinyMCE() {
        if (tinymce.get('flavorEditor')) {
            tinymce.remove('#flavorEditor');
        }

        const options = CONFIG.utils.mergeObjects(CONFIG.tinymceOptions.simple, {
            selector: 'div#flavorEditor',
            placeholder: "Texto de floreio...",
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupTinyMCE(editor); }
        });

        tinymce.init(options);
    }

    /**
    * Carrega os DatePickers associados à instância.
    * Para cada DatePicker, chama o método `_loadDatePicker`, passando o primeiro calendário disponível.
    */
    loadDatePickers() {
        const calendars = this.data.calendars;
        // Itera sobre todos os valores do objeto `datePickers`.
        Object.values(this.datePickers).forEach(pickers => {
            /**
             * Carrega o DatePicker com o primeiro calendário disponível.
             * @method _loadDatePicker
             * @param {Object} calendar - O primeiro calendário no objeto `calendars`.
             */
            pickers._loadDatePicker(Object.values(calendars)[0]);
        });
    }

    /**
    * Recarrega os DatePickers associados à instância.
    * Para cada DatePicker, chama o método `_loadDatePicker`, passando o calendário escolhido.
    */
    reloadDatePickers(event) {
        const calendarType = this.form.querySelector('#calendarType');   
        calendarType.value = event.clid; 
        calendarType.dispatchEvent(new Event('change'));     

        this.datePickers.start.selectFullDate(event.start_day, event.start_month, event.start_year);
        this.datePickers.end.selectFullDate(event.end_day, event.end_month, event.end_year);

        /*
        // Itera sobre todos os valores do objeto `datePickers`.
        Object.values(this.datePickers).forEach(pickers => {
            /**
             * Carrega o DatePicker com o primeiro calendário disponível.
             * @method _loadDatePicker
             * @param {Object} calendar - O primeiro calendário no objeto `calendars`.
             
            pickers._reloadDatePicker(calendar, false);
        });*/        
    }

    /**
    * Registra uma nova entrada no banco de dados.
    * @param {Event} event - Evento de clique no botão de Salvar do Dialog.
    */
    async onSaveEntry(event) {
        event.stopPropagation();
        const folder = this.form.querySelector('.folder.selected');
        if (!folder) {
            this.msgBox.showWarning('Nenhuma categoria foi selecionada.');
            this.closeDialog();
            return;
        }

        const imgInput = this.form.querySelector('#hiddenFileInput');
        const titleInput = this.form.querySelector('#titleInput');
        const entryType = this.form.querySelector('#entryType');
        const importance = this.form.querySelector('#importance');
        const calendarType = this.form.querySelector('#calendarType');
        const draftSwitch = this.form.querySelector('#checkbox');

        // Obtém o objeto do arquivo da imagem.
        const file = imgInput.files[0] ?? null; 
        // Obtém a extensão do arquivo de imagem.
        const fileExt = file?.name.split('.').pop().toLowerCase(); 
        // Converte o arquivo para um ArrayBuffer (Blob)
        const arrayBuffer = await file.arrayBuffer();

        let data = {
            etid: entryType.value,
            iid: importance.value,
            clid: calendarType.value,
            title: titleInput.value,
            date: {
                start: this.datePickers.start.selectedDate,
                end: this.datePickers.end.selectedDate
            },
            img: imgInput.value,
            htmlString: tinymce.get('textEditor').getContent() ?? '',
            flavor: tinymce.get('flavorEditor').getContent() ?? '',
            isDraft: draftSwitch.checked,
            cid: folder.dataset.cid,
            text: ''
        }

        if(file) { 
            data.img = new Uint8Array(arrayBuffer);
            data.ext = fileExt;
        }

        const validate = CONFIG.db.validateEventEntry(data);
        if (validate !== '') {
            this.msgBox.showWarning(validate);
            return;
        } 

        const result = await CONFIG.db.addEntry(data);
        data.eid = result.lastInsertRowid;
        await CONFIG.db.addEvent(data);

        this.msgBox.showInfo('Entrada criada com sucesso.');
        this.closeDialog();
        this.clearContent(this.form);

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.dispatchEvent(new Event('click'));

        await this.updateContent();
    }

    /**
    * Trata o evento de registro de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Salvar.
    */
    async onSaveClick(event) {
        event.stopPropagation();

        const body = 'Deseja salvar a entrada?';
        // Configuração de botões
        const buttons = [
            {
                label: "Não",
                icon: "fas fa-xmark",
                onClick: () => { this.closeDialog(); },
            },
            {
                label: "Sim",
                icon: "fas fa-check",
                onClick: (event) => { this.onSaveEntry(event); },
            }
        ];

        this.dialog = new Dialog('Salvar', body, buttons);
        this.dialog.createDialog();
    }

    /**
    * Trata o evento de criação de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Nova Entrada.
    */
    async onNewClick(event) {
        this.clearContent(this.form, false);
    }

    /**
    * Trata o evento de cancelamento de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
    async onCancelClick(event) {
        event.stopPropagation();

        super.onCancelClick(event);
        this.clearContent(this.form);
    }

    /**
   * Gerencia cliques duplos em itens de entrada.
   * @param {MouseEvent} event - O evento de clique duplo.
   * @private
   */
    async onEntryItemDoubleClick(e) {
        super.onEntryItemDoubleClick(e);
        const item = e.target.closest('.entry-item');
        const itemId = Number(item.dataset.id);
        let entry = Object.values(await CONFIG.db.getEntry(itemId));

        if(entry.length == 0) {
            this.msgBox.showWarning('A Entrada não foi encontrada.');
            return;
        }

        if (entry.length != 1) {
            this.msgBox.showWarning('A Entrada está duplicada. Utilizando a primeira duplicata.');
        }

        entry = entry[0];   
        
        let event = Object.values(await CONFIG.db.getEventOfEntry(entry.eid));

        if(event.length == 0) {
            this.msgBox.showWarning('Não há evento para a Entrada Histórica informada.');
            return;
        }

        if (event.length != 1) {
            this.msgBox.showWarning('O Evento está duplicado. Utilizando a primeira duplicata.');
        }

        event = event[0]; 
        this.reloadDatePickers(event);                

        const displayedImage = this.form.querySelector('#displayedImage');
        const titleInput = this.form.querySelector('#titleInput');        
        const draftSwitch = this.form.querySelector('#checkbox');

        titleInput.value = entry.title;
        tinymce.get('textEditor').setContent(entry.htmlString);
        draftSwitch.checked = entry.isDraft;    

        if (entry.img) {
            const imageType = `image/${entry.ext}`;
            const imageBlob = new Blob([entry.img], { type: imageType }); // Ajuste o tipo de imagem conforme necessário
            const imageURL = URL.createObjectURL(imageBlob);
            displayedImage.src = imageURL;
            displayedImage.classList.remove('empty');
        }

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.classList.remove('hidden');

        const saveButton = this.form.querySelector('#saveButton');
        saveButton.classList.remove('disabled');
    }
}