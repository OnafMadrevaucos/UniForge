/**
 * @fileoverview Classe para gerenciar e exibir mensagens de notificação (erros, avisos, informações)
 * com limitação de mensagens visíveis e funcionalidade de fila de espera.
 *
 * Inclui logs de console aprimorados com a localização exata do código de chamada para facilitar a depuração.
 * @module MsgBox
 */
export default class MsgBox {
    /**
     * Cria uma instância de MsgBox.
     * @param {number} maxMessages O número máximo de mensagens que podem ser exibidas no DOM simultaneamente.
     */
    constructor(maxMessages) {
        /**
         * @private
         * @type {HTMLElement[]} Array que armazena referências aos objetos de mensagem (divs) atualmente visíveis no DOM.
         */
        this.queue = [];

        /**
         * @private
         * @type {Array<{message: string, style: 'error'|'warning'|'info'}>} Fila de mensagens esperando para serem exibidas
         * porque o limite de mensagens visíveis foi atingido.
         */
        this.waitingQueue = [];

        /**
         * @private
         * @type {number} Índice não utilizado. Mantido por compatibilidade com a implementação anterior.
         */
        this.queueIdx = 0;

        /**
         * @private
         * @type {number} O número máximo de mensagens permitidas no DOM.
         */
        this.maxMessages = maxMessages;
    }

    /**
     * @private
     * @description Função auxiliar para extrair a localização (arquivo, linha, coluna) da chamada de log
     * através da análise do stack trace de um novo objeto Error.
     * @returns {string} Uma string formatada com a localização da chamada (ex: " [📍 arquivo.js:45:12]").
     */
    _getLocation(err=null) {
        // Cria um novo objeto Error para obter a stack trace atual.
        const error = err ?? new Error();
        // Pula o cabeçalho da stack trace e as referências internas ao MsgBox.
        const stackLines = error.stack.split('\n').splice(3);

        let lines = '';
        for (const line of stackLines) {
            lines += `\n [📍 ${line}]`;
        }
        return lines;
    }

    /**
     * Mostra uma mensagem de erro no painel do usuário e registra um erro no console.
     * O log do console inclui a localização exata da chamada.
     * @param {string} message      - A mensagem de erro a ser exibida para o usuário.
     * @param {Error|null} error    - O erro a ser exibido no console.
     */
    showError(message, error=null) {
        const location = this._getLocation(error);

        console.error(`UniForge | ${message}${location}`);
        this._showMsg(message, 'error');
    }

    /**
     * Mostra uma mensagem de aviso no painel do usuário e registra um warning no console.
     * O log do console inclui a localização exata da chamada.
     * @param {string} message A mensagem de aviso a ser exibida para o usuário.
     */
    showWarning(message) {
        const location = this._getLocation(false);
        console.warn(`UniForge | ${message}${location}`);
        this._showMsg(message, 'warning');
    }

    /**
     * Mostra uma mensagem de informação no painel do usuário e registra uma info no console.
     * @param {string} message A mensagem informativa a ser exibida para o usuário.
     * @param {string|null} [info=null] Um texto opcional para o log do console, se diferente da mensagem da UI.
     */
    showInfo(message, info = null) {
        console.info(`UniForge | ${info ?? message}`);
        this._showMsg(message, 'info');
    }

    /**
     * @private
     * @description Lógica interna para gerenciar o limite de mensagens e a fila de espera.
     * Adiciona a mensagem à fila de espera se o limite for atingido, senão a exibe imediatamente.
     * @param {string} message O conteúdo da mensagem.
     * @param {'error'|'warning'|'info'} style O estilo da mensagem (determina ícone e cor).
     */
    _showMsg(message, style) {
        if (this.queue.length >= this.maxMessages) {
            // Adiciona a mensagem à fila de espera
            this.waitingQueue.push({ message, style });
        } else {
            // Se houver espaço, mostra a mensagem imediatamente.
            this._getNewMessage(message, style);
        }
    }

    /**
     * @private
     * @description Cria e exibe o elemento DOM da nova mensagem.
     * Também agenda a remoção automática da mensagem após 5 segundos.
     * @param {string} message O conteúdo da mensagem.
     * @param {'error'|'warning'|'info'} style O estilo da mensagem.
     */
    _getNewMessage(message, style) {
        const messageContainer = document.getElementById('msgContainer');
        const messageObj = document.createElement('div');
        messageObj.classList.add('message', 'flexrow', style);

        let icon;
        switch (style) {
            case 'error': {
                icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
            } break;
            case 'warning': {
                icon = '<i class="fa-solid fa-circle-exclamation"></i>';
            } break;
            case 'info': {
                icon = '<i class="fa-solid fa-circle-info"></i>';
            } break;
            default: {
                icon = '<i class="fa-regular fa-circle-xmark"></i>';
            } break;
        }

        const closeBtn = document.createElement('a');
        closeBtn.classList.add('close-message');
        closeBtn.innerHTML = '<i class="fas fa-circle-xmark"></i>';

        // Adiciona um listener de clique ao botão de fechar
        closeBtn.addEventListener('click', () => {
            this._removeMessage(messageObj);
        });

        const msgBody = document.createElement('div');
        msgBody.classList.add('message-body');
        msgBody.innerHTML = `${icon} ${message}`;

        messageObj.appendChild(msgBody);
        messageObj.appendChild(closeBtn);

        this.queue.push(messageObj); // Adiciona à fila de mensagens visíveis

        // Adicionar a nova mensagem à tela
        messageContainer.appendChild(messageObj);

        // Mostrar a mensagem com animação (timeout para iniciar a transição CSS)
        setTimeout(() => {
            messageObj.classList.add('show');
        }, 10);

        // Remover a mensagem após o tempo de visibilidade
        setTimeout(() => {
            this._removeMessage(messageObj);
        }, 5000);
    }

    /**
     * @private
     * @description Inicia a animação de desaparecimento e remove o elemento do DOM e da fila.
     * Aciona a verificação da fila de espera após a remoção.
     * @param {HTMLElement} messageObj O objeto DOM da mensagem a ser removida.
     */
    _removeMessage(messageObj) {
        const messageContainer = document.getElementById('msgContainer');

        messageObj.classList.remove('show');
        messageObj.classList.add('hide');

        // Após o tempo da animação de slide out, removemos a mensagem do DOM e da fila.
        setTimeout(() => {
            // Verifica se a mensagem ainda é filha do container (evita erros se o container for removido)
            if (messageObj.parentNode === messageContainer)
                messageContainer.removeChild(messageObj);

            // Remover da lista de mensagens visíveis
            this.queue = this.queue.filter(msg => msg !== messageObj);

            // Verifica a fila de espera para exibir a próxima mensagem
            this._checkWaitingQueue();

        }, 300); // Espera o tempo da animação de desaparecimento
    }

    /**
     * @private
     * @description Verifica se há mensagens na fila de espera e, se houver espaço, exibe a próxima.
     */
    _checkWaitingQueue() {
        if (this.waitingQueue.length > 0) {
            // Se houver mensagens na fila de espera E houver espaço na fila principal
            if (this.queue.length < this.maxMessages) {
                // Pega e remove a primeira mensagem da fila de espera (FIFO)
                const nextMessage = this.waitingQueue.shift();
                // Exibe a próxima mensagem
                this._getNewMessage(nextMessage.message, nextMessage.style);
            }
        }
    }
}