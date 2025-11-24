import ArticleForm from "../../models/forms/articleForm.js";
import { LinkTooltip } from "../linkTooltip.js";
import { BaseManager } from "./baseManager.js";

export class CodexManager extends BaseManager {
    constructor(form) {
        super(form);

        /**
        * @type {LinkTooltip} - O tooltip de links do Artigo.
        */
        this.tooltip = new LinkTooltip();
    }

    #entry = null; // Entrada atual.

    /**
     * Retorna o elemento HTML do visualizador de Entradas.
     * @type {HTMLElement} - O elemento HTML do visualizador de Entradas.
     */
    get viewer() {
        return document.getElementById('entryViewer');
    }

    /**
     * Retorna a Entrada atual que está sendo gerenciada.
     * @type {Entry|null} - A Entrada atual, ou null se nenhuma Entrada estiver sendo gerenciada.
    */
    get entry() {
        return this.#entry;
    }

    /**
     * Carrega a Entrada no formulário.
     * @param {Entry} entry - Entrada a ser carregada.
    */
    async loadEntry(entry) {
        // Gera o objeto da Entrada.
        this.#entry = entry;

        await this.buildView();

        this.configureLinks();
    }

    /**
     * Carrega o conteúdo da Entrada no elemento do Container da Entrada.
     * 
     * @returns {Element} - O elemento do Container da Entrada.
     * @async
    */
    async buildView() {
        try {
            // Obtém o element do Container da Entrada
            const container = this.viewer;

            // Verifica se o container existe.
            if (!container) throw new Error('Vizualizador da Entrada não encontrado.');

            // Limpa o conteúdo do vizualizador da Entrada.
            container.innerHTML = '';

            // Instancia o formulário da Entrada.
            const article = new ArticleForm(this.#entry);

            // Renderiza o formulário da Entrada.
            await article.render();

            // Carrega o conteúdo da Entrada.
            const content = article.content;

            // Adiciona a Entrada ao container.
            container.innerHTML = content;

            // Armazena o formulário da Entrada.
            this.article = article;

            return container;
        } catch (error) {
            this.msgBox.showError(error.message, error);
        }
    }

    async clearView() {
        // Limpa o objeto da Entrada.
        this.#entry = null;

        // Obtém o element do Container da Entrada
        const container = this.viewer;

        // Verifica se o container existe.
        if (!container) throw new Error('Vizualizador da Entrada não encontrado.');

        // Limpa o conteúdo do vizualizador da Entrada.
        container.innerHTML = '';
    }

    configureLinks() {
        this.configureTooltip();
        this.configureSpan();
    }

    /**
     * Configura o evento de mouseover e mouseout para exibir tooltips nos links
     * de Entradas no formulário.
     * 
     * @listens mouseover
     * @listens mouseout
     */
    configureTooltip() {
        const tooltip = this.tooltip;

        this.form.addEventListener('mouseover', function (event) {
            const span = event.target.closest('span.linked-text');
            if (span) {
                tooltip._showLinkTooltip(event, span.dataset.entryId);
            } else {
                tooltip._hideLinkTooltip();
            }
        });
        this.form.addEventListener('mouseout', function () {
            tooltip._hideLinkTooltip();
        });
    }

    configureSpan() {
        const textContent = this.viewer.querySelector('.text-content');

        // Configura os links de todos os <span> do texto da Entrada
        const linkSpans = textContent.querySelectorAll('.linked-text');
        linkSpans.forEach(span => {
            span.addEventListener('click', (event) => { this.article.onLinkClick(event); });
        });
    }
}