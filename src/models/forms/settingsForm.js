import EntryForm from "./entryForm.js";
import Dialogs from '../dialogs/dialog.js';
import SubjectDialog from "../dialogs/subjectDialog.js";
import DBManager from "../../db/dbManager.js";

/**
  * Formulário de configurações do sistema.
  * @class
  * @extends BaseForm
  * 
  */
export default class SettingsForm extends EntryForm {
    /**
      * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
      * @class
      * @extends BaseForm
      * 
      * @param {HTMLElement} title   - O título do formulário.
      */
    constructor(title) {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super(title);

        this.template = 'settingsForm'; // Define o template do formulário. 

        this.type = 'settings'; // Define o tipo do formulário.

        /**
        * O objeto de manipulação do Banco de Dados.
        * @type {DBManager}
        */
        this.db = uniforge.db;
    }

    /**
     * Habilita/desabilita os controles do formulário.
     * @param {Number} state - O novo estado do formulário.
     * @protected
    */
    controlStates(state) {
        super.controlStates(state);

        const category = this.data.entry;
        const lineageIcon = this.querySelector('#lineageIcon');

        switch (state) {
            // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA.
            case this.states.newEntry: break;
            // ESTADO DE ADIÇÃO DE DADOS.
            case this.states.adding: break;
            // ESTADO DE EDIÇÃO DE ENTRADA.
            case this.states.editing: break;
            // ESTADO PADRÃO.
            default: {
                lineageIcon.classList.add('hidden');
                this._clearRootIcon();
            } break;
        }
    }

    /**
     * Obtém os dados unificados necessários para o funcionamento do formulário.
     * @implements Implemente um método filho para as especificidades de cada formulário.
     * @async
     * @returns {object}  - Objeto de dados unificado.
     */
    prepareData() {
        super.prepareData();
        return this.data;
    }

