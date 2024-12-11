/**
 * Classe de Utilidades.  
 */
export default class Utils {
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