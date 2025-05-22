import EntryForm from "./entryForm.js";
import Dialogs from '../dialogs/dialog.js';
import ChapterDialog from "../dialogs/chapterDialog.js";
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
      */
    constructor() {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super('Configurações');

        this.template = 'settingsForm'; // Define o template do formulário. 

        this.type = 'settings'; // Define o tipo do formulário.

        /**
        * O objeto de manipulação do Banco de Dados.
        * @type {DBManager}
        */
        this.db = uniforge.db;

        /**
        * O formulário de Configurações não possui funcionalidade de vinculação de Eventos.
        * @type {boolean}
        */
        this.isEventForm = false;
    }

    /** @override */
    prepareFolders(data) {
        data.folders = uniforge.doc.chapters.sort();
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

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÃO

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

        const newChapterButton = this.querySelector('#newChapterButton');
        newChapterButton.addEventListener('click', (event) => { this.onNewChapterClick(event) });
    }

    /**
   * Configura o menu de opções do formulário.
   */
    configureOptions() {
        const options = this.querySelector('.tabs-options');
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
        const chapterId = clickedFolder.dataset.id;
        const chapter = uniforge.doc.chapters.get(chapterId);
        const isSelected = clickedFolder.classList.contains('selected');

        this._handleLineageIcon(chapter);

        // Se formulário for o da Enciclopédia, e o estado do formulário seja o 'newEntry' ou 
        // o 'default', carregue ícone do Assunto.
        if (this.currentState <= this.states.newEntry) {
            // Carregue ícone apenas se a pasta estiver sendo selecionada.            
            if (isSelected) {
                this._loadTomeIcon(clickedFolder);
                this.controlStates(this.states.newEntry);
            } else
                this.controlStates(this.states.default);
        }
    }

    /**
    * Trata o evento de registro de uma nova seção.
    * @param {Event} event      - Evento de clique no botão de Salvar.
    * @param {Object} data      - Dados padrão de qualquer entrada.
    * @param {Object} options   - Opções de salvamento.
    */
    async onSaveClick(event, data, options = {}) {
        event.stopPropagation();
        try {
            const title = (this.isUpdate ? 'Atualizar' : 'Registrar');
            let dialogMessage = this.isUpdate ? 'Deseja atualizar a seção?' : 'Deseja salvar a seção?';

            if (await Dialogs.confirm(title, dialogMessage)) {
                // Inicia a transação de salvamento.
                await uniforge.db.beginTransaction();

                // Realiza o processo de salvamento (adição ou remoção) de uma Seção.
                let saved = true;

                const titleInput = this.querySelector('#titleInput');
                const draftSwitch = this.querySelector('#isDraftSwitch');
                const draftCheckbox = draftSwitch.querySelector('#checkbox');
                const headerInfo = this.querySelector('.header-info');

                const data = {
                    sid: this.sid ?? null,
                    title: titleInput.value,
                    cid: headerInfo.dataset.cid,
                    htmlString: this.mainEditor.getContent() ?? '',
                    isDraft: Number(draftCheckbox.checked),
                };

                const validate = uniforge.db.validateSection(data);
                if (validate !== '') {
                    this.msgBox.showWarning(validate);
                    return;
                }

                if (this.isUpdate) {
                    await uniforge.db.updateSection(data);
                    this.msgBox.showInfo('Seção atualizada com sucesso.');
                }
                else {
                    await uniforge.db.addSection(data);
                    this.msgBox.showInfo('Seção criada com sucesso.');
                }

                // Comita a transação de salvamento.
                await uniforge.db.commitTransaction();
                uniforge.state.update(['currentForm', { name: this.title, state: this.type, activeTab: this.activeTabIdx }]);
                await this.refresh();
            }
        }
        catch (error) {
            this.msgBox.showError(error.message, error);

            // Faz rollback em caso de erro no processo de salvamento.
            await uniforge.db.rollbackTransaction(error);
        }
    }

    /**
    * Trata o evento de criação de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Nova Categoria.
    */
    async onNewClick(event) {
        this.clearContent(false);

        // Obtém a lista de Categorias
        const selectedFolder = this.selection.folder;
        if (!selectedFolder) {
            this.msgBox.showWarning('Nenhuma pasta foi selecionada.');
            return;
        }

        const headerInfo = this.querySelector('.header-info');
        const id = selectedFolder.dataset.id ?? null;
        headerInfo.dataset.cid = id;

        const titleInput = this.querySelector('#titleInput');
        titleInput.focus();

        // Configuração do label no botão de Salvar.
        const saveButton = this.querySelector('#saveButton');
        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';

        // Gera um novo ID para a Seção.
        this.sid = uniforge.db.generateID();

        // Carrega o ícone do Tomo.
        this._loadTomeIcon(selectedFolder);

        // Atualiza o estado do formulário.
        this.controlStates(this.states.adding);
    }

    /**
   * Remove uma Seção de um Capítulo da lista.
   * @param {Event} event - Evento de clique no botão para excluir a Seção.
   */
    async onDeleteClick(event) {
        event.stopPropagation();
        const id = this.ui.dialog.dataset.id;

        await uniforge.db.deleteSection(id);
        this.msgBox.showInfo('Seção removida com sucesso.');
        await this.refresh();
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
        const item = event.target.closest('.entry-item');
        const itemId = item.dataset.id;
        const section = uniforge.doc.sections.get(itemId);

        const clickedFolder = event.target.closest('.folder');
        const isSelected = clickedFolder.classList.contains('selected');
        if (section) {
            const headerInfo = this.querySelector('.header-info');
            headerInfo.dataset.cid = section.cid ?? null;
            headerInfo.dataset.sid = section.sid ?? null;

            const titleInput = this.querySelector('#titleInput');
            const draftSwitch = this.querySelector('#isDraftSwitch');
            const draftCheckbox = draftSwitch.querySelector('#checkbox');

            titleInput.value = section.title;
            draftCheckbox.checked = section.isDraft;

            this.mainEditor = section.htmlString;
            if (isSelected) {
                this._loadTomeIcon(clickedFolder);
            }

            // Obtém o identificador do item selecionado.
            this.sid = section.sid;

            // Atualiza o estado dos elements do formulário.
            this.controlStates(this.states.editing);
        }
    }

    /**
    * Gera um novo assunto.
    * @param {Event} event - Evento de clique no botão.
    */
    async onNewChapterClick(event) {
        event.stopPropagation();

        const chapter = await ChapterDialog.configDialog();
        if (chapter) {
            await uniforge.db.addChapter(chapter);
            this.refresh();
        }
    }

    /**
    * Configura o event de click para os botões de opções do formulário.
    * @param {Event} event - O evento de click do botão.
    */
    onOptionButtonClick(event) {
        event.stopPropagation();
        const options = this.querySelector('.tabs-options');
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
            await this.refresh();
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
            await this.refresh();
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
            await this.refresh();
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
            if (commited) {
                console.log(`Toda estrutura do banco de dados foi recriada com sucesso.`);

                uniforge.state.update(['keep', true]);
                uniforge.app.refresh(); // Recarrega a aplicação.
            }
        }
    }

    _handleLineageIcon(subject) {
        const lineageIcon = this.querySelector('#lineageIcon');
        if (subject.isLineage) lineageIcon.classList.remove('hidden');
        else lineageIcon.classList.add('hidden');
    }

    /**
   * Carrega ícone da raíz do assunto.
   * @protected
   * @async
   * @param {HTMLElement} folder - Objeto com os dados da pasta do Assunto.
   */
    async _loadTomeIcon(folder) {
        const cid = folder.dataset.id;
        let chapter = await uniforge.db.getChapterTome(cid);

        if (chapter) {
            const typeLabel = this.querySelector('#typeLabel');
            const dataIcon = this.querySelector('#dataIcon');
            const chapterIcon = this.querySelector('#chapterIcon');

            typeLabel.textContent = chapter.title;

            dataIcon.dataset.tooltip = chapter.tome.capitalize();
            chapterIcon.classList.remove(...chapterIcon.classList);
            chapterIcon.className = chapter.icon;
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
        const chapterIcon = this.querySelector('#chapterIcon');

        typeLabel.innerHTML = '&#8212';

        dataIcon.dataset.tooltip = 'Escolha um assunto...';
        chapterIcon.classList.remove(...chapterIcon.classList);
        chapterIcon.className = 'fa-regular fa-file';
    }
}