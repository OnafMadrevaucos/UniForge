import { TimelineManager } from "../../scripts/managers/timelineManager.js";
import SidebarForm from "./sidebarForm.js";

export default class TimelineForm extends SidebarForm {
    constructor(title) {
        const form = super(title);
        this.form = form;

        this.template = 'timelineForm'; // Define o template do formulário. 

        this.manager = new TimelineManager(form);
    }

    /**
    * Obtém as linhas do tempo de uma dada origem disponíveis no banco de dados.
    * @async
    * @returns {Object} - Assuntos e suas categorias.
    */
    async getTimelines() {
        const data = await this.db.getAllTimelines();

        if (data) {
            for (let timeline of Object.values(data)) {
                timeline.entries = Object.values(await this.db.getEventsFromTimeline(timeline.tid));
            }
        }
        return data;
    }

    /**
    * Obtém as categorias disponíveis para o formulário no banco de dados.
    * @returns {Object} - Categorias.
    */
    async getData() {
        const data = await super.getData();

        data.timelines = await this.getTimelines();

        return data;
    }

    async configureContent(form) {
        this.data = await this.getData();

        this.loadSidebarData(form);

        this.activateListeners(form);
    }

    /**
    * Carrega a lista de entradas da barra lateral.
    * @param {HTMLElement} form - O formulário principal.
    */
    loadSidebarData(form) {
        const data = this.data.timelines;
        if(data) this.createFolderList(data);
    }
    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
     * Configura ouvintes de eventos básicos para o formulário.
     * @param {HTMLElement} form - O formulário principal.
     * @private
     */
    activateListeners(form) {
        super.activateListeners(form);
    }
    /**
   * Gerencia cliques duplos em itens de entrada.
   * @param {MouseEvent} event - O evento de clique duplo.
   * @private
   */
    async onEntryItemDoubleClick(event) {
        super.onEntryItemDoubleClick(event);
        // Obter a entrada clicada.
        const entry = event.target.closest('.entry-item');
        const entryId = entry.dataset.id;
        const data = await uniforge.db.getEntryWithIcon(entryId);

        this.manager.getEntry(data).addTo('entryContainer', false);
    }

    onSearchButtonClick(event) {
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();

        console.log('*CLICK*')
    }

    /*
    onEntryItemClick(event){
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();

        const folderList = this.form.querySelectorAll('#folderList .list-item');
        const item = event.target;
      
        // Remover a classe 'selected' de todos os itens
        folderList.forEach(i => {
          i.classList.remove('selected')
          const folderIcon = i.querySelector('.fas');
          folderIcon.classList.remove(...folderIcon.classList);
          folderIcon.classList.add('fas', 'fa-folder');
        });
            
        // Adicionar a classe 'selected' ao item clicado
        item.classList.add('selected');
        const folderIcon = item.querySelector('.fas');
        folderIcon.classList.remove(...folderIcon.classList);
        folderIcon.classList.add('fas', 'fa-folder-open');
    }
    onSearchButtonClick(event) { 
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();
        
        console.log('*CLICK*')
    }*/
}