export class Dialog {
    constructor(title="Dialog", bodyHTML, buttons=[]) {      
      this.bodyHTML = bodyHTML; // Conteúdo do corpo do diálogo
      this.title = title;       // Título do diálogo
      this.buttons = buttons;   // Conjunto de botões
      this.dialog = null;       // Elemento do diálogo
      this.isDragging = false;  // Estado para rastrear arraste
      this.state = {
            isDragging: false,
            xDiff: 5,
            yDiff: 5,
            x: 0,
            y: 0 
      }; // Offset do mouse em relação ao diálogo

      this.parentElement = document.querySelector('.entries');
    }

    // Método para criar o diálogo
    createDialog(hasOverlay=false) {
      // Container do diálogo
      this.dialog = document.createElement("div");
      this.dialog.id = 'dialog';
      this.dialog.className = "dialog";

      // Cabeçalho
      const titleHeader = document.createElement('div');
      titleHeader.className = 'header';

      titleHeader.addEventListener('mousedown', (event) => { this.onMouseDown(event); });
      document.addEventListener('mousemove', (event) => { this.onMouseMove(event); });
      document.addEventListener('mouseup', () => { this.onMouseUp(); });
  
      // Título do diálogo
      const title = document.createElement("h2");
      title.textContent = this.title;

      titleHeader.appendChild(title);
  
      // Corpo do diálogo
      const dialogBody = document.createElement("div");
      dialogBody.className = 'body';
      dialogBody.innerHTML = this.bodyHTML;
  
      // Container dos botões
      const buttons = document.createElement("div");
      buttons.className = 'buttons';
  
      // Criar os botões
      this.buttons.forEach((button) => {
        const newButton = document.createElement("button");
        newButton.innerHTML = `<i class='${button.icon}'></i> ${button.label}`;
        newButton.className = button.className || "dialog-button";

        if (button.onClick) {
            newButton.addEventListener("click", button.onClick);
        }

        buttons.appendChild(newButton);
      });
      
      this.dialog.appendChild(titleHeader);
      this.dialog.appendChild(dialogBody);
      this.dialog.appendChild(buttons);
  
      // Adiciona o diálogo à página
      document.body.appendChild(this.dialog);

      if(hasOverlay) this.createOverlay();

      this._renderWindow();
    }

    querySelector(selector) {
      return this.dialog.querySelector(selector);
    }

    querySelectorAll(selector) {
      return this.dialog.querySelectorAll(selector);
    }

    configureListeners(listerns=[]) {
      listerns.forEach(item => {
        item.element.addEventListener(item.event, item.callback);
      });
    }
  
    // Método para criar um overlay
    createOverlay() {
      const overlay = document.createElement("div");
      overlay.className = "dialog-overlay";
      document.body.appendChild(overlay);
  
      // Permitir fechar o diálogo clicando no overlay
      overlay.addEventListener("click", () => this.closeDialog());
    }
  
    // Método para fechar o diálogo
    closeDialog() {
      if (this.dialog) {
        this.dialog.remove();
        this.dialog = null;
      }
      const overlay = document.querySelector(".dialog-overlay");
      if (overlay) overlay.remove();
    }

    // Iniciar arraste
    onMouseDown(event) {                
        this.state.isDragging = true;
        this.state.xDiff = event.pageX - this.state.x;
        this.state.yDiff = event.pageY - this.state.y;

        const header = this.dialog.querySelector('.header');
        // Trocar para cursor de "grabbing"
        header.style.cursor = "grabbing";

        // Restaurar seleção de texto
        document.body.style.userSelect = "none";
    }

    // Manipular arraste
    onMouseMove(event) {
        if (this.state.isDragging) {

            this.state.x = this._clampX(event.pageX - this.state.xDiff);
            this.state.y = this._clampY(event.pageY - this.state.yDiff);
        }

        this._renderWindow();
    }

    // Finalizar arraste
    onMouseUp() {
      if(!this.dialog) return;

      this.state.isDragging = false;

      const header = this.dialog.querySelector('.header');
      // Trocar para cursor de "grabbing"
      header.style.cursor = "grab";

      // Restaurar seleção de texto
      document.body.style.userSelect = "";
    }

    _renderWindow() { 
      if(!this.dialog) return;      
      this.dialog.style.transform = 'translate(' + this.state.x + 'px, ' + this.state.y + 'px)';
    }

    _clampX(n) {
        const parentRect = this.parentElement.getBoundingClientRect();
        const dialogRect = this.dialog.getBoundingClientRect();

        return Math.min(Math.max(n, -parentRect.width/2), (parentRect.width/2 - dialogRect.width));
    }    
    _clampY(n) {
        const parentRect = this.parentElement.getBoundingClientRect();
        const dialogRect = this.dialog.getBoundingClientRect();

        return Math.min(Math.max(n, -parentRect.height/2), (parentRect.height/2 - dialogRect.height));
    }
}
  