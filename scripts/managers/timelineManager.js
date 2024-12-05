import BaseForm from "../../models/forms/baseForm.js";
import { BaseManager } from "./baseManager.js";
import { LibraryManager, Entry } from "./libraryManager.js";
import { Database } from "../tempDB.js";

export class TimelineManager extends BaseManager {
    constructor(form) {
        super(form);

        this.subjectsTypes = this.getSubjects();
        this.timeline = null;
    }

    getTimeline(source) {
        // Obtém os dados da Entrada
        const data = Database.timelines[source];
        // Gera o objeto da Entrada
        this.timeline = new Timeline(data, this);

        return this.timeline;
    }
}

export class Timeline {
    constructor(data, manager) {
        this.msgBox = CONFIG.msgBox;
        this.tooltip = CONFIG.tooltip;

        this.manager = manager;
        this.form = manager.form;

        this.anchorManager = null;

        this.data = data;
        this.overlay = null;
    }

    // Atrela uma Entrada a um container para exibição
    addTo(targetId) {
        // Obtém o element do Container da Entrada
        const container = document.getElementById(targetId);         
        // Recupera o Overlay a que o container está inserido
        this.overlay = container.closest('.overlay');  
        
        // Cria o conteúdo da Entrada
        const content = this.#createContent(this.data);   

        // Limpa Form antes de adicionar nova Timeline
        this.form.clear(container);

        // Adiciona a nova Timeline ao container
        container.appendChild(content);

        this.manager._preLoadContent();

        return this.form;
    }

    // Cria o conteúdo da Linha do Tempo que será atribuído a um Element
    #createContent(data) {
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
        timelineList.dataset.id = data.timelineId;

        let isInverted = false;
        // Preenche o form com todas as entradas da Timeline
        for(var entry of data.entries) {
            if(entry.importance !== 'external') {
                timelineList.appendChild(this.#newEntryItem(entry, isInverted));
            } else {
                timelineList.appendChild(this.#newExternalLink(entry, isInverted));
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

    #createTopBar(){
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

    #newEntryItem(data, isInverted) {
        const subjectType = this.manager.subjectsTypes[data.type];

        // Criação do elemento <li>
        const li = document.createElement('li');        
        li.classList.add('timeline-entry', `${data.importance}`);
        if(isInverted) li.classList.add('inverted');

        // Criação do elemento <div> com classe "tl-circ"
        const tlCirc = document.createElement('div');
        tlCirc.classList.add('tl-circ',`${data.importance}`);
        tlCirc.setAttribute('data-toggle', 'tooltip');
        tlCirc.setAttribute('title', subjectType.title);
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
        headerIcon.className = subjectType.icon;
        headerIcon.setAttribute('alt', subjectType.title);
        headerIcon.setAttribute('title', subjectType.title);
        headerIconDiv.appendChild(headerIcon);

        const tlHeadingDate = document.createElement('div');
        tlHeadingDate.className = 'tl-heading-date';

        const dateDiv = document.createElement('div');
        dateDiv.className = 'date history-date';

        const historyYear = document.createElement('div');
        historyYear.className = 'history-year';
        const yearText = document.createElement('strong');
        yearText.textContent = data.date.y;
        historyYear.appendChild(yearText);

        const smallDate = document.createElement('small');
        const spanDate = document.createElement('span');
        const spanMonth = document.createElement('span');
        spanMonth.className = 'history-month';
        spanMonth.textContent = data.date.m;

        const spanDay = document.createElement('span');
        spanDay.className = 'history-day';
        spanDay.textContent = `, ${data.date.d}`;

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
        historyCategory.textContent = subjectType.title;

        historyHeaderSection.appendChild(historyTitle);
        historyHeaderSection.appendChild(historyCategory);

        tlHeading.appendChild(headerIconDiv);
        tlHeading.appendChild(tlHeadingDate);
        tlHeading.appendChild(historyHeaderSection);

        // Criação da seção tl-body
        const tlBody = document.createElement('div');
        tlBody.className = 'tl-body';

        const blockquote = document.createElement('blockquote');
        blockquote.className = 'flavortext';
        const blockquoteText = document.createElement('p');
        blockquoteText.className = 'flavortext';
        blockquoteText.textContent = data.flavor;
        blockquote.appendChild(blockquoteText);

        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        for(var row of data.text) {
            const p = document.createElement('p');
            p.textContent = row;

            rowDiv.appendChild(p);
        } 

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
        externalAnchor.dataset.id = data.entryId;
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
        li.classList.add('timeline-entry', `${data.importance}`);
        if(isInverted) li.classList.add('inverted');

        // Criação do elemento <div> com classe "tl-circ"
        const tlCirc = document.createElement('div');
        tlCirc.classList.add('tl-circ', `${data.importance}`);
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
        yearText.textContent = `${data.date.y}`;
        const smallDate = document.createElement('small');

        const spanMonth = document.createElement('span');
        spanMonth.className = 'history-month';
        spanMonth.textContent = `${data.date.m}`;

        const spanDay = document.createElement('span');
        spanDay.className = 'history-day';
        spanDay.textContent = `, ${data.date.d}`;

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
        for(var row of data.text) {
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
        externalAnchor.dataset.id = data.entryId;
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

        CONFIG.navQueue.push(this);

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