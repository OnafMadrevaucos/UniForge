import BaseForm from "../../models/forms/baseForm.js";
import { BaseManager } from "./baseManager.js";
import { Database } from "../tempDB.js";

export class LibraryManager extends BaseManager {
    constructor(form) {
        super(form);
        this.entry = null; // Entrada atual               
    }

    //lastEntry(pop=false) { return (pop ? this.entry.pop() : this.entry[this.entry.length-1]); }

    // Gera uma entrada para ser atribuída a um Form
    getEntry(source) { 
        // Obtém os dados da Entrada
        const data = Database.entries[source];
        // Gera o objeto da Entrada
        this.entry = new Entry(data, this);

        // Registra a nova Entrada na fila de entradas para navegação
        CONFIG.navQueue.push(this.entry); 
        return this.entry;
    }
}

// Objeto da responsável por manipular qualquer Entrada.
export class Entry {
    constructor(data, manager) {
        this.msgBox = CONFIG.msgBox;
        this.tooltip = CONFIG.tooltip;

        this.manager = manager;
        this.form = manager.form;

        this.data = data;
        this.overlay = null;
    }

    // Atrela uma Entrada a um container para exibição
    addTo(targetId, hasNav=true) {
        // Obtém o element do Container da Entrada
        const container = document.getElementById(targetId);         
        // Recupera o Overlay a que o container está inserido
        this.overlay = container.closest('.overlay');
        
        // Cria o conteúdo da Entrada
        const content = this.#createContent(this.data);   
        
        // Configura o evento de fechamento da Entrada
        const closeButton = this.overlay.querySelector('.close-button');
        closeButton.addEventListener('click', (event) => { this._onCloseClick(event); });

        const previousButton = content.querySelector('#prevEntryButton');
        if(hasNav) {            
            previousButton.addEventListener('click', () => { this._onPreviousClick(); });
        } else {
            previousButton.className = 'prev-entry disabled';
        }
        this.form.ui.prev_btn = previousButton;

        // Limpa container antes de adicionar nova Entrada
        this.form.clear(container);

        // Adiciona a nova Entrada ao container
        container.appendChild(content);  
        
        // Configura o tooltip dos links da Entrada
        this._configureTooltip(this.form.ui.form);  

        this.manager._preLoadContent();

        return this.form;
    }

    // Cria o conteúdo da Entrada que será atribuído a um Element
    #createContent(data) {
        const content = document.createElement('div');
        content.className = 'content';

        const titleHeader = document.createElement('div');
        titleHeader.className = 'title-header flexrow';

        const prevEntryButton = document.createElement('button');
        prevEntryButton.id = 'prevEntryButton';
        prevEntryButton.className = 'prev-entry invisible';
        prevEntryButton.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';        

        const titleParagraph = document.createElement('p');
        titleParagraph.className = 'title';
        titleParagraph.textContent = data.title;

        const entryTypeIcon = document.createElement('a');
        entryTypeIcon.className = 'type-icon';
        entryTypeIcon.innerHTML = data.icon;

        titleHeader.appendChild(prevEntryButton);
        titleHeader.appendChild(titleParagraph);
        titleHeader.appendChild(entryTypeIcon);

        const entryContent = document.createElement('div');
        entryContent.className = 'text-content';
        entryContent.innerHTML = data.htmlString;

        // Configura os links de todos os <span> do texto da Entrada
        const linkSpans = entryContent.querySelectorAll('.linked-text');
        linkSpans.forEach(span => {
            span.addEventListener('click', (event) => { this._onLinkClick(event); });
        });        

        content.appendChild(titleHeader);
        content.appendChild(entryContent);

        return content;
    }    

    _onLinkClick(event) {
        const span = event.target;
        const entryId = span.dataset.entryId;
        const data = Database.entries[entryId]; 
        
        document.body.style.cursor = 'wait';
        const overlay = document.getElementById('entryFormOverlay');
        const form = new BaseForm(overlay);
        
        this.entry = new Entry(data, new LibraryManager(form));
        CONFIG.navQueue.push(this.entry);

        const newForm = this.entry.addTo('entryFormContent', true);
        newForm.ui.prev_btn.setAttribute('data-tooltip', this._getQueueText());        
        newForm.ui.prev_btn.classList.remove('invisible');

        newForm.showForm();
        document.body.style.cursor = 'default';
    }

    _onPreviousClick() {                
        // Remove a Entrada atual
        CONFIG.navQueue.pop(); 

        if(!CONFIG.navQueue.isEmpty() && !CONFIG.navQueue.hasLastItem()) {
            // Recupera a próxima Entrada
            this.prev = CONFIG.navQueue.last();        

            this.entry = new Entry(this.prev.data, this.manager);
            this.form = this.entry.addTo('entryFormContent');        
            this.form.ui.prev_btn.setAttribute('data-tooltip', this._getQueueText());
            this.form.ui.prev_btn.className = 'prev-entry';

            this.form.showForm();
        } else {
            this.form.hideForm();
        }
    }

    _getQueueText() {
        let text = '';
        const last = CONFIG.navQueue.last();        
        const first = CONFIG.navQueue.first();

        if(CONFIG.navQueue.size() > 2) {
            const prev = CONFIG.navQueue.at(CONFIG.navQueue.size() - 2);
            if(CONFIG.navQueue.size() > 3) {                
                text = `${first.data.title} >(${CONFIG.navQueue.size() - 3})> ${prev.data.title} > ${last.data.title}`;
            } else {
                text = `${first.data.title} > ${prev.data.title} > ${last.data.title}`;
            }
        } else {            
            text = `${first.data.title} > ${last.data.title}`;
        }     
        
        return text;
    }

    /**
     * @private
     * @param {Element} form // O container principal do form de Entrada
     */
    _configureTooltip(form) {
        const tooltip = this.tooltip;        

        form.addEventListener('mouseover', function(event) {
            const span = event.target.closest('span.linked-text');
            if (span) {
              tooltip._showLinkTooltip(event, span.dataset.entryId);
            } else {
                tooltip._hideLinkTooltip();
            }
        });
        form.addEventListener('mouseout', function () {
            tooltip._hideLinkTooltip();
        });
    }

    _onCloseClick(event) {
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();        

        if(this.form) {
            const overlay = document.querySelector('#entryFormOverlay');        
            const content = overlay.querySelector('#entryFormContent');

            if(CONFIG.navQueue.isFromLibrary()) {
                const first = CONFIG.navQueue.shift();
                CONFIG.navQueue.clearQueue();
                CONFIG.navQueue.push(first);
            } else {
                CONFIG.navQueue.clearQueue();
            }
            
            this.form.hideForm();
        }
    }
}