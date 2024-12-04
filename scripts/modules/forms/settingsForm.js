import { BaseForm } from "./baseForm.js";

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

        switch(panel.id) {
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
    configureDatabasePanel(panel) {
        
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
}