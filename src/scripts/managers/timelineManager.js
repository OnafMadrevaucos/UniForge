import CustomDate from "../../common/primitives/date.mjs";
import BaseForm from "../../models/forms/baseForm.js";
import { BaseManager } from "./baseManager.js";
import { LibraryManager, Entry } from "./libraryManager.js";

export class TimelineManager extends BaseManager {
    constructor(form) {
        super(form);
    }

    #timeline = {
        tid: '',
        title: '',
        flavor: '',
        events: [],
        calendar: null
    };

    get timeline() {
        return this.#timeline;
    }

    loadTimeline(timeline) {        
        this.#timeline = {
            tid: timeline.tid,
            title: timeline.title,
            flavor: timeline.flavor,
            events: timeline.events.toObject(),
            calendar: null
        };
        const events = this.#timeline.events;

        // Configura o calendário da linha do tempo, caso não tenha sido definido.
        if(events.length > 0) {
            const calendar = uniforge.doc.calendars.get(events[0].clid);
            this.#timeline.calendar = calendar ?? null;
        }

        this.buildTimeline();
    }

    addEvent(event) {
        const events = this.#timeline.events;
        // Configura o calendário da linha do tempo, caso não tenha sido definido.
        if(events.length === 0) {
            const calendar = uniforge.doc.calendars.get(event.clid);
            this.#timeline.calendar = calendar ?? null;
        }

        // Verifica que o calendário do evento é o mesmo que o da linha do tempo.
        if(event.clid !== this.#timeline.calendar.clid) {
            uniforge.msgBox.show('Erro', 'O evento não pode ser adicionado a linha do tempo, pois o calendário é diferente.', 'error');
            return;
        }

        events.push(event);
        // Ordena os eventos por ano de Início.
        events.sort((a, b) => {
            const calendar = this.#timeline.calendar;
            const startDateA = new CustomDate(calendar, { day: a.s_day, month: a.s_month, year: a.s_year });
            const startDateB = new CustomDate(calendar, { day: b.s_day, month: b.s_month, year: b.s_year });
            return startDateA.ticks - startDateB.ticks;
        });
    }
    removeEvent(event) {
        const index = this.#timeline.events.findIndex(e => e._id == event._id);
        this.#timeline.events.splice(index, 1);

        // Verifica se a linha do tempo está vazia e remove o calendário.
        if(this.#timeline.events.length === 0) {
            this.#timeline.calendar = null;
        }
    }

    async save() {
        await uniforge.db.addTimeline(this.#timeline);
        this.buildTimeline();
    }
    clear() {
        this.#timeline = {
            tid: '',
            title: '',
            flavor: '',
            events: [],
            calendar: null
        };

        // Obtém o element do Container da Entrada
        const container = document.getElementById('timelineViewer');
        // Limpa o conteúdo da Linha do Tempo.
        container.innerHTML = '';
    }

    buildTimeline() {
        // Obtém o element do Container da Entrada
        const container = document.getElementById('timelineViewer');

        // Limpa o conteúdo do formulário.
        container.innerHTML = '';

        // Cria o conteúdo da Entrada
        const content = this.#createContent();

        // Adiciona a nova Timeline ao container
        container.appendChild(content);

        return container;
    }

    // Cria o conteúdo da Linha do Tempo que será atribuído a um Element
    #createContent() {
        const data = this.timeline;
        const content = document.createElement('div');
        content.className = 'content flexcol';

        const titleHeader = document.createElement('div');
        titleHeader.className = 'title-header flexrow';

        const timelineTitle = document.createElement('p');
        timelineTitle.id = 'timelineTitle';
        timelineTitle.className = 'title';
        timelineTitle.textContent = data.title;

        titleHeader.appendChild(timelineTitle);

        const timeContent = document.createElement('div');
        timeContent.className = 'time-content flexcol';

        const timelineList = document.createElement('ul');
        timelineList.id = 'timelineList';
        timelineList.className = 'timeline-list';
        timelineList.dataset.id = data.tid;

        let isInverted = false;
        // Preenche o form com todas as entradas da Timeline
        for (var event of data.events) {
            if (event.importance !== 'external') {
                timelineList.appendChild(this.#newEventItem(event, isInverted));
            } else {
                timelineList.appendChild(this.#newExternalLink(event, isInverted));
            }

            isInverted = !isInverted;
        }

        timeContent.appendChild(timelineList);

        // Adiciona evento para monitorar o scroll
        timeContent.addEventListener('scroll', () => { this._onTimeContentScroll(); });

        content.appendChild(titleHeader);
        content.appendChild(this.#createTopBar());
        content.appendChild(timeContent);

        return content;
    }

    #createTopBar() {
        const timelineTopBar = document.createElement('div');
        timelineTopBar.id = 'timelineTopBar';
        timelineTopBar.className = 'timeline-topbar flexcol hidden';

        const scrollToTopButton = document.createElement('button');
        scrollToTopButton.id = 'scrollToTopButton';
        scrollToTopButton.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
        scrollToTopButton.setAttribute('data-tooltip', 'Voltar ao topo...');
        scrollToTopButton.setAttribute('data-tooltip-center', '');

        scrollToTopButton.addEventListener('click', (event) => { this._onScrollToTopClick(event); });

        timelineTopBar.appendChild(scrollToTopButton);
        //timelineTopBar.appendChild(scrollToTopLabel);

        return timelineTopBar;
    }

    #newEventItem(data, isInverted) {
        const entryType = uniforge.doc.entryTypes.get(Number(data.etid));

        // Criação do elemento <li>
        const li = document.createElement('li');
        li.classList.add('timeline-entry', `${data.relevance}`);
        if (isInverted) li.classList.add('inverted');

        // Criação do elemento <div> com classe "tl-circ"
        const tlCirc = document.createElement('div');
        tlCirc.classList.add('tl-circ', `${data.relevance}`);
        tlCirc.setAttribute('data-toggle', 'tooltip');
        tlCirc.setAttribute('title', entryType.title);
        li.appendChild(tlCirc);

        // Criação do elemento <div> com classe "timeline-panel"
        const timelinePanel = document.createElement('div');
        timelinePanel.className = 'timeline-panel';

        // Criação da seção de botões
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group-hover';

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-primary btn-xs';
        editButton.setAttribute('href', '#');
        const editIcon = document.createElement('i');
        editIcon.className = 'fas fa-pencil';
        editIcon.setAttribute('aria-hidden', 'true');
        editButton.appendChild(editIcon);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-xs confirmation';
        deleteButton.setAttribute('href', '#');
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-trash';
        deleteIcon.setAttribute('aria-hidden', 'true');
        deleteButton.appendChild(deleteIcon);

        btnGroup.appendChild(editButton);
        btnGroup.appendChild(deleteButton);

        // Criação da seção tl-section
        const tlSection = document.createElement('div');
        tlSection.className = 'tl-section';

        // Criação da seção tl-heading
        const tlHeading = document.createElement('div');
        tlHeading.className = 'tl-heading';

        const headerIconDiv = document.createElement('div');
        headerIconDiv.className = 'header-icon';
        const headerIcon = document.createElement('i');
        headerIcon.className = entryType.icon;
        headerIcon.setAttribute('alt', entryType.title);
        headerIcon.setAttribute('title', entryType.title);
        headerIconDiv.appendChild(headerIcon);

        const tlHeadingDate = document.createElement('div');
        tlHeadingDate.className = 'tl-heading-date';

        const dateDiv = document.createElement('div');
        dateDiv.className = 'date history-date';

        const historyYear = document.createElement('div');
        historyYear.className = 'history-year';
        const yearText = document.createElement('strong');
        yearText.textContent = (data.s_year < 0 ? `${Math.abs(data.s_year)} a.T.` : `${data.s_year} d.T.`);
        historyYear.appendChild(yearText);

        const calendar = uniforge.doc.calendars.get(data.clid);
        const smallDate = document.createElement('small');
        const spanDate = document.createElement('span');
        const spanMonth = document.createElement('span');
        spanMonth.className = 'history-month';
        spanMonth.textContent = calendar.months[data.s_month];

        const spanDay = document.createElement('span');
        spanDay.className = 'history-day';
        spanDay.textContent = `, ${data.s_day}`;

        spanDate.appendChild(spanMonth);
        spanDate.appendChild(spanDay);
        smallDate.appendChild(spanDate);

        dateDiv.appendChild(historyYear);
        dateDiv.appendChild(document.createElement('br'));
        dateDiv.appendChild(smallDate);

        const hr = document.createElement('hr');
        tlHeadingDate.appendChild(dateDiv);
        tlHeadingDate.appendChild(hr);

        const historyHeaderSection = document.createElement('div');
        historyHeaderSection.className = 'history-header-section flexcol';

        const historyTitle = document.createElement('h3');
        historyTitle.className = 'history-title';
        historyTitle.textContent = data.title;

        const historyCategory = document.createElement('span');
        historyCategory.className = 'history-category';
        historyCategory.textContent = entryType.title;

        historyHeaderSection.appendChild(historyTitle);
        historyHeaderSection.appendChild(historyCategory);

        tlHeading.appendChild(headerIconDiv);
        tlHeading.appendChild(tlHeadingDate);
        tlHeading.appendChild(historyHeaderSection);

        // Criação da seção tl-body
        const tlBody = document.createElement('div');
        tlBody.className = 'tl-body';

        const blockquote = document.createElement('blockquote');
        if (!data.source.isEmpty()) {
            const source = uniforge.doc.entries.get(data.source);
            if (source) {                
                blockquote.className = 'flavortext';
                const blockquoteText = document.createElement('p');
                blockquoteText.className = 'flavortext';
                blockquoteText.textContent = source.flavor.replace(/<[^>]+>/g, '');
                blockquote.appendChild(blockquoteText);
            }
        } else 
            blockquote.className = 'flavortext hidden';

        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        rowDiv.innerHTML = data.flavor;

        const historyTimelines = document.createElement('div');
        historyTimelines.className = 'history-timelines';

        tlBody.appendChild(blockquote);
        tlBody.appendChild(rowDiv);
        tlBody.appendChild(historyTimelines);

        // Link externo
        const externalLink = document.createElement('div');
        externalLink.className = 'external-link';

        const externalAnchor = document.createElement('a');
        externalAnchor.className = 'anchor';
        externalAnchor.setAttribute('data-tooltip', 'Artigo Completo');
        externalAnchor.dataset.id = data.source;
        const externalIcon = document.createElement('i');
        externalIcon.className = 'fa-solid fa-arrow-up-right-from-square';
        externalAnchor.appendChild(externalIcon);
        externalLink.appendChild(externalAnchor);

        // Listener para abrir artigo completo da entrada.
        externalAnchor.addEventListener('click', (event) => { this._onEntryAnchorClick(event); });

        // Montando tl-section
        tlSection.appendChild(tlHeading);
        tlSection.appendChild(tlBody);
        tlSection.appendChild(externalLink);

        // Montando timeline-panel
        timelinePanel.appendChild(btnGroup);
        timelinePanel.appendChild(tlSection);

        // Montando o elemento principal
        li.appendChild(timelinePanel);

        return li;
    }

    #newExternalLink(data, isInverted) {
        const linkTitle = 'Timeline Externa';

        // Criação do elemento <li>
        const li = document.createElement('li');
        li.classList.add('timeline-entry', `${data.relevance}`);
        if (isInverted) li.classList.add('inverted');

        // Criação do elemento <div> com classe "tl-circ"
        const tlCirc = document.createElement('div');
        tlCirc.classList.add('tl-circ', `${data.relevance}`);
        tlCirc.setAttribute('data-toggle', 'tooltip');
        tlCirc.setAttribute('title', linkTitle);
        li.appendChild(tlCirc);

        // Criação do elemento <div> com classe "timeline-panel"
        const timelinePanel = document.createElement('div');
        timelinePanel.className = 'timeline-panel';

        // Criação da seção de botões
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group-hover';

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-primary btn-xs';
        editButton.setAttribute('href', '#');
        const editIcon = document.createElement('i');
        editIcon.className = 'fas fa-pencil';
        editIcon.setAttribute('aria-hidden', 'true');
        editButton.appendChild(editIcon);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-xs confirmation';
        deleteButton.setAttribute('href', '#');
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-trash';
        deleteIcon.setAttribute('aria-hidden', 'true');
        deleteButton.appendChild(deleteIcon);

        btnGroup.appendChild(editButton);
        btnGroup.appendChild(deleteButton);

        // Criação da seção tl-section
        const tlSection = document.createElement('div');
        tlSection.className = 'tl-section';

        // Criação da seção tl-heading
        const tlHeading = document.createElement('div');
        tlHeading.className = 'tl-heading';

        const historyHeaderSection = document.createElement('div');
        historyHeaderSection.className = 'history-header-section flexcol';

        const historyTitle = document.createElement('h3');
        historyTitle.className = 'history-title';
        historyTitle.textContent = data.title;

        historyHeaderSection.appendChild(historyTitle);

        const tlHeadingDate = document.createElement('div');
        tlHeadingDate.className = 'tl-heading-date';

        const dateDiv = document.createElement('div');
        dateDiv.className = 'date history-date';

        const historyYear = document.createElement('div');
        historyYear.className = 'history-year';

        const yearText = document.createElement('strong');
        yearText.textContent = `${data.s_year}`;
        const smallDate = document.createElement('small');

        const spanMonth = document.createElement('span');
        spanMonth.className = 'history-month';
        spanMonth.textContent = `${data.s_month}`;

        const spanDay = document.createElement('span');
        spanDay.className = 'history-day';
        spanDay.textContent = `, ${data.s_day}`;

        smallDate.appendChild(spanMonth);
        smallDate.appendChild(document.createTextNode(' ')); // Espaço
        smallDate.appendChild(spanDay);

        historyYear.appendChild(yearText);
        historyYear.appendChild(document.createTextNode(' - ')); // Hífen
        historyYear.appendChild(smallDate);

        dateDiv.appendChild(historyYear);

        const hr = document.createElement('hr');
        tlHeadingDate.appendChild(dateDiv);
        tlHeadingDate.appendChild(hr);

        tlHeading.appendChild(historyHeaderSection);
        tlHeading.appendChild(tlHeadingDate);

        // Criação da seção tl-body
        const tlBody = document.createElement('div');
        tlBody.className = 'tl-body';

        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';
        for (var row of data.flavor) {
            const p = document.createElement('p');
            p.textContent = row;

            rowDiv.appendChild(p);
        }

        const historyTimelines = document.createElement('div');
        historyTimelines.className = 'history-timelines';

        tlBody.appendChild(rowDiv);
        tlBody.appendChild(historyTimelines);

        // Link externo
        const externalLink = document.createElement('div');
        externalLink.className = 'external-link';

        const externalAnchor = document.createElement('a');
        externalAnchor.className = 'anchor';
        externalAnchor.setAttribute('data-tooltip', 'Timeline Externa');
        externalAnchor.dataset.id = data.source;
        const externalIcon = document.createElement('i');
        externalIcon.className = 'fa-solid fa-timeline';
        externalAnchor.appendChild(externalIcon);

        externalLink.appendChild(externalAnchor);

        // Montando tl-section
        tlSection.appendChild(tlHeading);
        tlSection.appendChild(tlBody);
        tlSection.appendChild(externalLink);

        // Montando timeline-panel
        timelinePanel.appendChild(btnGroup);
        timelinePanel.appendChild(tlSection);

        // Montando o elemento principal
        li.appendChild(timelinePanel);

        return li;
    }

    _onEntryAnchorClick(event) {
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();
        const a = event.target.closest('.anchor');
        const entryId = a.dataset.id;

        uniforge.navQueue.push(this);

        document.body.style.cursor = 'wait';
        const overlay = document.getElementById('entryFormOverlay');
        const form = new BaseForm(overlay);
        this.anchorManager = new LibraryManager(form);

        this.entry = this.anchorManager.getEntry(entryId);

        const newForm = this.entry.addTo('entryFormContent', true);
        newForm.ui.prev_btn.setAttribute('data-tooltip', this.entry._getQueueText());
        newForm.ui.prev_btn.classList.remove('invisible');

        newForm.showForm();
        document.body.style.cursor = 'default';
    }

    _onTimeContentScroll() {
        const timeContent = this.overlay.querySelector('.time-content');
        const timelineTopBar = this.overlay.querySelector('#timelineTopBar');

        if (timeContent.scrollTop > 100) {
            timelineTopBar.classList.remove('hidden'); // Mostra o botão
        } else {
            timelineTopBar.classList.add('hidden'); // Esconde o botão
        }
    }

    _onScrollToTopClick(event) {
        event.stopPropagation();
        const timeContent = this.overlay.querySelector('.time-content');

        timeContent.scrollTo({
            top: 0,
            behavior: 'smooth', // Suaviza o movimento do scroll
        });
    }
}