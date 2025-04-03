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

console.log('UniForge | Atribuindo primitivos ao protótipo dos Arrays...');

Object.defineProperties(Array.prototype, {
    merge: { value: merge, configurable: true }
});