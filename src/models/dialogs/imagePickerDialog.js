import Dialog from "./dialog.js";

export default class FilePickerDialog extends Dialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '150px', 
            width: '475px'
        }));
    }

    async getBody() {
        // Cria o body
        const body = document.createElement('div');
        body.className = 'image-dialog flexcol';

        const fileGroup = document.createElement('div');
        fileGroup.className = 'data-group text file';

        const fileLabel = document.createElement('span');
        fileLabel.className = 'data-label';
        fileLabel.textContent = 'Escolha uma imagem: ';

        const fileContainer = document.createElement('div');
        fileContainer.id = 'fileContainer';
        fileContainer.className = 'file-container flexrow';

        const chosenFilePath = document.createElement('input');
        chosenFilePath.type = 'text';
        chosenFilePath.id = 'chosenFilePath';
        chosenFilePath.className = 'file-path';
        chosenFilePath.disabled = true;

        const chooseFileButton = document.createElement('a');
        chooseFileButton.id = 'chooseFileButton';
        chooseFileButton.innerHTML = '<i class="fas fa-upload"></i>';

        const hiddenImageInput = document.createElement('input');
        hiddenImageInput.type = 'file';
        hiddenImageInput.id = 'hiddenImageInput';
        hiddenImageInput.className = 'hidden';
        hiddenImageInput.accept = 'image/*';   
        
        fileContainer.appendChild(fileLabel);
        fileContainer.appendChild(chosenFilePath);
        fileContainer.appendChild(chooseFileButton);
        fileContainer.appendChild(hiddenImageInput);

        fileGroup.appendChild(fileContainer);

        const captionGroup = document.createElement('div');
        captionGroup.className = 'data-group text';

        const captionLabel = document.createElement('span');
        captionLabel.className = 'data-label';
        captionLabel.textContent = 'Legenda: ';

        const captionInput = document.createElement('input');
        captionInput.id = 'captionInput';
        captionInput.type = 'text';
        captionInput.placeholder = 'Digite a legenda...';

        captionGroup.appendChild(captionLabel);
        captionGroup.appendChild(captionInput);

        body.appendChild(fileGroup);
        body.appendChild(captionGroup);

        return body;
    }  
    
    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    _activateListeners() {
        super._activateListeners();

        const hiddenImageInput = this.querySelector('#hiddenImageInput');
        const chooseFileButton = this.querySelector('#chooseFileButton');
        const chosenFilePath = this.querySelector('#chosenFilePath');

        hiddenImageInput.addEventListener('change', (event) => { this._onChangeFile(event, chosenFilePath); })
        chooseFileButton.addEventListener('click', () => { hiddenImageInput.click(); });
    }

    /**
    * Trata evento de seleção de arquivo.
    * @param {MouseEvent} event             - O evento de clique.
    * @param {HTMLElement} chosenFilePath   - O recipiente para o caminho do arquivo selecionado.
    */
    async _onChangeFile(event, chosenFilePath) {
        const file = event.target.files[0];

        // Verifica se um arquivo foi selecionado e se é uma imagem.
        if (file && file.type.startsWith('image/')) {
          // Cria um URL temporário para o arquivo selecionado.
          const imageURL = URL.createObjectURL(file);
    
          // Atualiza a imagem exibida.
          chosenFilePath.value = imageURL;

          const data = await uniforge.utils.imageToBlob(file);
          uniforge.utils.associateDataWithElement(chosenFilePath, data);
        }
    }

    static async configDialog() {
        function getImage(event) {  
            event.stopPropagation();
            const chosenFilePath = document.querySelector('#chosenFilePath');
            const captionInput = document.querySelector('#captionInput');

            const data = uniforge.utils.getAsociatedData(chosenFilePath);
            data.caption = captionInput.value;
                        
            return data;
        }

        return new Promise((resolve, reject) => {
            const dialogData = {
                title: 'Enviar Imagem',
                buttons: {
                    cancel: {
                        label: "Cancelar",
                        icon: "fas fa-xmark",
                        callback: () => resolve(null)
                    },
                    link: {
                        label: "Enviar",
                        icon: "fas fa-link",
                        callback: (event) => { resolve(getImage(event)); }
                    }
                },
                abort: () => resolve(null)
            };

            const dialog = new this(dialogData);
            dialog.render();
        });
    }
}