import EntryForm from "./entryForm.js";
import Dialogs from '../dialogs/dialog.js';
import ChapterDialog from "../dialogs/chapterDialog.js";
import DBManager from "../../db/dbManager.js";
import FilePickerDialog from "../dialogs/filePickerDialog.js";
import ProgressDialog from "../dialogs/progressDialog.js";

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

    /**@inheritdoc */
    async prepareData() {
        this.prepareGroups();

        this.data.tilerHint = 'NodeTiler é uma ferramenta de geração de Tile Maps para uso com a biblioteca Leaflet. ' +
            'Um Tile Map é em si um diretório localizado no \'diretório padrão\' abaixo, altere-o se desejar ' +
            'que os arquivos gerados sejam armazenados em outro diretório.';

        await this.prepareMetadata();

        return super.prepareData();
    }

    prepareGroups() {
        const database = uniforge.doc.settings.filter(s => s.group === 'database');
        this.data.database = {};
        for (const setting of database.toArray()) {
            this.data.database[setting.tag] = setting.value;
        }

        this.data.leaflet = {};

        const leaflet = uniforge.doc.settings.filter(s => s.group === 'leaflet');
        for (const setting of leaflet.toArray()) {
            this.data.leaflet[setting.tag] = setting.value;
        }

        this.data.leaflet.MAX_ZOOM = uniforge.constants.leaflet.MAX_ZOOM;
    }

    async prepareMetadata() {
        const filePath = await uniforge.path.join(uniforge.doc.settings.get('mainMap').value, 'metadata.json');

        const data = await fetch(filePath);
        this.data.metadata = await data.json();
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
        await this.configureLeafletPanel();
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

        const externalConnectionSwitch = this.querySelector('#externalConnectionSwitch input#checkbox');
        externalConnectionSwitch.checked = (this.data.database.activeExternalCon === 'true');
        externalConnectionSwitch.dispatchEvent(new Event('change')); // Dispara o evento de mudança para atualizar a interface.
    }

    /**
     * Configura o conteúdo do panel do módulo do Leaflet®.
     */
    async configureLeafletPanel() {
        const defaultMapInput = this.querySelector('#defaultMapInput');
        const mid = uniforge.constants.leaflet.DEFAULT_OVERLAY; // Define o ID do mapa como o mapa padrão.
        const defaultMap = uniforge.doc.maps.get(mid);

        if (!defaultMap) {
            const mapBuffer = await uniforge.fs.readFile(uniforge.urls.defaultMap);
            const mapExt = await uniforge.path.extname(uniforge.urls.defaultMap);

            const mapFile = new File([mapBuffer], `default.${mapExt}`, { type: mapExt });

            // Criar um DataTransfer e adicionar o arquivo
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(mapFile);

            // Atribuir os arquivos ao input
            defaultMapInput.files = dataTransfer.files;
        }
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
    * Configura ouvintes de eventos básicos para o formulário.
    * @inheritdoc
    */
    activateListeners() {
        super.activateListeners();

        this.configureOptionsListeners();

        const html = this.ui.app;

        // ------------------------------------------------------------------------------------------------
        // Eventos do painel de Configurações Gerais ------------------------------------------------------

        // ------------------------------------------------------------------------------------------------
        // Eventos do painel de Banco de Dados ------------------------------------------------------------      

        const externalConnectionSwitch = this.querySelector('#externalConnectionSwitch input#checkbox');
        externalConnectionSwitch.addEventListener('change', (event) => { this.onExternalConnectionSwitchChange(event); });

        const testConnectionButton = this.querySelector('#testConnectionButton');
        testConnectionButton.addEventListener('click', (event) => { this.onTestConnectionClick(event); });

        const createConnectionButton = this.querySelector('#createConnectionButton');
        createConnectionButton.addEventListener('click', (event) => { this.onCreateConnectionClick(event); });

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

        // ------------------------------------------------------------------------------------------------
        // Eventos do painel de Capítulos -----------------------------------------------------------------

        const newChapterButton = this.querySelector('#newChapterButton');
        newChapterButton.addEventListener('click', (event) => { this.onNewChapterClick(event) });

        // ------------------------------------------------------------------------------------------------
        // Eventos do painel do Leaflet® ------------------------------------------------------------------

        const defaultMapButton = this.querySelector('#defaultMapButton');
        defaultMapButton.addEventListener('click', (event) => { this.onDefaultMapClick(event) });

        const loadMapButton = this.querySelector('#loadMapButton');
        loadMapButton.addEventListener('click', (event) => { this.onLoadMapClick(event) });

        // Listener para o botão de cálculo de escala
        const calculateButton = html.querySelector('#calculateScaleButton');
        if (calculateButton) {
            calculateButton.addEventListener('click', this._onCalculateScale.bind(this));
        }

        // Aciona o cálculo inicial ao carregar
        this._onCalculateScale();

        // ------------------------------------------------------------------------------------------------
    }

    /**
   * Configura os ouvidores de Eventos do menu de opções do formulário.
   */
    configureOptionsListeners() {
        const options = this.querySelector('.tabs-options');
        const buttons = options.querySelectorAll('button');

        buttons.forEach(button => {
            button.addEventListener('click', (event) => { this.onOptionButtonClick(event); });
        });
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
    * Trata o evento de ativação de uma Conexão Externa.
    * @param {Event} event      - Evento de clique no switch de conexão externa.
    */
    onExternalConnectionSwitchChange(event) {
        const isChecked = event.target.checked;

        const externalConnectionGroup = this.querySelector('#databasePanel .external-connection');
        if (isChecked) {
            externalConnectionGroup.classList.remove('hidden');
        } else {
            externalConnectionGroup.classList.add('hidden');
        }

        uniforge.settings.set('activeExternalCon', isChecked.toString());
    }

    async onTestConnectionClick(event) {
        const externalConnectionPathInput = this.querySelector('#externalConnectionPathInput');
        const connectionPath = externalConnectionPathInput.value;
        
        this.msgBox.showError(`Esta funcionalidade ainda não foi implementada. O caminho configurado é: \'${connectionPath}\'`);
    }

    onCreateConnectionClick(event) {
        this.msgBox.showError('Esta funcionalidade ainda não foi implementada.');
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

    async onDefaultMapClick(event) {
        event.stopPropagation();
        // Abre o diálogo de seleção da pasta.
        const folderData = await FilePickerDialog.configDialog(null, { canUpload: false, hasCaption: false, onlyFolders: true, type: 'folder' });

        if (folderData) {
            const defaultMapInput = this.querySelector('#defaultMapInput');
            defaultMapInput.value = folderData.path;
            defaultMapInput.dataset.absulutePath = folderData.absolutePath;
        }
    }

    async onLoadMapClick(event) {
        event.stopPropagation();
        // Abre o diálogo de seleção da pasta.
        const imageData = await FilePickerDialog.configDialog(null, { canUpload: true, hasCaption: false, type: 'images' });
        const outputFolder = await uniforge.path.join('data', 'maps', imageData.name.toLowerCase().split('.')[0]);

        uniforge.ctrls.progressDialog = new ProgressDialog({
            title: "Gerando Map Tiles",
            message: "Preparando imagem...",
            indeterminate: true,
            cancelable: true,
            onCancel: async () => {
                document.body.style.cursor = 'wait';
                uniforge.tiler.cancel().then(() => { document.body.style.cursor = 'default'; });
            },
            onComplete: () => uniforge.ctrls.progressDialog.resetProgress()
        }, { alwaysClose: true });

        await uniforge.ctrls.progressDialog.show(true);

        const result = await uniforge.tiler.generateTiles(imageData.absolutePath, { outputFolder: outputFolder, metadata: true });

        if (result instanceof Error) {
            uniforge.msgBox.showError("Um erro ocorreu ao gerar os tiles e o processo foi abortado.", result);
        }

        uniforge.ctrls.progressDialog.close();
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

    /**
     * Lógica de cálculo da escala, espelhando a função em core.mjs.
     * @param {number} zoomLevel - O nível de zoom.
     * @param {number} maxZoom - O zoom máximo (Zmax).
     * @param {number} unitRatio - Razão Map Unit para Metro.
     * @returns {{zoomLevel: number, resolution: number, mpp: number, scaleDisplay: string}}
     * @private
     */
    _calculateScaleLogic(zoomLevel, maxZoom, unitRatio, displayUnit) {
        // Obter TILE_SIZE de uniforge.constants, se necessário, ou usar um padrão.
        const TILE_SIZE = uniforge.constants.leaflet.TILE_SIZE || 256;

        // 1. Resolução em Map Units por Pixel (Map Units / Pixel)
        const resolution = 1 * Math.pow(2, maxZoom - zoomLevel);

        // 2. Metros por Pixel (MPP)
        const mpp = resolution * unitRatio;

        // 3. Cálculo para exibição (distância no mapa que 100px na tela representa)
        const distanceInMeters = mpp * 100;

        let displayValue;

        if (distanceInMeters >= 1000) {
            displayValue = distanceInMeters / 1000;
        } else if (distanceInMeters >= 1) {
            displayValue = distanceInMeters;
        } else {
            // Se for menor que 1m, converte para milímetros.
            displayValue = distanceInMeters * 1000;
        }

        const scaleDisplay = `100px \u2248 ${displayValue.toFixed(2)} ${displayUnit}`;

        return {
            zoomLevel,
            resolution: resolution,
            mpp: mpp,
            scaleDisplay: scaleDisplay
        };
    }

    /**
     * Lida com o clique do botão de cálculo de escala e atualiza a lista de saída.
     * @param {MouseEvent} [event] - O evento de clique (opcional).
     * @private
     */
    _onCalculateScale(event) {
        if (event) event.preventDefault();

        const html = this.ui.app;

        // 1. Obter valores atuais do formulário
        const maxZoomInput = html.querySelector('#maxZoomInput');
        const unitToMeterRatioInput = html.querySelector('#unitRatioInput');
        const unitNameInput = html.querySelector('#unitNameInput');

        let maxZoom = parseInt(maxZoomInput.value, 10);
        let ratio = parseFloat(unitToMeterRatioInput.value);
        const unitName = unitNameInput.value;

        // Validação básica
        if (isNaN(maxZoom) || maxZoom < 0) maxZoom = 0;
        if (isNaN(ratio) || ratio <= 0) ratio = 1;

        // 2. Determinar o range de ZoomLevels (de 0 a Zmax)
        const zoomLevels = Array.from({ length: maxZoom + 1 }, (_, i) => i);

        const scaleOutputList = html.querySelector('#scaleOutputList');
        scaleOutputList.innerHTML = ''; // Limpa a lista anterior

        // 3. Iterar e calcular/exibir
        for (const zoom of zoomLevels) {
            const scaleData = this._calculateScaleLogic(zoom, maxZoom, ratio, unitName);

            const listItem = document.createElement('li');
            listItem.innerHTML = `**Z${scaleData.zoomLevel}**: Resolução: ${scaleData.resolution.toPrecision(4)} Map Units/px | ${scaleData.scaleDisplay}`;
            scaleOutputList.appendChild(listItem);
        }
    }
}