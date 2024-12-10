import Dialog from "./dialog.js";

export class LinkDialog extends Dialog {
    constructor(){
        const body = document.createElement('div');
        body.className = 'data-group text';

        const input = document.createElement('input');
        input.id = 'entryTitle';
        input.type = 'text';
        input.className = 'data';
        input.placeholder = 'Título...';

        body.appendChild(input);

        // Configuração de botões
        const buttons = [
            {
                label: "Cancelar",
                icon: "fas fa-xmark",
                onClick: () => {
                    dialog.closeDialog();
                },
            },
            {
                label: "Confirmar",
                icon: "fas fa-check",
                onClick: () => { this.createNewEntry(selectedFolder); },
            }
        ];

        super('Vincular Entrada', body.outerHTML, buttons);
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