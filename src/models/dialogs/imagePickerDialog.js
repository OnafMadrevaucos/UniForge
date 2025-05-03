import BaseDialog from "./baseDialog.js";

export default class FilePickerDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            //height: '185px',
            width: '475px'
        }));

        this.template = 'filePickerDialog'; // Define o template do diálogo.
    }

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    activateListeners() {
        super.activateListeners();

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
            uniforge.utils.associateData(chosenFilePath, data);
        }
    }

    static async configDialog(options = {}) {
        options = uniforge.utils.mergeObjects(options, { alwaysClose: true });
        return new Promise((resolve, reject) => {
            const dialog = new this({
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
                        callback: () => {
                            const chosenFilePath = document.querySelector('#chosenFilePath');
                            const captionInput = document.querySelector('#captionInput');

                            const data = uniforge.utils.getAsociatedData(chosenFilePath);
                            data.caption = captionInput.value;
                            resolve(data);
                        }
                    }
                },
                abort: () => resolve(null)
            }, options);
            dialog.show(true);
        });
    }
}