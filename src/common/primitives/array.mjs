/**
 * Retorna o primeiro elemento do array.
 * @memberof Array.prototype
 * 
 * @returns {*} O primeiro elemento do array, ou undefined em caso de erro.
 */
export function first() {
    if (this.length === 0) return undefined;
    return this[0];
}

/**
 * Retorna o ultimo elemento do array.
 * @memberof Array.prototype
 * 
 * @returns {*} O ultimo elemento do array, ou undefined em caso de erro.
 */
export function last() {
    if (this.length === 0) return undefined;
    return this[this.length - 1];
}

/**
 * Retorna a união de dois conjuntos.
 * @memberof Array.prototype
 * 
 * @param {Array} other  - Outro conjunto.
 * @returns {Array}      - O conjunto de elementos que existem em ambos, mas sem duplicatas.
 */
export function merge(other) {
    if (!(other instanceof Array)) throw new Error("Deve ser fornecida outra instância de Array.");
    return [... new Set([...this, ...other])];
}

/**
 * Verifica se o array está vazio.
 * @memberof Array.prototype
 * 
 * @returns {boolean} `true` se o array estiver vazio, caso contrário `false`.
 */

export function isEmpty() { 
    return this.length === 0; 
}

console.log('UniForge | Atribuindo primitivos ao protótipo dos Arrays...');

Object.defineProperties(Array.prototype, {
    first: { value: first, configurable: true },
    last: { value: last, configurable: true },
    merge: { value: merge, configurable: true },
    isEmpty: { value: isEmpty, configurable: true }
});