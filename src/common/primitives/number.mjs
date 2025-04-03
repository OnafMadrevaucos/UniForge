/**
* @see Number#between
* @ignore
*/
Number.between = function (num, a, b, inclusive = true) {
    let min = Math.min(a, b);
    let max = Math.max(a, b);
    return inclusive ? (num >= min) && (num <= max) : (num > min) && (num < max);
};

/**
 * Testa se um valor é numérico.
 * Este é o algoritmo de maior desempenho disponível atualmente, conforme https://jsperf.com/isnan-vs-typeof/5
 * @memberof Number
 * @param {*} n       - Um valor a ser testado
 * @return {boolean}  - É um número?
 */
export function isNumeric(n) {
    if (n instanceof Array) return false;
    else if ([null, ""].includes(n)) return false;
    return +n === +n;
}

/**
   * Tenta criar um número a partir de uma string fornecida pelo usuário.
   * @memberof Number
   * @param {string|number} n   - O valor a ser convertido; normalmente uma string, mas pode já ser um número.
   * @return {number}           - O número que a string representa, ou NaN se nenhum número puder ser determinado.
*/
export function fromString(n) {
    if (typeof n === "number") return n;
    if ((typeof n !== "string") || !n.length) return NaN;
    n = n.replace(/\s+/g, "");
    return Number(n);
}

console.log('UniForge | Atribuindo primitivos ao protótipo dos Numbers...');
// Atribui primitivos ao protótipo dos Numbers.
Object.defineProperties(Number, {
    isNumeric: { value: isNumeric, configurable: true },
    fromString: { value: fromString, configurable: true }
});