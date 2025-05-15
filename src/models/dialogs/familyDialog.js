import BaseDialog from "./baseDialog.js";

export default class FamilyDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '800px',
            width: '650px'
        }));

        this.blankImg = uniforge.urls.blankImg;

        this.template = 'familyDialog'; // Define o template do dialog.
    }

    async _prepare() {
        this.data.families = this.prepareFamilies();
        this.data.adults = this.prepareAdults();

        await super._prepare(); // Gera a estrutura base do diálogo.
    }

    /**
     * Prepara uma lista de objetos de família para serem apresentados no diálogo.
     * Busca todas as categorias de tipo 'lineage' e lista os seus respectivos objetos de entrada.
     * @returns {array} Uma lista de objetos de entrada de tipo 'family'.
     */
    prepareFamilies() {
        const lineageCategories = uniforge.doc.categories.filter(c => c.isLineage === true);
        const families = [];
        lineageCategories.forEach(c => {
            c.entries.forEach(e => {
                const entryId = e._id;
                const entry = uniforge.doc.entries.get(entryId);
                families.push(entry);
            });
        });

        return families;
    }

    /**
     * Prepara uma lista de objetos de adulto para serem apresentados no diálogo como prováveis pais, mães e/ou companheiros.
     * Atualmente, essa lista est  vazia, mas futuramente pode vir a ser preenchida com os objetos de entrada de tipo 'adult'.
     * @returns {array} Uma lista de objetos de entrada de tipo 'person' na fase adulta.
     */
    prepareAdults() {
        const adults = [];
        const lineageCategories = uniforge.doc.categories.filter(c => {
            const s = uniforge.doc.subjects.get(c.sid);
        });

        return adults;
    }

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    _activateListeners() {
        super._activateListeners();

        const familySelect = this.querySelector('#familySelect');
        familySelect.addEventListener('change', (event) => { this.onFamilySelectChange(event); });
    }

    async onFamilySelectChange(event) {
        event.stopPropagation(); 
        const familyId = event.target.value;
        const familyPortrait = this.querySelector('#familyPortrait');

        if (familyId !== '0') {
            const family = uniforge.doc.entries.get(familyId);

            const image = await uniforge.utils.blobToImage(family.img);
            
            familyPortrait.classList.remove('empty');
            familyPortrait.src = image;
        } else {
            familyPortrait.classList.add('empty');
            familyPortrait.src = this.blankImg;
        }
    }

    static async configDialog() {
        function onSubmit(event) {
            const button = event.target.closest('.dialog-button');
            console.log(button.dataset);
        }

        return new Promise((resolve, reject) => {
            const dialogData = {
                title: 'Linhagem',
                buttons: {
                    cancel: {
                        label: "Cancelar",
                        icon: "fas fa-xmark",
                        callback: () => resolve(null)
                    },
                    create: {
                        label: "Salvar",
                        icon: "fas fa-floppy-disk",
                        callback: (event) => { resolve(onSubmit(event)); }
                    }
                },
                abort: () => resolve(null)
            };

            const dialog = new this(dialogData);
            dialog.show(true);
        });
    }
}