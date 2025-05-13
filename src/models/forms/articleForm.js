import { LinkTooltip } from "../../scripts/linkTooltip.js";
import TimelineForm from "./timelineForm.js";
import BaseForm from "./baseForm.js";
import { TimelineManager } from "../../scripts/managers/timelineManager.js";

export default class ArticleForm extends BaseForm {
    constructor(data, isTimeline = false) {
        super(`Artigo - ${data.title}`, {
            width: '50vw'
        });

        /**
        * @type {string} - Define o tipo do formulário.
        */
        this.type = 'article';

        /**
        * @type {string} - O modelo HTML utilizado pelo formulário.
        */
        this.template = 'articleForm'; // Define o template do formulário. 

        /**
        * @type {boolean} - Indica se o formulário representa uma Timeline.
        */
        this.isTimeline = isTimeline;

        // Dados da Entrada vizualizada.
        this.entry = data;

        /**
        * @type {LinkTooltip} - O tooltip de links do Artigo.
        */
        this.tooltip = new LinkTooltip();

        this.timeManager = new TimelineManager(this);
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

        // Define o icone e o texto da Entrada (se não for uma Timeline).
        if (!this.isTimeline) {
            const section = uniforge.doc.sections.get(entry.sid);
            const chapter = uniforge.doc.chapters.get(section.cid);

            entry.icon = chapter.icon;
            entry.text = this.#replaceLinkWithSpan(entry.htmlString);
        }

        return entry;
    }

    async prepareDerivedTemplate(form, header, main) {
        await super.prepareDerivedTemplate(form, header, main);

        const content = main.querySelector('.content');
        content.innerHTML = '';

        if (this.isTimeline) {
            const viewer = form.querySelector('#viewer');
            viewer.classList.add('timeline');

            content.classList.add('flexcol');

            const timelineViewer = document.createElement('div');
            timelineViewer.id = 'timelineViewer';
            timelineViewer.classList.add('main-viewer', 'time-container', 'flex-1');
            content.appendChild(timelineViewer);
        } else {
            content.classList.add('main-viewer');

            const titleHeader = document.createElement('div');
            titleHeader.classList.add('title-header', 'flexrow');

            const title = document.createElement('p');
            title.classList.add('title');
            title.textContent = this.entry.title;

            const typeIcon = document.createElement('a');
            typeIcon.classList.add('type-icon');
            typeIcon.innerHTML = `<i class="fas ${this.entry.icon}"></i>`;

            titleHeader.appendChild(title);
            titleHeader.appendChild(typeIcon);

            const textContent = document.createElement('div');
            textContent.classList.add('text-content', 'flexcol');
            textContent.innerHTML = this.entry.text;

            content.appendChild(titleHeader);
            content.appendChild(textContent);
        }
    }

    /**@inheritdoc */
    configureContent() {
        if(this.isTimeline) this.timeManager.loadTimeline(this.entry);
     }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    activateListeners() {
        if (!this.isTimeline) {
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
        const timelineForm = new ArticleForm(timeline, true);
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
            return `<span class="linked-text" data-id='${id}' data-type='${type}'>${text}</span>`;
        });

        return newHtmlString;
    }
}