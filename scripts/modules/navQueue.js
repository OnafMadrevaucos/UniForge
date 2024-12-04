import { Entry } from "../modules/managers/libraryManager.js";
import { Timeline } from "../modules/managers/timelineManager.js";

/**
 * Classe NavQueue
 * Representa uma fila de navegação para gerenciar elementos provenientes de diferentes origens (biblioteca ou linha do tempo).
 */
export class NavQueue {
  /**
   * Construtor da classe NavQueue.
   * Inicializa a fila e define a origem como uma string vazia.
   */
  constructor() {
    /**
     * Array interno que armazena os elementos da fila.
     * @type {Array}
     */
    this.queue = [];

    /**
     * Identifica a origem do caminho de navegação.
     * Pode ser "library", "timeline" ou "default".
     * @type {string}
     */
    this.origin = '';
  }

  /**
   * Retorna o elemento da fila no índice especificado.
   * 
   * @param {number} index - O índice do elemento a ser retornado.
   * @returns {any|null} O elemento no índice especificado ou null em caso de erro.
   */
  at(index) {
    if (this.isEmpty()) {
      console.error("Erro: Fila de Navegação está vazia.");
      return null;
    }

    if (index < 0 || index >= this.size()) {
      console.error("Erro: O índice se encontra fora da Fila de Navegação.");
      return null;
    }

    return this.queue.at(index);
  }

  /**
   * Adiciona um elemento ao final da fila e define a origem com base no tipo do elemento.
   * 
   * @param {any} element - O elemento a ser adicionado.
   */
  push(element) {
    if (this.isEmpty()) {
      if (element instanceof Entry) this.origin = 'library';
      else if (element instanceof Timeline) this.origin = 'timeline';
      else this.origin = 'default';
    }
    this.queue.push(element);
  }

  /**
   * Retorna o primeiro elemento da fila sem removê-lo.
   * 
   * @returns {any|null} O primeiro elemento da fila ou null em caso de erro.
   */
  first() {
    if (this.isEmpty()) {
      console.error("Erro: Fila de Navegação está vazia.");
      return null;
    }

    return this.queue.at(0);
  }

  /**
   * Retorna o último elemento da fila sem removê-lo.
   * 
   * @returns {any|null} O último elemento da fila ou null em caso de erro.
   */
  last() {
    if (this.isEmpty()) {
      console.error("Erro: Fila de Navegação está vazia.");
      return null;
    }

    return this.queue.at(this.size() - 1);
  }

  /**
   * Remove e retorna o último elemento da fila.
   * Se o último elemento for da linha do tempo e houver apenas um item restante, a fila será limpa.
   * 
   * @returns {any|null} O último elemento removido ou null em caso de erro.
   */
  pop() {
    if (this.isEmpty()) {
      console.error("Erro: Fila de Navegação está vazia.");
      return null;
    }

    const value = this.queue.pop();

    if (this.isFromTimeline() && this.hasLastItem()) {
      this.clearQueue();
    }

    return value;
  }

  /**
   * Remove e retorna o primeiro elemento da fila.
   * 
   * @returns {any|null} O primeiro elemento removido ou null em caso de erro.
   */
  shift() {
    if (this.isEmpty()) {
      console.error("Erro: Fila de Navegação está vazia.");
      return null;
    }
    return this.queue.shift();
  }

  /**
   * Retorna o tamanho da fila.
   * 
   * @returns {number} O número de elementos na fila.
   */
  size() {
    return this.queue.length;
  }

  /**
   * Limpa todos os elementos da fila e redefine a origem.
   */
  clearQueue() {
    if (this.size() > 0) {
      this.queue = [];
      this.origin = '';
    }
  }

  /**
   * Verifica se a fila tem apenas um elemento.
   * 
   * @returns {boolean} `true` se a fila tiver exatamente um elemento, caso contrário `false`.
   */
  hasLastItem() {
    return this.size() === 1;
  }

  /**
   * Verifica se a fila está vazia.
   * 
   * @returns {boolean} `true` se a fila estiver vazia, caso contrário `false`.
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Verifica se a origem é "library".
   * 
   * @returns {boolean} `true` se a origem for "library", caso contrário `false`.
   */
  isFromLibrary() {
    return this.origin === 'library';
  }

  /**
   * Verifica se a origem é "timeline".
   * 
   * @returns {boolean} `true` se a origem for "timeline", caso contrário `false`.
   */
  isFromTimeline() {
    return this.origin === 'timeline';
  }

  /**
   * Retorna uma cópia dos elementos da fila.
   * 
   * @returns {Array} Uma cópia da fila atual.
   */
  viewQueue() {
    return [...this.queue];
  }
}
