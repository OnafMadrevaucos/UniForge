export class BaseManager {
    constructor(form) {
        this.entryId = '';

        this.msgBox = uniforge.msgBox; 
        this.tooltip = uniforge.tooltip;

        this.form = form;              
    }

    getSubjects() {
        return Database.subjectTypes;
    }

    getEntryTypes() {
        return Database.entryTypes;
    }

    // Função para pré-carregar a imagem
    _preloadBackground(url) {
        const img = new Image();
        img.src = url; // Inicia o carregamento da imagem
        return new Promise((resolve, reject) => {
            img.onload = () => {resolve(img)};  // Imagem carregada com sucesso
            img.onerror = () => reject(new Error("Falha ao carregar a imagem")); // Caso ocorra erro
        });
    }

    // Função para aplicar o background e exibir o elemento
    _preLoadContent() {
        const content = this.form.ui.content.querySelector('.content');
        const imageUrl = this.form.imageUrl;

        // Pré-carregar a imagem antes de mostrar o elemento
        this._preloadBackground(imageUrl)
        .then(() => {
            content.classList.add('loaded');
        })
        .catch((error) => {
        console.error(error.message);
        // Caso falhe, pode definir um erro ou fallback
      });
    }    
}