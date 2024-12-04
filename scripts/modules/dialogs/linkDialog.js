import { Dialog } from "./dialog.js";

export class LinkDialog extends Dialog {
    constructor(bodyHTML, buttons=[]){
        super('Vincular Entrada', bodyHTML, buttons);
    }

    getLink() {

    }
    _onEntryItemClick(event) {
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();   
        
        const dialog = event.target.closest('.dialog');
        const folderList = dialog.querySelectorAll('.folder');
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
}