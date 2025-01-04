export default class MsgBox {
    constructor(maxMessages) {
        this.queue = []
        this.queueIdx = 0;
        this.maxMessages = maxMessages;
    }

    // Função para mostrar a mensagem de erro com animação
    showError(message) {
        this._showMsg(message, 'error');
    }
    // Função para mostrar a mensagem de aviso com animação
    showWarning(message) {
        this._showMsg(message, 'warning');
    }
    // Função para mostrar a mensagem de aviso com animação
    showInfo(message) {
        this._showMsg(message, 'info');
    }
    
    _showMsg(message, style) {
        if (this.queue.length >= this.maxMessages) {
            // Espera até que a última mensagem tenha desaparecido
            const lastMessage = this.queue[this.queue.length - 1];
            lastMessage.addEventListener('animationend', () => {
                this._showNewMessage(message);
            }, { once: true });
        } else {
            this._getNewMessage(message, style);
        }
    }
  
    // Função que exibe a nova mensagem
    _getNewMessage(message, style) {
        const messageContainer = document.getElementById('msgContainer');
        const messageObj = document.createElement('div');  
        messageObj.classList.add('message', style);
  
        var icon = '<i class="fa-regular fa-circle-xmark"></i>';
        switch(style){
            case 'error': {
                icon = '<i class="fa-solid fa-triangle-exclamation"></i>'; 
                // Registra o erro no log da página
                console.error(message);
            } break;
            case 'warning': {
                icon = '<i class="fa-solid fa-circle-exclamation"></i>'; 
                // Registra o aviso no log da página
                console.warn(message);
            } break;
            case 'info': {
                icon = '<i class="fa-solid fa-circle-info"></i>'; 
                // Registra o erro no log da página 
                console.info(message);
            } break;
            default: break;
        }
        messageObj.innerHTML = `${icon} ${message}`;  
  
        this.queue.push(messageObj);
  
        // Adicionar a nova mensagem à tela
        messageContainer.appendChild(messageObj);
  
        // Mostrar a mensagem com animação
        setTimeout(() => {
            messageObj.classList.add('show');
        }, 10); // Atraso para iniciar a animação de slide
  
        // Remover a mensagem após a animação de exibição (durante o fade-in)
        setTimeout(() => {
            this._removeMessage(messageObj);
        }, 3000); // Tempo para manter a mensagem visível (3 segundos)
    }
  
    // Função para remover a mensagem após a animação
    _removeMessage(messageObj) {
        const messageContainer = document.getElementById('msgContainer');
  
        messageObj.classList.remove('show');
        messageObj.classList.add('hide');
    
        // Após o tempo da animação de slide out, removemos a mensagem da fila
        setTimeout(() => {
            messageContainer.removeChild(messageObj);
            // Remover da lista de mensagens
            this.queue = this.queue.filter(msg => msg !== messageContainer);
        }, 300); // Espera a animação de desaparecimento terminar
    }  
}