import Dialog from "./dialog.js";

export default class FilePickerDialog extends Dialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, options);
    }

    async getBody() {
        // Cria o body
        const body = document.createElement('div');
        body.className = 'flexcol';

        const fileLabel = document.createElement('label');
        fileLabel.setAttribute('for', 'fileInput');
        fileLabel.textContent = 'Escolha uma imagem:';

        const fileInput = document.createElement('input');
        fileInput.setAttribute('type', 'file');
        fileInput.setAttribute('id', 'fileInput');
        fileInput.setAttribute('accept', 'image/*');

        const captionLabel = document.createElement('label');
        captionLabel.setAttribute('for', 'captionInput');
        captionLabel.textContent = 'Legenda:';

        const captionInput = document.createElement('input');
        captionInput.setAttribute('type', 'text');
        captionInput.setAttribute('id', 'captionInput');
        captionInput.setAttribute('placeholder', 'Digite a legenda...');

        body.appendChild(fileLabel);
        body.appendChild(fileInput);
        body.appendChild(captionLabel);
        body.appendChild(captionInput);

        return body;
    }   

    static async configDialog(fileInput, callback) {
        function getImage(fileInput, callback) {
            const file = fileInput.files[0];
            const caption = captionInput.value;

            if (file) {
                const reader = new FileReader();

                reader.onload = function (event) {
                    // Converte a imagem em Blob
                    const blob = new Blob([event.target.result], { type: file.type });
                    const url = URL.createObjectURL(blob);

                    // Chama o callback com o URL da imagem
                    callback(url, { title: caption });

                    closeDialog();
                };

                reader.readAsArrayBuffer(file);
            } else {
                alert('Por favor, selecione um arquivo de imagem.');
            }
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
                        callback: (fileInput, callback) => { resolve(getImage(fileInput, callback)); }
                    }
                },
                abort: () => resolve(null)
            };

            const dialog = new this(dialogData);
            dialog.render();
        });
    }
}