import BaseForm from './baseForm.js';

/**
  * Formulário das informações sobre o Sistema UniForge.
  * @class
  * @extends BaseForm
  * 
*/
export default class AboutForm extends BaseForm {
    /**
    * Construtor da classe AboutForm.
    * 
    * @class
    * @extends BaseForm 
    */
    constructor() {  
        // Chama o construtor da classe pai com o parâmetro overlay.
        super('Sobre', {
            height: '575px',
            width: '300px'
        });

        this.template = 'aboutForm'; // Define o template do formulário. 

        this.type = 'about'; // Define o tipo do formulário.

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
        this.data.versions = {
            node: uniforge.versions.node(),
            electron: uniforge.versions.electron(),
            app: await uniforge.versions.app()
        }

        this.data.author = 'Lucas Macedo';
        this.data.year = new Date().getFullYear();
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÃO

    /**
     * Configura o conteúdo do formulário.
     */
    async configureContent() {

    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS

    /**
    * Configura ouvintes de eventos básicos para o formulário.
    * @inheritdoc
    */
    activateListeners() {

    }
}