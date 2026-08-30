import EntryForm from "./entryForm.js";
import Dialogs from '../dialogs/dialog.js';
import ChapterDialog from "../dialogs/chapterDialog.js";
import ThemeDialog from "../dialogs/themeDialog.js";
import DBManager from "../../db/dbManager.js";
import FilePickerDialog from "../dialogs/filePickerDialog.js";
import ProgressDialog from "../dialogs/progressDialog.js";
import Slider from "../controls/slider.js";

import CalendarMonths from "../../common/documents/calendarMonths.mjs";

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

        /**
        * Se trata de um calendário sendo editado.
        * @type {boolean}
        */
        this.isCalendarEdit = false;

        /**
         * O objeto para armazenar os dados de seleção do formulário.
         */
        this.selection = {
            calendar: null,
            chapter: null
        }

        /**
         * O objeto para armazenar os sliders do formulário.
         */
        this.sliders = {
            monthSize: null
        };
    }

    /**
     * Retorna o calendário selecionado.
     */
    get calendar() {
        return this.selection.calendar;
    }
    /**
     * Retorna o capítulo selecionado.
     */
    get chapter() {
        return this.selection.chapter;
    }

    /**@inheritdoc */
    async prepareData() {
        this.prepareCalendars();

        this.prepareGroups();

        this.data.tilerHint = 'NodeTiler é uma ferramenta de geração de Tile Maps para uso com a biblioteca Leaflet. ' +
            'Um Tile Map é em si um diretório localizado no \'diretório padrão\' abaixo, altere-o se desejar ' +
            'que os arquivos gerados sejam armazenados em outro diretório.';

        await this.prepareThemes();

        await this.prepareMetadata();

        return super.prepareData();
    }

    prepareCalendars() {
        const calendars = uniforge.doc.calendars.toArray();
        this.data.calendars = calendars;
    }

    prepareGroups() {
        this.data.misc = {};
        for (const setting of uniforge.doc.settings.toArray('misc')) {
            this.data.misc[setting.tag] = setting.value;
        }

        this.data.database = {};
        for (const setting of uniforge.doc.settings.toArray('database')) {
            this.data.database[setting.tag] = setting.value;
        }

        this.data.leaflet = {};
        for (const setting of uniforge.doc.settings.toArray('leaflet')) {
            this.data.leaflet[setting.tag] = setting.value;
        }

        this.data.leaflet.MAX_ZOOM = uniforge.constants.leaflet.MAX_ZOOM;
    }

    async prepareThemes() {
        const extraThemesFiles = await uniforge.fs.readDir(uniforge.urls.relativePath.customCSS);

        const extraThemes = [];

        extraThemesFiles.files.forEach(theme => {
            const themeName = theme.name;
            extraThemes.push({
                _id: `custom/theme-${themeName}`,
                _label: themeName.capitalize().replaceAll('.css', '')
            });
        });

        this.data.themes = {
            nativos: [
                { _id: 'theme-medieval', _label: 'Medieval' },
                { _id: 'theme-scifi', _label: 'Sci-fi' },
                { _id: 'theme-neutral', _label: 'Neutro' },
            ],
            extras: extraThemes
        };
    }

    async prepareMetadata() {
        const filePath = await uniforge.path.join(uniforge.doc.settings.get('leaflet.mainMap'), 'metadata.json');

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

        this.configureMiscPanel();

        this.configureDatabasePanel();

        await this.configureLeafletPanel();
    }

    /**
    * Configura o conteúdo do panel de Configurações Gerais.
    */
    async configureMiscPanel() {
        const themeSelector = this.querySelector('#themeSelector');
        const selectedTheme = this.data.misc.currentTheme ?? 'theme-neutral';

        const editThemeButton = this.querySelector("#editThemeButton");

        const themePath = localStorage.getItem('uniforge_theme_path') || 'css/themes.css';
        if (themePath?.includes('custom')) {
            editThemeButton.innerHTML = '<i class="fas fa-palette"></i';
            editThemeButton.dataset.tooltip = 'Editar Tema';
            editThemeButton.dataset.action = 'edit';

            const deleteThemeButton = this.querySelector("#deleteThemeButton");
            deleteThemeButton.classList.remove('hidden');
        } else {
            editThemeButton.innerHTML = '<i class="fas fa-clone"></i';
            editThemeButton.dataset.tooltip = 'Clonar Tema';
            editThemeButton.dataset.action = 'clone';
        }

        themeSelector.value = selectedTheme;
        themeSelector.dispatchEvent(new Event('change'));

        this.sliders.monthSize = new Slider('monthSizeSlider', this.form, { min: 1, max: 50, step: 1, value: 30, linkedLabel: 'monthSizeSpan', tooltip: 'Dias do Mês', width: '100%' });
        this.sliders.monthSize.config();
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

        this.activateOptionsListeners();

        // Eventos do painel de Configurações Gerais.
        this.activateMainPanelListeners();

        // Eventos do painel de Banco de Dados.
        this.activateDatabaseListeners();

        // Eventos do painel de Capítulos.
        this.activateChaptersListeners();

        // Eventos do painel do Leaflet®.
        this.activateLeafletListeners();
    }

    activateMainPanelListeners() {
        const themeSelector = this.querySelector('#themeSelector');
        themeSelector.addEventListener('change', (event) => { this.onThemeSelectorChange(event); });

        const newThemeButton = this.querySelector('#newThemeButton');
        newThemeButton.addEventListener('click', (event) => { this.onNewThemeClick(event); });

        const editThemeButton = this.querySelector("#editThemeButton");
        editThemeButton.addEventListener('click', (event) => { this.onEditThemeClick(event); });

        const deleteThemeButton = this.querySelector("#deleteThemeButton");
        deleteThemeButton.addEventListener('click', (event) => { this.onDeleteThemeClick(event); });

        const newCalendarButton = this.querySelector('#newCalendarButton');
        newCalendarButton.addEventListener('click', (event) => { this.onNewCalendarClick(event); });

        const calendarsList = this.querySelector('#calendarsList');
        calendarsList.addEventListener('click', (event) => { this.onCalendarsListClick(event); });

        const calendarItems = this.querySelectorAll('.calendar-item');
        calendarItems.forEach(item => {
            item.addEventListener('click', (event) => { this.onCalendarItemClick(event); });
        });

        const addMonthButton = this.querySelector('#addMonthButton');
        addMonthButton.addEventListener('click', (event) => { this.onAddMonthClick(event); });

        const saveMonthButton = this.querySelector('#saveMonthButton');
        saveMonthButton.addEventListener('click', (event) => { this.onSaveMonthClick(event); });

        const saveCalendarButton = this.querySelector('#saveCalendarButton');
        saveCalendarButton.addEventListener('click', (event) => { this.onSaveCalendarClick(event); });
    }

    activateChaptersListeners() {
        const newChapterButton = this.querySelector('#newChapterButton');
        newChapterButton.addEventListener('click', (event) => { this.onNewChapterClick(event) });
    }

    activateDatabaseListeners() {
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
    }

    activateLeafletListeners() {
        const html = this.ui.app;

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
    }

    /**
    * Configura os ouvidores de Eventos do menu de opções do formulário.
    */
    activateOptionsListeners() {
        const options = this.querySelector('.tabs-options');
        const buttons = options.querySelectorAll('button');

        buttons.forEach(button => {
            button.addEventListener('click', (event) => { this.onOptionButtonClick(event); });
        });
    }

    /**
     * Configura o evento de adicionar um novo calendário.
     * @param {Event} event 
     */
    onNewCalendarClick(event) {
        event.stopPropagation();

        this._clearCalendarData(false);

        this.isCalendarEdit = false;

        const calendarNameInput = this.querySelector('#calendarName');
        calendarNameInput.focus();
    }

    /**
     * Configura o evento de clique em uma lista de calendários.
     * @param {Event} event 
     */
    onCalendarsListClick(event) {
        event.stopPropagation();
        const target = event.target;

        if (!target.classList.contains('calendar-item')) {
            this._clearCalendarData();

            this.isCalendarEdit = false;
        }
    }

    /**
     * Configura o evento de seleção de um calendário.
     * @param {Event} event 
     */
    onCalendarItemClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.calendar-item');
        const calendarId = Number(event.target.closest('.calendar-item').dataset.value);
        const calendar = uniforge.doc.calendars.get(calendarId);

        // Limpa qualquer item que tenha sido selecionado antes.
        this._clearCalendarData();
        // Seleciona o item clicado.
        item.classList.toggle('selected');

        // Identifica que o calendário selecionado está sendo editado.
        this.isCalendarEdit = true;

        this._loadCalendarData(calendar);
    }

    /**
     * Configura o evento de adicionar um novo mês ao calendário selecionado.
     * @param {Event} event 
     */
    onAddMonthClick(event) {
        event.stopPropagation();
        const monthName = this.querySelector('#monthName')?.value || '';

        if (!monthName || monthName.isEmpty()) {
            this.msgBox.showWarning('O nome do mês não pode ser vazio.');
            return;
        }

        const addMonthButton = this.querySelector('#addMonthButton');
        const clmid = Number(addMonthButton.dataset.clmid);

        const calendar = this.selection.calendar;
        let data = {
            clid: calendar.clid,
            clmid: clmid || (calendar.months.size + 1) * (-1), // Id Provisório.
            label: monthName,
            size: this.sliders.monthSize.value
        };

        if (this.isCalendarEdit) {
            data.dbAction = clmid ? 'u' : 'i';
        }

        calendar.months.add(new CalendarMonths(data));
        this._realoadCalendarData(calendar);
    }

    /**
     * Configura o evento de salva alterações em um mês ao calendário selecionado.
     * @param {Event} event 
     */
    onSaveMonthClick(event) {
        event.stopPropagation();
        const addMonthButton = this.querySelector('#addMonthButton');
        const clmid = Number(addMonthButton.dataset.clmid);        

        const monthName = this.querySelector('#monthName')?.value || '';

        this.calendar.months.get(clmid).label = monthName;
        this.calendar.months.get(clmid).size = this.sliders.monthSize.value;
        this.calendar.months.get(clmid).data.dbAction = 'u';

        this._realoadCalendarData(this.calendar);
    }

    /**
     * Configura o evento de salvar os dados do calendário selecionado.
     * @param {Event} event 
     */
    async onSaveCalendarClick(event) {
        event.stopPropagation();

        if (await Dialogs.confirm("Salvar Calendário", "Deseja salvar o calendário?")) {

            let data = {};
            try {
                // Inicia uma transação no Banco de Dados.
                uniforge.db.beginTransaction();

                const calendar = this.selection.calendar;

                // É uma alteração em um Calendário já existente.
                if (this.isCalendarEdit) {
                    data = {
                        clid: calendar.clid,
                        label: calendar.label,
                        prefix: calendar.prefix,
                        suffix: calendar.suffix
                    }

                    await uniforge.db.updateCalendar(data);

                    for (const day of calendar.days) {
                        data = {
                            cldid: day.cldid,
                            clid: day.clid,
                            label: day.label,
                            name: day.name
                        };

                        await uniforge.db.updateCalendarDays(data);
                    }

                    for (const month of calendar.months) {
                        data = {
                            clmid: month.clmid,
                            clid: month.clid,
                            label: month.label,
                            size: month.size
                        };

                        if (month.data.dbAction == 'i') {
                            await uniforge.db.addCalendarMonths(data);
                        } else if (month.data.dbAction == 'u') {
                            await uniforge.db.updateCalendarMonths(data);
                        } else if (month.data.dbAction == 'd') {
                            await uniforge.db.deleteCalendarMonth(data.clmid);
                        }
                    }
                }
                // É a criação de um novo Calendário.
                else {
                    data = {
                        clid: calendar.clid,
                        label: calendar.label,
                        prefix: calendar.prefix,
                        suffix: calendar.suffix
                    }

                    await uniforge.db.addCalendar(data);

                    for (const day of calendar.days) {
                        data = {
                            cldid: day.cldid,
                            clid: day.clid,
                            label: day.label,
                            name: day.name
                        };

                        await uniforge.db.addCalendarDays(data);
                    }

                    for (const month of calendar.months) {
                        data = {
                            clmid: month.clmid,
                            clid: month.clid,
                            label: month.label,
                            size: month.size
                        };

                        await uniforge.db.addCalendarMonths(data);
                    }
                }
                // Confirma as alterações no Banco de Dados.
                uniforge.db.commitTransaction();
                this._clearCalendarData();
            } catch (error) {
                // Reverte as alterações no Banco de Dados.
                uniforge.db.rollbackTransaction(error.message);
            }
        }
    }

    /**
     * Configura o evento de clique em um mês do calendário selecionado.
     * @param {Event} event 
     */
    onMonthItemClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.month-item');
        const clmid = Number(item.dataset.clmid);
        const month = this.calendar.months.get(clmid);

        const isDeselect = item.classList.contains('selected');

        this._clearMonthData(!isDeselect);

        if (!isDeselect) {
            item.classList.toggle('selected');

            const deleteButton = item.querySelector('a.delete-button');
            deleteButton.classList.remove('hidden');

            const saveMonthButton = this.querySelector('#saveMonthButton');
            saveMonthButton.classList.remove('hidden');

            this._loadMonthData(month);
        }
    }

    /**
     * Configura o evento de clique para remover um mês do calendário selecionado.
     * @param {Event} event 
     */
    onDeleteMonthClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.month-item');
        const clmid = Number(item.dataset.clmid);

        if (this.isCalendarEdit) {
            this.calendar.months.get(clmid).data.dbAction = 'd';
        } else {
            this.calendar.months.delete(clmid);
        }

        this._realoadCalendarData(this.calendar);
    }

    /**
   * Configura o evento de mudança de tema.
   * @param {Event} event - O evento de mudança de tema.
   */
    async onThemeSelectorChange(event) {
        const selectedTheme = event.target.value;
        let theme = 'theme-medieval';
        let themePath = 'css/themes.css';

        const isExtra = selectedTheme.includes("custom");
        const editThemeButton = this.querySelector("#editThemeButton");
        const deleteThemeButton = this.querySelector("#deleteThemeButton");

        if (isExtra) {
            theme = (selectedTheme.split('/')[1]).replaceAll('.css', '');
            themePath = `css/${selectedTheme.replaceAll('theme-', '')}`;

            editThemeButton.innerHTML = '<i class="fas fa-palette"></i>';
            editThemeButton.dataset.tooltip = 'Editar Tema';
            editThemeButton.dataset.action = 'edit';

            deleteThemeButton.classList.remove('hidden');
        }
        else {
            theme = selectedTheme;
            editThemeButton.innerHTML = '<i class="fas fa-clone"></i>';
            editThemeButton.dataset.tooltip = 'Clonar Tema';
            editThemeButton.dataset.action = 'clone';

            deleteThemeButton.classList.add('hidden');
        }

        const themeLink = document.getElementById("themeLink");
        themeLink.href = themePath;

        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('uniforge_theme', theme);
        localStorage.setItem('uniforge_theme_path', themePath);

        await uniforge.settings.set('misc.currentTheme', selectedTheme);
    }

    async onNewThemeClick(event) {
        event.stopPropagation();

        const theme = await ThemeDialog.configDialog();
        if (theme) {
            await this._saveTheme(theme);
        }
    }

    async onEditThemeClick(event) {
        event.stopPropagation();
        const button = event.target.closest('a.button');

        const isClone = button.dataset.action === 'clone';

        const themeSelector = this.querySelector("#themeSelector");
        const selectedOption = themeSelector.options[themeSelector.selectedIndex];

        const css = { ...uniforge.theme.current, '--name': isClone ? '' : selectedOption.label };

        const theme = await ThemeDialog.configDialog(css, { isEdit: true, isClone: isClone });
        if (theme) {
            await this._saveTheme(theme, { isEdit: true });
        }
    }

    async onDeleteThemeClick(event) {
        event.stopPropagation();

        if (await Dialogs.confirm("Deletar Tema?", "Tem certeza que deseja deletar o tema selecionado?")) {
            const themeSelector = this.querySelector("#themeSelector");
            const selectedOption = themeSelector.options[themeSelector.selectedIndex];
            const name = themeSelector.value.toLowerCase().replaceAll(' ', '-').replaceAll('custom/', '').replaceAll('theme-', '');

            const url = uniforge.urls.customCSS;
            const fileName = name;

            const result = await uniforge.fs.deleteFile(`${url}/${fileName}`);
            if (result.sucess) {
                this.msgBox.showInfo(`Tema '${selectedOption.label}' deletado com sucesso.`);
                uniforge.theme.refresh('theme-neutral', 'css/themes.css');
                themeSelector.value = 'theme-neutral';
                themeSelector.dispatchEvent(new Event('change'));

                this.refresh();
            }
            else {
                this.msgBox.showError(`Erro ao deletar tema '${selectedOption.label}'. ${result.error}`);
            }
        }
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

        uniforge.settings.set('database.activeExternalCon', isChecked.toString());
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

    async _saveTheme(theme, options = { isEdit: false }) {
        try {
            const url = uniforge.urls.customCSS;
            const name = theme['--name'].replaceAll(' ', '-').toLowerCase();
            delete theme['--name'];

            const fileName = `${name}.css`;

            const data = `:root[data-theme=\"theme-${name}\"] {\n${Object.entries(theme).map(([key, value]) => {
                if (value.startsWith('var(') || value.startsWith('#') || key.includes("radius") || key.includes('--default-font')) return `${key}: ${value};`;
                else return `${key}: "${value}";`;
            }).join('\n')
                }}`;

            const result = await uniforge.fs.writeFile(url, fileName, data);
            if (result.sucess) {
                if (options.isEdit) this.msgBox.showInfo(`Tema '${name}' alterado com sucesso.`);
                else this.msgBox.showInfo(`Tema '${name}' criado com sucesso.`);

                uniforge.theme.refresh(`theme-${name}`, `css/custom/${fileName}`);
                this.refresh();
            }
            else {
                this.msgBox.showError(`Erro ao criar tema '${name}'. ${result.error}`);
            }
        }
        catch (error) {
            this.msgBox.showError(`Erro ao criar tema '${name}'. ${error.message}`, error);
        }
    }

    _loadCalendarData(calendar) {
        const calendarNameInput = this.querySelector('#calendarName');
        const calendarPrefixInput = this.querySelector('#calendarPrefix');
        const calendarSuffixPreInput = this.querySelector('#calendarSuffixPre');
        const calendarSuffixPosInput = this.querySelector('#calendarSuffixPos');

        calendarNameInput.value = calendar.label;
        calendarPrefixInput.value = calendar.prefix ?? '';

        if (calendar.suffix && !calendar.suffix.isEmpty()) {
            const suffix = calendar.suffix.split('|');
            if (suffix.length === 2) {
                calendarSuffixPreInput.value = suffix[0];
                calendarSuffixPosInput.value = suffix[1];
            } else throw new Error('O sufixo do calendário deve possuir apenas 2 elementos.');
        }

        const weekDays = calendar.days.toArray();
        const weekDaysItems = this.querySelectorAll('.calendar-week-days .week-day-item');

        weekDaysItems.forEach(item => {
            const idx = Number(item.dataset.idx);

            const dayNameInput = this.querySelector(`#day${idx + 1}Name`);
            dayNameInput.value = weekDays[idx].name;
            const dayShortNameInput = this.querySelector(`#day${idx + 1}ShortName`);
            dayShortNameInput.value = weekDays[idx].label;
        });

        const monthsList = this.querySelector('#monthsList');
        const months = calendar.months.toArray();
        months.forEach(month => {
            if (month.data.dbAction !== 'd') {
                const element = document.createElement('li');
                element.classList.add('item', 'month-item');
                element.dataset.clmid = month.clmid;

                const dataGroup = document.createElement('div');
                dataGroup.classList.add('data-complex', 'flexrow');

                const nameSpan = document.createElement('span');
                nameSpan.classList.add('data-label');
                nameSpan.textContent = month.label;

                const deleteButton = document.createElement('a');
                deleteButton.classList.add('delete-button', 'flexrow', 'hidden');
                deleteButton.dataset.tooltip = "Excluir Mês";
                deleteButton.innerHTML = `<i class="fas fa-trash"></i>`;

                const sizeGroup = document.createElement('div');
                sizeGroup.classList.add('data-group', 'flexcol');

                const sizeSpan = document.createElement('span');
                sizeSpan.classList.add('data-value', 'size');
                sizeSpan.textContent = month.size;

                const daysLabel = document.createElement('span');
                daysLabel.classList.add('days-label');
                daysLabel.textContent = 'Dias';

                sizeGroup.appendChild(sizeSpan);
                sizeGroup.appendChild(daysLabel);

                dataGroup.appendChild(nameSpan);
                dataGroup.appendChild(deleteButton);
                dataGroup.appendChild(sizeGroup);

                element.appendChild(dataGroup);
                monthsList.appendChild(element);

                element.addEventListener('click', (event) => { this.onMonthItemClick(event); });
                deleteButton.addEventListener('click', (event) => { this.onDeleteMonthClick(event); });
            }
        });

        const addMonthButton = this.querySelector('#addMonthButton');
        addMonthButton.classList.remove('disabled');

        const saveCalendarButton = this.querySelector('#saveCalendarButton');
        saveCalendarButton.classList.remove('disabled');

        this.selection.calendar = calendar;

        const fieldsets = this.querySelectorAll('.calendar-manager fieldset');
        fieldsets.forEach(fieldset => fieldset.disabled = false);
    }

    _clearCalendarData(disableFields = true) {
        const calendarNameInput = this.querySelector('#calendarName');
        const calendarPrefixInput = this.querySelector('#calendarPrefix');
        const calendarSuffixPreInput = this.querySelector('#calendarSuffixPre');
        const calendarSuffixPosInput = this.querySelector('#calendarSuffixPos');

        calendarNameInput.value = '';
        calendarPrefixInput.value = '';
        calendarSuffixPreInput.value = '';
        calendarSuffixPosInput.value = '';

        const weekDaysItems = this.querySelectorAll('.calendar-week-days .week-day-item');

        weekDaysItems.forEach(item => {
            const idx = Number(item.dataset.idx);

            const dayNameInput = this.querySelector(`#day${idx + 1}Name`);
            dayNameInput.value = '';
            const dayShortNameInput = this.querySelector(`#day${idx + 1}ShortName`);
            dayShortNameInput.value = '';
        });

        const monthsList = this.querySelector('#monthsList');
        monthsList.innerHTML = '';

        this._clearMonthData(disableFields);

        const calendarItems = this.querySelectorAll('.calendar-item');
        calendarItems.forEach(item => {
            item.classList.remove('selected');
        });

        const fieldsets = this.querySelectorAll('.calendar-manager fieldset');
        fieldsets.forEach(fieldset => fieldset.disabled = disableFields);

        const saveCalendarButton = this.querySelector('#saveCalendarButton');
        if (disableFields) saveCalendarButton.classList.add('disabled');
        else saveCalendarButton.classList.remove('disabled');

        this.selection.calendar = null;
    }
    _realoadCalendarData(calendar) {
        this._clearCalendarData(false);
        this._loadCalendarData(calendar);
    }

    _loadMonthData(month) {
        const monthNameInput = this.querySelector('#monthName');
        monthNameInput.value = month.label;

        this.sliders.monthSize.setValue(month.size);

        const addMonthButton = this.querySelector('#addMonthButton');
        addMonthButton.dataset.clmid = month.clmid;
    }
    _clearMonthData(disableButton = true) {
        const monthItems = this.querySelectorAll('.month-item');
        monthItems.forEach(item => {
            item.classList.remove('selected')

            const deleteButton = item.querySelector('a.delete-button');
            deleteButton.classList.add('hidden');

            const saveMonthButton = this.querySelector('#saveMonthButton');
            saveMonthButton.classList.add('hidden');
        });

        const monthNameInput = this.querySelector('#monthName');
        monthNameInput.value = '';

        this.sliders.monthSize.setValue(30);

        const addMonthButton = this.querySelector('#addMonthButton');
        delete addMonthButton.dataset.clmid;

        if (disableButton) addMonthButton.classList.add('disabled');
        else addMonthButton.classList.remove('disabled');

        const saveMonthButton = this.querySelector('#saveMonthButton');
        saveMonthButton.classList.add('hidden');
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