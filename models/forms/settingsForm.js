import BaseForm from "./baseForm.js";
import DBManager from "../../db/dbManager.js";

/**
  * Formulário de configurações do sistema.
  * @class
  * @extends BaseForm
  * 
  */
export class SettingsForm extends BaseForm {
    /**
      * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
      * @class
      * @extends BaseForm
      * 
      * @param {Object} overlay - O objeto overlay passado para a classe pai e utilizado para configurar esta instância.
      */
    constructor(overlay) {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super(overlay);

        /**
        * O objeto de manipulação do Banco de Dados.
        * @type {DBManager}
        */
        this.db = CONFIG.db;

        /**
         * Configura o conteúdo do formulário associado a esta instância.
         * @method configureContent
         * @param {HTMLElement} this.form - O elemento de formulário a ser configurado.
         */
        this.configureContent(this.form);
    }

    /**
   * Configura o conteúdo do formulário.
   * @param {HTMLElement} form - O elemento que representa o formulário.
   */
    configureContent(form) {
        super.configureContent(form);

        this.configureOptions(form);

        const executeProcButton = this.form.querySelector('#procedureButton');
        executeProcButton.addEventListener('click', (event) => { this.onExecuteProcClick(event); });

        const deleteTableButton = this.form.querySelector('#deleteTableButton');
        deleteTableButton.addEventListener('click', (event) => { this.onDeleteTableClick(event); });

        const queryButton = this.form.querySelector('#queryButton');
        queryButton.addEventListener('click', (event) => { this.onExecuteQuery(event); });

        // O panel padrão é sempre o panel de Banco de Dados
        const panel = this.form.querySelector(`#databasePanel`);
        this.configureDatabasePanel(panel);
    }

    /**
   * Configura o menu de opções do formulário.
   * @param {HTMLElement} form - O elemento que representa o formulário.
   */
    configureOptions(form) {
        const options = form.querySelector('.settings-options');
        const buttons = options.querySelectorAll('button');

        buttons.forEach(button => {
            button.addEventListener('click', (event) => { this.onOptionButtonClick(event); });
        });
    }

    /**
   * Configura o conteúdo da opção selecionada.
   * @param {HTMLElement} panel - O elemento que representa o panel carregado.
   */
    configurePanel(panel) {

        switch (panel.id) {
            case 'databasePanel': {
                this.configureDatabasePanel(panel);
            } break;
            case 'leafletPanel': {
                this.configureLeafletPanel(panel);
            } break;
            default: {
                this.msgBox.showError('Erro ao carregar panel: Id informado não foi encontrado.');
                return;
            }
        }

        panel.classList.remove('hidden');
    }

    /**
   * Configura o conteúdo do panel de Banco de Dados.
   * @param {HTMLElement} panel - O elemento que representa o panel carregado.
   */
    async configureDatabasePanel(panel) {
        const procedures = this.db.storedProcedures;
        const proceduresSelect = panel.querySelector('#procedureName');
        proceduresSelect.innerHTML = '';

        let emptyOption = document.createElement('option');
        emptyOption.innerHTML = '&#8212';
        proceduresSelect.appendChild(emptyOption);

        Object.values(procedures).forEach(proc => {
            const option = document.createElement('option');
            option.dataset.name = proc.name;
            option.textContent = CONFIG.utils.capitalizeFirstLetter(proc.name);

            proceduresSelect.appendChild(option);
        });

        const tables = await this.db.getAllTables();
        const allTablesSelect = panel.querySelector('#tableName');
        allTablesSelect.innerHTML = '';

        emptyOption = document.createElement('option');
        emptyOption.innerHTML = '&#8212';
        allTablesSelect.appendChild(emptyOption);

        tables.forEach(table => {
            const option = document.createElement('option');
            option.dataset.name = table.name;
            option.textContent = CONFIG.utils.capitalizeFirstLetter(table.name);

            allTablesSelect.appendChild(option);
        });        
    }
    /**
   * Configura o conteúdo do panel do módulo do Leaflet®.
   * @param {HTMLElement} panel - O elemento que representa o panel carregado.
   */
    configureLeafletPanel(panel) {
        console.log('Leaflet');
    }

    /**
   * Configura o event de click para os botões de opções do formulário.
   * @param {Event} event - O evento de click do botão.
   */
    onOptionButtonClick(event) {
        event.stopPropagation();
        const options = this.form.querySelector('.settings-options');
        const buttons = options.querySelectorAll('button');
        buttons.forEach(button => {
            let panel = this.form.querySelector(`#${button.dataset.panel}`);
            button.classList.remove('selected');
            panel.classList.add('hidden');
        });

        const selectedButton = event.target.closest('button');
        selectedButton.classList.add('selected');

        const selectedPanel = this.form.querySelector(`#${selectedButton.dataset.panel}`);
        this.configurePanel(selectedPanel);
    }

    /**
   * Configura o event de click para os botões de executar uma Stored Procedure
   * @param {Event} event - O evento de click do botão.
   */
    async onExecuteProcClick(event) {
        event.stopPropagation();
        const procedureNameSelect = this.form.querySelector('#procedureName');
        const selectedOption = procedureNameSelect.selectedOptions[0];
        const procedure = selectedOption.dataset.name;
        if (procedure) {  
            const result = await this.db.storedProcedures[procedure]();
            const selectedPanel = this.form.querySelector('#databasePanel');

            this.msgBox.showInfo(`Procedure '${procedure}' executada com sucesso. (${result.changes}) linhas alteradas.`);
            this.configurePanel(selectedPanel);
        }       
    }

    /**
   * Configura o event de click para os botões de exclusão de tabela.
   * @param {Event} event - O evento de click do botão.
   */
    async onDeleteTableClick(event) {
        event.stopPropagation();
        const tableNameSelect = this.form.querySelector('#tableName');
        const selectedOption = tableNameSelect.selectedOptions[0];
        const tableName = selectedOption.dataset.name;
        if (tableName) {            
            const result = await this.db.deleteTable(tableName);
            const selectedPanel = this.form.querySelector('#databasePanel');

            this.msgBox.showInfo(`Tabela '${tableName}' excluída com sucesso.`);
            this.configurePanel(selectedPanel);
        }
    }

    /**
   * Configura o event de click para os botões de executar uma query personalizada
   * @param {Event} event - O evento de click do botão.
   */
    async onExecuteQuery(event) {
        event.stopPropagation();
        const queryText = this.form.querySelector('#queryText');
        const query = queryText.value;
        if (query) {  
            const result = await this.db.execQuery(query);
            queryText.value = '';
            const selectedPanel = this.form.querySelector('#databasePanel');

            this.msgBox.showInfo(`Query executada com sucesso. (${result.changes}) linhas alteradas.`);
            this.configurePanel(selectedPanel);
        }       
    }
}