/**
 * Classe de Utilidades.  
 */
export default class Utils {
    constructor() {
        /**
         * Cria uma WeakMap para armazenar arquivos maiores.
         * @private
         * @type {WeakMap}
         * */
        this._store = new WeakMap();

        /**
        * Instância de Crypto usada pela aplicação.
        * @private
        * @type {Object}
        */
        this._crypto = window.crypto;
    }

    /**
    * Converte a primeira letra de uma string para maiúscula.
    * @param {HTMLElement} element   - O elemento com identificador único dos dados.
    * @param {object} data           - Os dados a serem retornados.
    */
    getAsociatedData(element) {
        return this._store.get(element);
    }

    /**
    * Converte a primeira letra de uma string para maiúscula.
    * @param {HTMLElement} element  - O element que receberá os dados.
    * @param {Object} data          - Dados a serem atrelados ao element.
    */
    associateDataWithElement(element, data) {
        const uniqueId = this._crypto.randomUUID(); // Generate a unique ID
        element.dataset.uuid = uniqueId;    // Store the ID in the element's dataset
        this._store.set(element, { uuid: uniqueId, data });    // Store the Data in the WeakMap
    }

    /**
    * Converte a primeira letra de uma string para maiúscula.
    * @param {string} text - A string cujo primeiro caractere será capitalizado.
    * @returns {string} A string com a primeira letra em maiúscula ou uma string vazia se o texto for `undefined` ou vazio.
    */
    capitalizeFirstLetter(text) {
        if (!text) return ''; // Verifica se a string está vazia ou undefined
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    /**
    * Gera uma string aleatória de caracteres.
    * @param {number} length - O comprimento da string aleatória.
    * @returns {string} - A string aleatória gerada.
    */
    generateRandomString(length, onlySmallCaps = false) {
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        if (onlySmallCaps) characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    /**
    * Converte uma imagem para Blob.
    * @async
    * @param {string} file                    - A string do caminho para o arquivo da imagem.
    * @returns {{img:Blob, ext:string}}       - Objeto com o fluxo de dados da imagem em Blob e a extensão do arquivo.
    */
    async imageToBlob(file) {
        const data = {};

        // Se uma imagem foi informada, prepare-a para o banco de dados.
        if (file || !file.type.startsWith('image/')) {
            var buffer = await this._readArrayBuffer(file);
            //const blob = new Blob([buffer], { type: file.type });

            //const uint8Array = new Uint8Array(await blob.img.arrayBuffer());
            const uint8Array = new Uint8Array(buffer);

            // Converte Uint8Array para base64 antes de salvar
            let binaryString = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
            }
            const base64 = btoa(binaryString);

            // Obtém a extensão do arquivo de imagem.
            const fileExt = file?.name.split('.').pop().toLowerCase();

            data.img = base64;
            data.ext = fileExt;
        }

        return data;
    }

    /**
    * Converte um Blob para image.
    * @async
    * @param {Blob} blob                      - Os dados em Blob da imagem.
    * @param {string} ext                     - Os dados em Blob da imagem.
    * @returns {string}                       - A URL para construção do arquivo.
    */
    async blobToImage(blob, ext) {
        const imageType = `image/${ext}`;

        const binaryString = atob(blob); // Decodifica Base64 para binário
        const binaryData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            binaryData[i] = binaryString.charCodeAt(i);
        }
        const imageData = new Blob([binaryData], { type: imageType }); // Ajuste o tipo de imagem conforme necessário
        const imageURL = URL.createObjectURL(imageData);

        return imageURL;
    }

    /**
    * Realiza a mesclagem profunda de dois objetos, combinando propriedades recursivamente.
    * Se houver conflitos, as propriedades do objeto `source` sobrescrevem as do objeto `target`.
    * 
    * @param {Object} target    - O objeto de destino que será modificado e retornado.
    * @param {Object} source    - O objeto de origem cujas propriedades serão mescladas no objeto `target`.
    * @returns {Object}         - O objeto `target` após a mesclagem das propriedades.
    */
    mergeObjects(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object') {
                // Se a propriedade for um objeto, realiza a mesclagem recursivamente.
                target[key] = this.mergeObjects(target[key] || {}, source[key]);
            } else {
                // Caso contrário, sobrescreve a propriedade no objeto de destino.
                target[key] = source[key];
            }
        }
        return target;
    }
}