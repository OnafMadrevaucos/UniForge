import BaseDialog from "./baseDialog.js";

/**
 * Dialog para exibição de progresso.
 * Exibe barra de progresso, mensagem e percentuais.
 */
export default class ProgressDialog extends BaseDialog {
    /**
     * 
     * @param {Object} data 
     * @param {string} data.title            Título do dialog.
     * @param {string} data.message          Mensagem inicial.
     * @param {boolean} data.cancelable      Se deve exibir botão de cancelar.
     * @param {Function} data.onCancel       Função chamada ao cancelar.
     * @param {Function} data.onProgress     Função chamada ao atualizar progresso.
     * @param {Function} data.onComplete     Função chamada ao completar.
     * 
     * @param {Object} options 
     */
    constructor(dialogData = {}, options = {}) {
        const { title = "Executando...", message = "Aguarde...", indeterminate = false, cancelable = false } = dialogData;

        const buttons = cancelable
            ? {
                cancel: {
                    label: "Cancelar",
                    icon: "fas fa-ban",
                    className: "dialog-cancel",
                    callback: () => this._onCancel()
                }
            }
            : {};

        super(
            {
                title,
                buttons,
                message,
                indeterminate,
                cancelable,
                onCancel: dialogData.onCancel ?? null,
                onProgress: dialogData.onProgress ?? null,
                onComplete: dialogData.onComplete ?? null
            },
            uniforge.utils.mergeObjects(options, {
                height: '150px',
                width: '300px'
            })
        );

        /**
         * Progresso entre 0 e 100 por cento.
         * @type {number}
         */
        this.progress = 0;

        /**
         * Modo de progresso indeterminado.
         * @type {boolean}
        */
        this.indeterminate = dialogData.indeterminate ?? false;

        /**
         * Guarda conteúdo HTML gerado dinamicamente
         */
        this.template = 'progressDialog';

        this._completed = false;
    }

    /* -------------------------------------------------------------------------------------------- */
    // Rendering
    /* -------------------------------------------------------------------------------------------- */

    prepareData() {
        this.data.progress = this.progress;
    }

    async refreshDerivedTemplate() {
        try {
            this.data.progress = this.progress;

            await super.refreshDerivedTemplate();
        } catch (error) {
            this._onCancel(error);
        }
    }

    /* -------------------------------------------------------------------------------------------- */
    // Events Handlers
    /* -------------------------------------------------------------------------------------------- */
    /**@inheritdoc */
    _onCloseClick(event) {
        event.preventDefault();
        event.stopPropagation();

        this._onCancel();

        // Se não for sempre fechar, chama o super.
        if (!this.alwaysClose) super._onCloseClick(event);
    }

    _onCancel(error = null) {
        if (this.data.onCancel) {
            this.data.onCancel(this, error);

            if (this.alwaysClose) this.close();
        }
    }

    /* -------------------------------------------------------------------------------------------- */
    // PROGRESS API
    /* -------------------------------------------------------------------------------------------- */

    /**
     * Atualiza o progresso do dialog.
     * 
     * @param {number} value   Percentual entre 0 e 100
     * @param {string} message Mensagem opcional
     */
    async updateProgress(data, message = null) {
        if (this._completed) return;

        this.progress = data.value;

        if (this.indeterminate) {
            // Se estiver indeterminado, ignora valores numéricos
            if (message !== null) {
                this.data.message = message;
                await this.refreshDerivedTemplate();
            }
            return;
        }

        if (data.value < 0) data.value = 0;
        if (data.value > 100) data.value = 100;

        if (message !== null) {
            this.data.message = message;
        }

        await this.refreshDerivedTemplate();

        if (this.data.onProgress) {
            this.data.onProgress(this.progress, this);
        }

        // Finalizado
        if (this.progress >= 100 && !this._completed) {
            this._completed = true;

            if (this.data.onComplete) {
                this.data.onComplete(this);
            }
        }
    }

    /**
     * Recomeça o progresso do dialog.
     */
    async resetProgress() {
        this.progress = 0;
        this._completed = false;

        await this.updateProgress({ value: 0 });
    }

    /**
     * Atualiza apenas a mensagem.
     */
    async updateMessage(message) {
        this.data.message = message;
        await this.refreshDerivedTemplate();
    }
}
