import CustomDate from "../../common/primitives/date.mjs";
import Dialogs from "../../models/dialogs/dialog.js";
import ArticleForm from "../../models/forms/articleForm.js";
import BaseForm from "../../models/forms/baseForm.js";
import SimpleEntryForm from "../../models/forms/simpleEntryForm.js";
import { BaseManager } from "./baseManager.js";
import { CodexManager } from "./codexManager.js";

export class TimelineManager extends BaseManager {
    constructor(form) {
        super(form);

        /**
         * @type {boolean} - Indica se o formulário atual corresponde a um do tipo ArticleForm.
         */
        this.formIsArticle = (form instanceof ArticleForm);
    }

    #timeline = {
        tid: '',
        title: '',
        flavor: '',
        events: new Set(),
        calendar: null
    };

    get timeline() {
        return this.#timeline;
    }

    get isNewTimeline() {
        return this.#timeline.tid.isEmpty();
    }

    loadTimeline(timeline) {
        this.#timeline = {
            tid: timeline.tid,
            title: timeline.title,
            flavor: timeline.flavor,
            events: new Set(),
            calendar: null
        };

        const events = timeline.events.toArray();
        events.forEach(event => {
            event.dbAction = '-',
                event.committed = true
        });

        this.#timeline.events = timeline.events;

        // Configura o calendário da linha do tempo, caso não tenha sido definido.
        if (events.length > 0) {
            const calendar = uniforge.doc.calendars.get(events[0].clid);
            this.#timeline.calendar = calendar ?? null;
        }

        this.buildTimeline();
    }

    async deleteTimeline() {
        try {
            const tid = this.#timeline.tid;
            if (!tid.isEmpty()) {
                await uniforge.db.beginTransaction();

                await uniforge.db.deleteTimeline(tid);

                const events = this.#timeline.events.toArray();
                for(let event of events) {
                    await this.deleteEvent(event._id);
                };                

                // Finaliza a transação de salvamento.
                await uniforge.db.commitTransaction();
                return true;
            } else {
                this.msgBox.showWarning("Nenhuma linha do tempo selecionada para remoção.");
                return false;
            }
        } catch (error) {
            uniforge.msgBox.showError('Erro ao remover linha do tempo.', error);

            // Faz rollback em caso de erro no processo de salvamento.
            await uniforge.db.rollbackTransaction(error);

            return false;
        }
    }

    async commit() {
        try {
            // Valida os dados da linha do tempo.
            let validation = uniforge.db.validateTimeline(this.#timeline);
            if (!validation.isEmpty()) {
                this.msgBox.showWarning(validation);
                return false;
            }

            // Inicia a transação de salvamento.
            await uniforge.db.beginTransaction();
            let result = null;

            // Verifica se se trata de uma nova linha do tempo ou uma já existente.
            //
            // Se for uma nova linha do tempo, adiciona-a ao banco de dados.
            // Se for uma linha do tempo já existente, atualiza-a no banco de dados.
            if (this.isNewTimeline) {
                result = await uniforge.db.addTimeline(this.#timeline);
                const tid = result.addedId;

                this.#timeline.tid = tid;
            } else {
                result = await uniforge.db.updateTimeline(this.#timeline);
            }

            const events = this.#timeline.events.toArray();
            events.forEach(async event => {
                if (event.dbAction === 'a') {
                    await this.insertEvent(event._id);
                } else if (event.dbAction === 'd') {
                    await this.deleteEvent(event._id);
                }
            });

            this.buildTimeline();
            // Finaliza a transação de salvamento.
            await uniforge.db.commitTransaction();

            return true;
        } catch (error) {
            uniforge.msgBox.showError('Erro ao manipular linha do tempo.', error);

            // Faz rollback em caso de erro no processo de salvamento.
            await uniforge.db.rollbackTransaction(error);

            return null;
        }
    }

    addEvent(newEvent) {
        const events = this.#timeline.events;

        // Verifica que o calendário do evento é o mesmo que o da linha do tempo. Se não for, aborta.
        if (this.#timeline.calendar && newEvent.clid !== this.#timeline.calendar.clid) {
            uniforge.msgBox.show('Erro', 'O evento não pode ser adicionado a linha do tempo, pois o calendário é diferente.', 'error');
            return;
        }

        // O evento já existe na linha do tempo.
        if (events.hasId(newEvent)) {
            const event = events.get(newEvent._id);
            // O Evento já está comitado ao banco de dados. Aborte.
            if (event.committed) {
                event.dbAction = '-';
                return;
            }
            // Marque o evento para inclusão no banco de dados.
            event.dbAction = 'a';
        } else {
            // O evento ainda não existe no banco de dados.
            newEvent.committed = false;
            // Marque o evento para inclusão no banco de dados.
            newEvent.dbAction = 'a';
            // Adicona o evento à lista de Eventos da linha do tempo. 
            // OBS.: Nem todo evento na lista está presente no banco de dados.
            events.add(newEvent);
        }

        // Verifica que o calendário do evento é o mesmo que o da linha do tempo.
        if (this.#timeline.calendar && newEvent.clid !== this.#timeline.calendar.clid) {
            uniforge.msgBox.show('Erro', 'O evento não pode ser adicionado a linha do tempo, pois o calendário é diferente.', 'error');
            return;
        }

        // Configura o calendário da linha do tempo, caso não tenha sido definido.
        if (events.size === 1) {
            const firstEvent = events.first();
            const calendar = uniforge.doc.calendars.get(firstEvent.clid);

            this.#timeline.calendar = calendar ?? null;
        }

        // Ordena os eventos por Data de Início.
        this.sortEvents();
    }
    removeEvent(evid) {
        const events = this.#timeline.events;

        // Verifica se o evento existe na linha do tempo.
        const event = events.get(evid);
        // Tentativa de remover um evento que não existe na linha do tempo. Aborte.
        if (!event) return;

        // Marque o evento para remoção do banco de dados.
        event.dbAction = 'd';

        // Verifica se a linha do tempo está vazia e remove o calendário.
        if (this.#timeline.events.length === 0) {
            this.#timeline.calendar = null;
        }
    }
    /**
     * Ordena os eventos da linha do tempo por Data de Início.
     * A ordenação é feita considerando o calendário da linha do tempo.
     * @return {void}
     */
    sortEvents() {
        this.#timeline.events = this.#timeline.events.sort((a, b) => {
            const calendar = this.#timeline.calendar;
            const startDateA = new CustomDate(calendar, { day: a.s_day, month: a.s_month, year: a.s_year });
            const startDateB = new CustomDate(calendar, { day: b.s_day, month: b.s_month, year: b.s_year });
            return startDateA.ticks - startDateB.ticks;
        });
    }
    async insertEvent(evid) {
        const tid = this.timeline.tid;
        if (!tid.isEmpty()) await uniforge.db.addTimelineEvent({ tid, evid });
    }
    async deleteEvent(evid) {
        const tid = this.timeline.tid;
        if (!tid.isEmpty()) {
            const result = await uniforge.db.deleteTimelineEvent(tid, evid);
            // Se o evento foi removido do banco de dados, reconstrua a base de dados.
            if (result?.changes > 0) await uniforge.db.rebuildDocs();
        }
    }
    hasEvent(evid) {
        const events = this.#timeline.events;
        const event = events.get(evid);
        if (!event || event.dbAction === 'd') return false;
        return true;
    }

    clear() {
        this.#timeline = {
            tid: '',
            title: '',
            flavor: '',
            events: new Set(),
            calendar: null
        };

        // Obtém o element do Container da Entrada
        const container = this.form.querySelector('#timelineViewer');
        // Limpa o conteúdo da Linha do Tempo.
        container.innerHTML = '';
    }

    buildTimeline() {
        // Obtém o element do Container da Entrada
        const container = this.form.querySelector('#timelineViewer');

        // Limpa o conteúdo do formulário.
        container.innerHTML = '';

        // Cria o conteúdo da Entrada.
        const content = this.#createContent();

        // Adiciona a nova Timeline ao container.
        container.appendChild(content);

        return container;
    }

    // Cria o conteúdo da Linha do Tempo que será atribuído a um Element
    #createContent() {
        const data = this.#timeline;
        const content = document.createElement('div');
        content.className = 'time-content flexcol';

        const titleHeader = document.createElement('div');
        titleHeader.className = 'title-header flexrow';

        const timelineTitle = document.createElement('p');
        timelineTitle.id = 'timelineTitle';
        timelineTitle.className = 'title';
        timelineTitle.textContent = data.title;

        titleHeader.appendChild(timelineTitle);

        const timelineContent = document.createElement('div');
        timelineContent.id = 'timelineContent';
        timelineContent.className = 'timeline-content flexcol';

        const timelineList = document.createElement('ul');
        timelineList.id = 'timelineList';
        timelineList.className = 'timeline-list';
        timelineList.dataset.id = data.tid;

        let isInverted = false;

        // Ordena os eventos por Data de Início.
        this.sortEvents();
        let events = data.events;

        // Preenche o form com todas as entradas da Timeline
        for (var event of events) {
            if (event.dbAction === 'd') continue; // Ignora eventos marcados para remoção.

            if (event.relevance !== 'external') {
                timelineList.appendChild(this.#newEventItem(event, isInverted));
            } else {
                timelineList.appendChild(this.#newExternalLink(event, isInverted));
            }

            isInverted = !isInverted;
        }

        timelineContent.appendChild(timelineList);

        // Adiciona evento para monitorar o scroll
        timelineContent.addEventListener('scroll', () => { this._onTimeContentScroll(); });

        content.appendChild(titleHeader);
        content.appendChild(this.#createTopBar());
        content.appendChild(timelineContent);

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
        li.dataset.id = data._id;
        li.classList.add('timeline-entry', `${data.relevance.value}`);
        if (isInverted) li.classList.add('inverted');

        // Criação do elemento <div> com classe "tl-circ"
        const tlCirc = document.createElement('div');
        tlCirc.classList.add('tl-circ', `${data.relevance.value}`);
        tlCirc.setAttribute('data-toggle', 'tooltip');
        tlCirc.setAttribute('title', entryType.title);
        li.appendChild(tlCirc);

        // Criação do elemento <div> com classe "timeline-panel"
        const timelinePanel = document.createElement('div');
        timelinePanel.className = 'timeline-panel';

        // Criação da seção tl-section
        const tlSection = document.createElement('div');
        tlSection.className = 'tl-section';

        // Criação da seção tl-heading
        const tlHeading = document.createElement('div');
        tlHeading.className = 'tl-heading';

        const headerIconDiv = document.createElement('div');
        headerIconDiv.className = 'header-icon';
        headerIconDiv.setAttribute('data-tooltip', entryType.title);
        if (isInverted) headerIconDiv.setAttribute('data-tooltip-left', '');
        const headerIcon = document.createElement('i');
        headerIcon.className = entryType.icon;
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
        if (data.source !== null && !data.source.isEmpty()) {
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

        // Montando tl-section
        tlSection.appendChild(tlHeading);
        tlSection.appendChild(tlBody);

        // Verifica se o evento possui uma Entrada associada a ele.
        // Se não houver, desabilita o botão de edição.
        if (data.source !== null && !data.source.isEmpty()) {
            const externalLink = this.#createExternalLink(data, true, isInverted);
            tlSection.appendChild(externalLink);
        }

        // Somente cria seção de botões se não for uma Entrada de Artigo.
        if (!this.formIsArticle) {
            const btnGroup = this.#createButtonGroup(data);
            timelinePanel.appendChild(btnGroup);
        }

        // Montando timeline-panel        
        timelinePanel.appendChild(tlSection);

        // Montando o elemento principal
        li.appendChild(timelinePanel);

        return li;
    }

    #newExternalLink(data, isInverted) {
        const linkTitle = 'Timeline Externa';

        // Criação do elemento <li>
        const li = document.createElement('li');
        li.classList.add('timeline-entry', `${data.relevance.value}`);
        if (isInverted) li.classList.add('inverted');

        // Criação do elemento <div> com classe "tl-circ"
        const tlCirc = document.createElement('div');
        tlCirc.classList.add('tl-circ', `${data.relevance.value}`);
        tlCirc.setAttribute('data-toggle', 'tooltip');
        tlCirc.setAttribute('title', linkTitle);
        li.appendChild(tlCirc);

        // Criação do elemento <div> com classe "timeline-panel"
        const timelinePanel = document.createElement('div');
        timelinePanel.className = 'timeline-panel';

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

        // Montando tl-section
        tlSection.appendChild(tlHeading);
        tlSection.appendChild(tlBody);

        // Verifica se o evento possui uma Entrada associada a ele.
        // Se não houver, desabilita o botão de edição.
        if (data.source !== null && !data.source.isEmpty()) {
            const externalLink = this.#createExternalLink(data, false, isInverted);
            tlSection.appendChild(externalLink);
        }


        // Somente cria seção de botões se não for uma Entrada de Artigo.
        if (!this.formIsArticle) {
            const btnGroup = this.#createButtonGroup(data);
            timelinePanel.appendChild(btnGroup);
        }

        // Montando timeline-panel        
        timelinePanel.appendChild(tlSection);

        // Montando o elemento principal
        li.appendChild(timelinePanel);

        return li;
    }

    #createExternalLink(data, isEntry = true, isInverted = false) {
        // Link externo
        const externalLink = document.createElement('div');
        externalLink.className = 'external-link';

        if (isEntry) {
            const externalAnchor = document.createElement('a');
            externalAnchor.className = 'anchor';
            externalAnchor.setAttribute('data-tooltip', 'Artigo Completo');
            if (!isInverted) externalAnchor.setAttribute('data-tooltip-side', 'right');

            externalAnchor.dataset.id = data.source;
            const externalIcon = document.createElement('i');
            externalIcon.className = 'fa-solid fa-arrow-up-right-from-square';
            externalAnchor.appendChild(externalIcon);
            externalLink.appendChild(externalAnchor);

            // Listener para abrir artigo completo da entrada.
            externalAnchor.addEventListener('click', (event) => { this._onEntryAnchorClick(event); });

        } else {
            const externalAnchor = document.createElement('a');
            externalAnchor.className = 'anchor';
            externalAnchor.setAttribute('data-tooltip', 'Timeline Externa');
            if (!isInverted) externalAnchor.setAttribute('data-tooltip-side', 'right');

            externalAnchor.dataset.id = data.source;
            const externalIcon = document.createElement('i');
            externalIcon.className = 'fa-solid fa-timeline';
            externalAnchor.appendChild(externalIcon);

            externalLink.appendChild(externalAnchor);
        }

        return externalLink;
    }

    #createButtonGroup(data) {
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

        editButton.addEventListener('click', (event) => { this._onEditEventClick(event); });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-xs confirmation';
        deleteButton.setAttribute('href', '#');
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-trash';
        deleteIcon.setAttribute('aria-hidden', 'true');
        deleteButton.appendChild(deleteIcon);

        deleteButton.addEventListener('click', (event) => { this._onDeleteEventClick(event); });

        // Verifica se o evento possui uma Entrada associada a ele.
        // Se não houver, desabilita o botão de edição.
        if (data.source === null || data.source.isEmpty()) {
            editButton.classList.add('disabled');
        }

        btnGroup.appendChild(editButton);
        btnGroup.appendChild(deleteButton);

        return btnGroup;
    }

    _onEntryAnchorClick(event) {
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();
        const a = event.target.closest('.anchor');
        const entryId = a.dataset.id;

        uniforge.navQueue.push(this);

        document.body.style.cursor = 'wait';
    }

    _onTimeContentScroll() {
        const timelineContent = this.form.querySelector('#timelineContent');
        const timelineTopBar = this.form.querySelector('#timelineTopBar');

        if (timelineContent.scrollTop > 100) {
            timelineTopBar.classList.remove('hidden'); // Mostra o botão
        } else {
            timelineTopBar.classList.add('hidden'); // Esconde o botão
        }
    }

    _onScrollToTopClick(event) {
        event.stopPropagation();
        const timelineContent = this.form.querySelector('#timelineContent');

        timelineContent.scrollTo({
            top: 0,
            behavior: 'smooth', // Suaviza o movimento do scroll
        });
    }

    _onEditEventClick(clickEvent) {
        clickEvent.stopPropagation();
        const button = clickEvent.target.closest('button');
        button.classList.add('disabled');

        const item = clickEvent.target.closest('li.timeline-entry');
        const evid = item.dataset.id;
        const event = uniforge.doc.events.get(evid);
        // Verifica se o evento existe.
        if (!event) {
            uniforge.msgBox.showError('Evento não encontrado.', new Error('Evento não encontrado.'));
            return;
        }

        const eid = event.source;
        const entry = uniforge.doc.entries.get(eid);
        const editForm = new SimpleEntryForm(button, entry);
        editForm.show(true);
    }
    async _onDeleteEventClick(event) {
        event.stopPropagation();
        if (await Dialogs.confirm('Remover Evento', 'Deseja remover o Evento?')) {
            const item = event.target.closest('li.timeline-entry');
            const evid = item.dataset.id;

            this.removeEvent(evid);
            await this.deleteEvent(evid);
            this.buildTimeline();
        }
    }
}