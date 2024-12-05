import BaseForm from "./baseForm.js";
import { Database } from "../../scripts/tempDB.js";
import { TimelineManager } from "../../scripts/managers/timelineManager.js";

export class TimelineForm extends BaseForm {
    constructor(overlay) {
        const form = super(overlay);
        this.form = form;

        this.manager = new TimelineManager(form);                
        this.configureContent(form);
    }

    getData(id){
        return Database.timelines[id];        
    }

    configureContent(form) {
        super.configureContent(form);
        this.configureSidebar(form);

        this.manager.getTimeline('TL02').addTo('timelineContainer');
        //this._configureTimeline(form, this.data);        
    }
    configureSidebar(form) {
        // Botão de adicionar uma nova categoria à Enciclopédia
        const searchButton = form.querySelector('#searchButton');    
        // Ao clicar no botão, inicie a transformação
        searchButton.addEventListener('click', (event) => { this.onSearchButtonClick(event); });
        
    }    
    

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
    }    
}