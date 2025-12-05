export default class BaseDocument {
    #data = null;

    get data() { return this.#data; }

    initialize(data) {
        this.#data = {};

        if(!this.#data) return;
    }

    /**
     * Verifica se uma propriedade existe no objeto de dados do documento.
     * @param {string} prop     - O nome da propriedade.
     * @returns {boolean}       - `true` se a propriedade existir, caso contrário `false`.
     */
    hasOwnProperty(prop) {
        return Object.prototype.hasOwnProperty.call(this.#data, prop);
    }
}