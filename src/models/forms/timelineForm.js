import { TimelineManager } from "../../scripts/managers/timelineManager.js";
import SidebarForm from "./sidebarForm.js";

export default class TimelineForm extends SidebarForm {
    constructor() {
        super('Linha do Tempo');
        
        /**
        * @type {string} - Define o tipo do formulário.
        */
        this.type = 'timeline';

        /**
        * @type {string} - O modelo HTML utilizado pelo formulário.
        */
        this.template = 'timelineForm'; // Define o template do formulário. 

        /**
        * @type {TimelineManager} - O gerenciador de exibição da Timeline.
        */
        this.manager = new TimelineManager(this);
    }

    /**
     * @overload
     * @inheritdoc
    */
    get defaultOptions() { 
        const config = super.defaultOptions;   
        return uniforge.utils.mergeObjects(config,{
            classes: [...config.classes,'fullscreen']
        }); 
    }

    /**
    * Obtém as linhas do tempo de uma dada origem disponíveis no banco de dados.
    * @async
    * @returns {Object} - Assuntos e suas categorias.
    */
    prepareTimelines() {
        const data = uniforge.doc.timelines.toObject();

        /*
        if (data) {
            for (let timeline of Object.values(data)) {
                timeline.entries = Object.values(await this.db.getEventsFromTimeline(timeline.tid));
            }
        }
        */
        return data;
    }

    /**
    * Obtém as categorias disponíveis para o formulário no banco de dados.
    * @returns {Object} - Categorias.
    */
    async prepareData() {
        super.prepareData();

        this.data.timelines = this.prepareTimelines();

        return this.data;
    } 

    /**@inheritdoc */
    prepareFolders(data) {
        const folders = uniforge.doc.timelines.filter(t => t.type === this.type);
        data.folders = folders.sort();
    }
    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
     * Configura ouvintes de eventos básicos para o formulário.
     * @inheritdoc
     */
    activateListeners() {
        super.activateListeners();

        const newTimelineButton = this.querySelector('#newTimelineButton');
        newTimelineButton.addEventListener('click', (event) => { this.onNewTimelineClick(event); });

        const closeTimelineForgeButton = this.querySelector('#closeTimelineForgeButton');
        closeTimelineForgeButton.addEventListener('click', (event) => { this.onCloseTimelineForgeClick(event); });
    }

    onNewTimelineClick(event) {
        event.stopPropagation();
        const timelineForge = this.querySelector('#timelineForge');
        const timelineContainer = this.querySelector('#timelineContainer');

        timelineContainer.classList.add('hidden');
        timelineForge.classList.remove('hidden');
    }

    onCloseTimelineForgeClick(event) {
        event.stopPropagation();
        const timelineForge = this.querySelector('#timelineForge');
        const timelineContainer = this.querySelector('#timelineContainer');

        timelineForge.classList.add('hidden');
        timelineContainer.classList.remove('hidden');        
    }

    /**
     * Gerencia cliques duplos em itens de entrada.
     * @param {MouseEvent} event - O evento de clique duplo.
     * @protected
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