    /**
     * Configura o conteúdo do formulário.
     * @param {HTMLElement} form - O elemento que representa o formulário.
    */
    async configureContent(form) {
        await super.configureContent(form);

        this.configureDatabasePanel();
        this.configureEncycloPanel();
        this.configureLeafletPanel();
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
    * Configura ouvintes de eventos básicos para o formulário.
    * @inheritdoc
    */
    activateListeners() {
        super.activateListeners();

        this.configureOptions();

        const executeProcButton = this.querySelector('#procedureButton');
        executeProcButton.addEventListener('click', (event) => { this.onExecuteProcClick(event); });

        const deleteTableButton = this.querySelector('#deleteTableButton');
        deleteTableButton.addEventListener('click', (event) => { this.onDeleteTableClick(event); });

        const queryButton = this.querySelector('#queryButton');
        queryButton.addEventListener('click', (event) => { this.onExecuteQuery(event); });

        const resetDatabaseButton = this.querySelector('#resetDatabaseButton');
        resetDatabaseButton.addEventListener('click', (event) => { this.onResetDatabaseClick(event); });

        // O panel padrão é sempre o panel de Banco de Dados
        this.configureDatabasePanel();

        const newSubjectButton = this.querySelector('#newSubjectButton');
        newSubjectButton.addEventListener('click', (event) => { this.onNewSubjectClick(event) });
    }

    /**
   * Configura o menu de opções do formulário.
   */
    configureOptions() {
        const options = this.querySelector('.settings-options');
        const buttons = options.querySelectorAll('button');

        buttons.forEach(button => {
            button.addEventListener('click', (event) => { this.onOptionButtonClick(event); });
        });
    }

    /**
   * Configura o conteúdo do panel de Banco de Dados.
   */
    async configureDatabasePanel() {
        const procedures = this.db.storedProcedures;
        const proceduresSelect = this.querySelector('#procedureName');
        proceduresSelect.innerHTML = '';

        let emptyOption = document.createElement('option');
        emptyOption.innerHTML = '&#8212';
        proceduresSelect.appendChild(emptyOption);

        Object.values(procedures).forEach(proc => {
            const option = document.createElement('option');
            option.dataset.name = proc.name;
            option.textContent = proc.name.capitalize();

            proceduresSelect.appendChild(option);
        });

        const tables = await this.db.getAllTables();
        const allTablesSelect = this.querySelector('#tableName');
        allTablesSelect.innerHTML = '';

        emptyOption = document.createElement('option');
        emptyOption.innerHTML = '&#8212';
        allTablesSelect.appendChild(emptyOption);

        tables.forEach(table => {
            const option = document.createElement('option');
            option.dataset.name = table.name;
            option.textContent = table.name.capitalize();

            allTablesSelect.appendChild(option);
        });
    }
    /**
   * Configura o conteúdo do panel da Enciclopédia de Dados.
   * @param {HTMLElement} panel - O elemento que representa o panel carregado.
   */
    async configureEncycloPanel(panel) {
    }
    /**
   * Configura o conteúdo do panel do módulo do Leaflet®.
   * @param {HTMLElement} panel - O elemento que representa o panel carregado.
   */
    configureLeafletPanel(panel) {
        console.log('Leaflet');
    }

    /**
   * Configura o conteúdo da opção selecionada.
   * @param {HTMLElement} panel - O elemento que representa o panel carregado.
   */
    onPanelSelect(panel) {
        panel.classList.remove('hidden');
    }

    /**
       * Gerencia cliques em pastas.
       * @param {MouseEvent} event - O evento de clique.
       * @protected
       */
    onFolderClick(event) {
        super.onFolderClick(event);

        const clickedFolder = event.target.closest('.folder');
        const subjectId = clickedFolder.dataset.sid;
        const subject = uniforge.doc.subjects.get(subjectId);
        const isSelected = clickedFolder.classList.contains('selected');

        this._handleLineageIcon(subject);

        // Se formulário for o da Enciclopédia, e o estado do formulário seja o 'newEntry' ou 
        // o 'default', carregue ícone do Assunto.
        if (this.currentState <= this.states.newEntry) {
            // Carregue ícone apenas se a pasta estiver sendo selecionada.
            if (isSelected) this._loadRootIcon(clickedFolder);
        }
    }

    /**
    * Trata o evento de registro de uma nova categoria.
    * @param {Event} event      - Evento de clique no botão de Salvar.
    * @param {Object} data      - Dados padrão de qualquer entrada.
    * @param {Object} options   - Opções de salvamento.
    */
    async onSaveClick(event, data, options = {}) {
        event.stopPropagation();
        const isEntryUpdate = options.isEntryUpdate ?? false;

        const headerInfo = this.querySelector('.header-info');

        uniforge.utils.mergeObjects(data, {
            sid: headerInfo.dataset.sid,
            htmlString: tinymce.activeEditor?.getContent() ?? ''
        });

        const validate = uniforge.db.validateCategory(data);
        if (validate !== '') {
            this.msgBox.showWarning(validate);
            return;
        }

        if (isEntryUpdate) {
            data.cid = options.id;
            await uniforge.db.updateCategory(data);
            this.msgBox.showInfo('Categoria atualizada com sucesso.');
        }
        else {
            await uniforge.db.addCategory(data);
            this.msgBox.showInfo('Categoria criada com sucesso.');
        }
    }
    /**
    * Trata o evento de criação de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Nova Categoria.
    */
    async onNewClick(event) {
        this.clearContent(false);
    }

    /**
   * Remove uma entrada de uma categoria da lista.
   * @param {Event} event - Evento de clique no botão para excluir a entrada.
   */
    async onDeleteEntryAction(event) {
        super.onDeleteEntryAction(event);

        const cancelButton = this.querySelector('#cancelButton');
        cancelButton.dispatchEvent(new Event('click'));

        this.msgBox.showInfo('Categoria removida com sucesso.');
    }

    /**
    * Trata o evento de cancelamento de uma nova categoria.
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
    async onCancelClick(event) {
        event.stopPropagation();

        super.onCancelClick(event);
        this.clearContent();
    }

    /**
   * Gerencia cliques duplos em itens de entrada.
   * @protected
   * @param {MouseEvent} event - O evento de clique duplo.
   */
    async onEntryItemDoubleClick(event) {
        await super.onEntryItemDoubleClick(event);
        const category = this.data.entry;

        const clickedFolder = event.target.closest('.folder');
        const isSelected = clickedFolder.classList.contains('selected');
        if (category) {
            tinymce.get('mainEditor').setContent(category.htmlString);
            if (isSelected) {
                this._loadRootIcon(clickedFolder);
            }
        }
    }

    /**
    * Gera um novo assunto.
    * @param {Event} event - Evento de clique no botão.
    */
    async onNewSubjectClick(event) {
        event.stopPropagation();

        const subject = await SubjectDialog.configDialog();
        if (subject) {
            await uniforge.db.addSubject(subject);
            this.refresh();
        }
    }

    /**
   * Configura o event de click para os botões de opções do formulário.
   * @param {Event} event - O evento de click do botão.
   */
    onOptionButtonClick(event) {
        event.stopPropagation();
        const options = this.querySelector('.settings-options');
        const buttons = options.querySelectorAll('button');
        buttons.forEach(button => {
            let panel = this.querySelector(`#${button.dataset.panel}`);
            button.classList.remove('selected');
            panel.classList.add('hidden');
        });

        const selectedButton = event.target.closest('button');
        selectedButton.classList.add('selected');

        const selectedPanel = this.querySelector(`#${selectedButton.dataset.panel}`);
        this.onPanelSelect(selectedPanel);
    }

    /**
   * Configura o event de click para os botões de executar uma Stored Procedure
   * @param {Event} event - O evento de click do botão.
   */
    async onExecuteProcClick(event) {
        event.stopPropagation();
        const procedureNameSelect = this.querySelector('#procedureName');
        const selectedOption = procedureNameSelect.selectedOptions[0];
        const procedure = selectedOption.dataset.name;
        if (procedure) {
            const result = await this.db.storedProcedures[procedure]();
            const selectedPanel = this.querySelector('#databasePanel');

            this.msgBox.showInfo(`Procedure '${procedure}' executada com sucesso. (${result.changes}) linhas alteradas.`);
            this.onPanelSelect(selectedPanel);
        }
    }

    /**
   * Configura o event de click para os botões de exclusão de tabela.
   * @param {Event} event - O evento de click do botão.
   */
    async onDeleteTableClick(event) {
        event.stopPropagation();
        const tableNameSelect = this.querySelector('#tableName');
        const selectedOption = tableNameSelect.selectedOptions[0];
        const tableName = selectedOption.dataset.name;
        if (tableName) {
            const result = await this.db.deleteTable(tableName);
            const selectedPanel = this.querySelector('#databasePanel');

            this.msgBox.showInfo(`Tabela '${tableName}' excluída com sucesso.`);
            this.onPanelSelect(selectedPanel);
        }
    }

    /**
   * Configura o event de click para os botões de executar uma query personalizada
   * @param {Event} event - O evento de click do botão.
   */
    async onExecuteQuery(event) {
        event.stopPropagation();
        const queryText = this.querySelector('#queryText');
        const query = queryText.value;
        if (query) {
            const result = await this.db.execQuery(query);
            queryText.value = '';
            const selectedPanel = this.querySelector('#databasePanel');

            this.msgBox.showInfo(`Query executada com sucesso. (${result.changes}) linhas alteradas.`);
            this.onPanelSelect(selectedPanel);
        }
    }

    /**
   * Configura o event de click para os botões de resetar o Banco de Dados.
   * @param {Event} event - O evento de click do botão.
   */
    async onResetDatabaseClick(event) {
        event.stopPropagation();
        const confirmed = await Dialogs.secureConfirm('Recriar Banco de Dados');
        if (confirmed) {
            const commited = await this.db.resetDatabase();
            if (commited)
                this.msgBox.showInfo(`Toda estrutura do banco de dados foi recriada com sucesso.`);
        }
    }

    _handleLineageIcon(subject) {
        const lineageIcon = this.querySelector('#lineageIcon');
        if(subject.isLineage) lineageIcon.classList.remove('hidden');
        else lineageIcon.classList.add('hidden');
    }

    /**
   * Carrega ícone da raíz do assunto.
   * @protected
   * @async
   * @param {HTMLElement} folder - Objeto com os dados da pasta do Assunto.
   */
    async _loadRootIcon(folder) {
        const sid = folder.dataset.sid;
        let subject = await uniforge.db.getSubjectRoot(sid);

        if (subject) {
            const typeLabel = this.querySelector('#typeLabel');
            const dataIcon = this.querySelector('#dataIcon');
            const subjectIcon = this.querySelector('#subjectIcon');

            typeLabel.textContent = subject.title;

            dataIcon.dataset.tooltip = subject.root.capitalize();
            subjectIcon.classList.remove(...subjectIcon.classList);
            subjectIcon.className = subject.icon;
        }
    }
    /**
     * Carrega ícone da raíz do assunto.
     * @protected
     * @async
     */
    async _clearRootIcon() {
        const typeLabel = this.querySelector('#typeLabel');
        const dataIcon = this.querySelector('#dataIcon');
        const subjectIcon = this.querySelector('#subjectIcon');

        typeLabel.innerHTML = '&#8212';

        dataIcon.dataset.tooltip = 'Escolha um assunto...';
        subjectIcon.classList.remove(...subjectIcon.classList);
        subjectIcon.className = 'fa-regular fa-file';
    }
}