import { LinkTooltip } from "../../scripts/linkTooltip.js";
import TimelineForm from "./timelineForm.js";
import BaseForm from "./baseForm.js";

export default class ArticleForm extends BaseForm {
    constructor(data) {
        super(`Artigo - ${data.title}`);

        /**
        * @type {string} - Define o tipo do formulário.
        */
        this.type = 'article';

        /**
        * @type {string} - O modelo HTML utilizado pelo formulário.
        */
        this.template = 'articleForm'; // Define o template do formulário. 

        // Dados da Entrada vizualizada.
        this.entry = data;

        /**
        * @type {LinkTooltip} - O tooltip de links do Artigo.
        */
        this.tooltip = new LinkTooltip();
    }

    get defaultOptions() {
        const config = super.defaultOptions;
        return uniforge.utils.mergeObjects(config, {
            classes: [...config.classes]
        });
    }

    get content() {
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.html.app, 'text/html');
        const app = doc.body.firstChild;

        return app.querySelector('.content').innerHTML;
    }

    /**@inheritdoc */
    prepareData() {
        // Adiciona os dados da Entrada ao template.
        this.data.entry = this.prepareEntry();

        return this.data;
    }

    prepareEntry() {
        const entry = this.entry;

        const section = uniforge.doc.sections.get(entry.sid);
        const chapter = uniforge.doc.chapters.get(section.cid);

        entry.icon = chapter.icon;
        entry.text = this.#replaceLinkWithSpan(entry.htmlString);
        return entry;
    }

    /**@inheritdoc */
    configureContent() {}

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    activateListeners() {
        const tooltip = this.tooltip;

        this.addEventListener('mouseover', function (event) {
            const span = event.target.closest('span.linked-text');
            if (span) {
                tooltip._showLinkTooltip(event, span.dataset.entryId);
            } else {
                tooltip._hideLinkTooltip();
            }
        });
        this.addEventListener('mouseout', function () {
            tooltip._hideLinkTooltip();
        });

        const textContent = this.querySelector('.text-content');

        // Configura os links de todos os <span> do texto da Entrada
        const linkSpans = textContent.querySelectorAll('.linked-text');
        linkSpans.forEach(span => {
            span.addEventListener('click', (event) => { this.onLinkClick(event); });
        });
    }

    onLinkClick(event) {
        const span = event.target;
        const link = {
            id: span.dataset.id ?? null,
            type: span.dataset.type ?? null
        }

        let data = null;

        switch (link.type) {
            case 'entry':
                data = uniforge.doc.entries.get(link.id);
                this._showArticle(data);
                break;
            case 'timeline':
                data = uniforge.doc.timelines.get(link.id);
                this._showTimeline(data);
                break;
            default:
                break;
        }
    }

    async _showArticle(entry) {
        const articleForm = new ArticleForm(entry);
        articleForm.show(true);
    }

    async _showTimeline(timeline) {
        const timelineForm = new TimelineForm(timeline);
        timelineForm.show(true);
    }

    /**
    * Substitui os trechos que respeitem o padrão '@[entryId]{texto}' com um <span data-entry-id='entryId'>texto</span> em uma string HTML.
    *
    * @param {string} htmlString - A string HTML cujo conteúdo será alterado.
    * @returns {string} - A string HTML após as alterações.
    */
    #replaceLinkWithSpan(htmlString) {
        // Expressão regular para encontrar o padrão '@[id, type]{texto}'
        const regex = /@\[([a-zA-Z0-9\-]+),\s*([^\]]+)]\{([^}]+)\}/g;

        // Substitui os trechos encontrados pelo <span> correspondente
        const newHtmlString = htmlString.replace(regex, (match, id, type, text) => {
            let fullType = 'entry';
            if (type !== 'entry') fullType = 'timeline';

            return `<span class="linked-text" data-id='${id}' data-type='${fullType}'>${text}</span>`;
        });

        return newHtmlString;
    }
}