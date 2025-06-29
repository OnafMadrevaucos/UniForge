import BaseDialog from "./baseDialog.js";

export default class FilePickerDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '750px',
            width: '500px'
        }));

        this.template = 'filePickerDialog'; // Define o template do diálogo.
    }

    static async configDialog(options = {}) {
        options = uniforge.utils.mergeObjects(options, { alwaysClose: true });
        return new Promise((resolve, reject) => {
            const dialog = new this({
                title: 'Explorador de Arquivos',
                buttons: {
                    select: {
                        label: "Selecionar Arquivo",
                        icon: "fas fa-check",
                        callback: () => {
                            /*
                            const chosenFilePath = document.querySelector('#chosenFilePath');
                            const captionInput = document.querySelector('#captionInput');

                            const data = uniforge.utils.getAsociatedData(chosenFilePath);
                            data.caption = captionInput.value;
                            */
                            console.log('Arquivo selecionado!');
                            resolve(true);
                        }
                    }
                },
                abort: () => resolve(null)
            }, options);
            dialog.show(true);
        });
    }
}