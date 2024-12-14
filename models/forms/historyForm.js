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

        // Configura o editor TinyMCE de floreio associado ao formulário.
        await this.configureFlavorTinyMCE();

        // Carrega os DatePickers associados ao formulário.
        this.loadDatePickers();

        // Atribui o estado padrão aos controles do formulário.
        this._controlFormStates(this.states.default);
    }

    /**
   * Limpa o conteúdo do formulário
   * @param {HTMLElement} form - O elemento que representa o formulário.
   * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar.
   */
    clearContent(form, clearSidebar = true) {
        super.clearContent(form, clearSidebar);

        const flavorEditor = tinymce.get('flavorEditor');
        flavorEditor.setContent('');

        this.loadDatePickers();
    }   

    /**
    * Configura o editor TinyMCE para o texto de floreio da Entrada.
    */
    async configureFlavorTinyMCE() {
        if (tinymce.get('flavorEditor')) {
            tinymce.remove('#flavorEditor');
        }

        const options = CONFIG.utils.mergeObjects(CONFIG.tinymceOptions.simple, {
            selector: 'div#flavorEditor',
            placeholder: "Texto de floreio...",
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this.setupTinyMCE(editor); }
        });

        await tinymce.init(options);
    }

    /**
   * Configura o editor TinyMCE com funcionalidades adicionais.
   * @private
   * @param {Object} editor - Instância do editor TinyMCE.
   */
    setupTinyMCE(editor) {
        // Número máximo de caractéres do editor Tiny MCE de floreio.
        const maxCharacters = 255;

        // Sobrescreve o método setContent para limitar o conteúdo
        const originalSetContent = editor.setContent;

        editor.setContent = function (content, ...args) {
            // Salva a posição atual do cursor
            const bookmark = editor.selection.getBookmark(2);

            const plainTextContent = editor.dom.create('div', null, content).innerText; // Remove tags HTML
            if (plainTextContent.length > maxCharacters) {
                const truncatedText = plainTextContent.substring(0, maxCharacters);
                const truncatedHtml = editor.dom.create('div', null, truncatedText).innerHTML;
                originalSetContent.call(editor, truncatedHtml, ...args);
            } else {
                originalSetContent.call(editor, content, ...args);
            }

            // Restaura o cursor para a posição salva
            if (bookmark) {
                editor.selection.moveToBookmark(bookmark);
            }
        };

        // Evento para interceptar colagem
        editor.on('PastePreProcess', (e) => {
            const plainTextContent = editor.dom.create('div', null, e.content).innerText; // Remove HTML
            if (plainTextContent.length > maxCharacters) {
                const truncatedText = plainTextContent.substring(0, maxCharacters);
                const truncatedHtml = editor.dom.create('div', null, truncatedText).innerHTML;
                e.content = truncatedHtml; // Atualiza o conteúdo colado
            }
        });

        // Evento para evitar exceder o limite durante a digitação
        editor.on('input', () => {
            const plainTextContent = editor.getContent({ format: 'text' });
            if (plainTextContent.length > maxCharacters) {
                const truncatedText = plainTextContent.substring(0, maxCharacters);
                editor.setContent(truncatedText); // Trunca o conteúdo
            }
        });
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
    * @param {Event} event      - Evento de clique no botão de Salvar do Dialog.
    * @param {Object} options   - Opções de salvamento da entrada.
    */
    async onSaveEntry(event, options = {}) {
        event.stopPropagation();
        const isEntryUpdate = options.isEntryUpdate ?? false;
        const headerInfo = this.form.querySelector('.header-info');

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
            htmlString: tinymce.get('mainEditor').getContent() ?? '',
            flavor: tinymce.get('flavorEditor').getContent() ?? '',
            isDraft: draftSwitch.checked,
            cid: headerInfo.dataset.cid,
            text: ''
        }

        if (file) {
            // Converte o arquivo para um ArrayBuffer (Blob)
            const arrayBuffer = await file?.arrayBuffer();

            data.img = new Uint8Array(arrayBuffer);
            data.ext = fileExt;
        }

        const validate = CONFIG.db.validateEventEntry(data);
        if (validate !== '') {
            this.msgBox.showWarning(validate);
            return;
        }

        if (isEntryUpdate) {
            data.eid = options.id;
            data.evid = headerInfo.dataset.evid;

            await CONFIG.db.updateEntry(data);
            await CONFIG.db.updateEvent(data);
            this.msgBox.showInfo('Entrada atualizada com sucesso.');
        }
        else {
            const result = await CONFIG.db.addEntry(data);
            data.eid = result.lastInsertRowid;
            await CONFIG.db.addEvent(data);
            this.msgBox.showInfo('Entrada criada com sucesso.');
        }

        this.closeDialog();
        this.clearContent(this.form);

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.dispatchEvent(new Event('click'));

        await this.updateContent();
        this._controlFormStates(this.states.default);
    }

    /**
    * Trata o evento de registro de uma nova entrada.
    * @param {Event} event      - Evento de clique no botão de Salvar.
    * @param {Object} options   - Opções de salvamento da entrada.
    */
    async onSaveClick(event, options = {}) {
        event.stopPropagation();
        const isEntryUpdate = options.isEntryUpdate ?? false;

        const body = (isEntryUpdate ? 'Deseja atualizar a entrada?' : 'Deseja salvar a entrada?');
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
                onClick: (event) => { this.onSaveEntry(event, options); },
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
        this._controlFormStates(this.states.editEntry);
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
   * @param {MouseEvent} e - O evento de clique duplo.
   * @private
   */
    async onEntryItemDoubleClick(e) {
        super.onEntryItemDoubleClick(e);
        const item = e.target.closest('.entry-item');
        const itemId = Number(item.dataset.id);
        let entry = Object.values(await CONFIG.db.getEntry(itemId));

        if (entry.length == 0) {
            this.msgBox.showWarning('A Entrada não foi encontrada.');
            return;
        }

        if (entry.length != 1) {
            this.msgBox.showWarning('A Entrada está duplicada. Utilizando a primeira duplicata.');
        }

        entry = entry[0];

        let event = Object.values(await CONFIG.db.getEventOfEntry(entry.eid));

        if (event.length == 0) {
            this.msgBox.showWarning('Não há evento para a Entrada Histórica informada.');
            return;
        }

        if (event.length != 1) {
            this.msgBox.showWarning('O Evento está duplicado. Utilizando a primeira duplicata.');
        }

        event = event[0];
        this.reloadDatePickers(event);

        const headerInfo = this.form.querySelector('.header-info');
        headerInfo.dataset.cid = entry.cid;
        headerInfo.dataset.evid = event.evid;

        const displayedImage = this.form.querySelector('#displayedImage');
        const titleInput = this.form.querySelector('#titleInput');
        const entryType = this.form.querySelector('#entryType');
        const importance = this.form.querySelector('#importance');
        const draftSwitch = this.form.querySelector('#checkbox');

        titleInput.value = entry.title;
        entryType.value = entry.etid;
        importance.value = event.iid;
        tinymce.get('mainEditor').setContent(entry.htmlString);
        tinymce.get('flavorEditor').setContent(entry.flavor);
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