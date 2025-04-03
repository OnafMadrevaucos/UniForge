/**
     * Converte texto CSS em um formato JSON simplificado, extraindo regras específicas.
     * Ignora seletores iniciados por `@` e remove comentários.
     * 
     * @function parseCssToJson
     * @param {string} cssText      - O texto CSS a ser parseado.
     * @returns {Array<Object>}     - Uma lista de objetos contendo os seletores e suas propriedades específicas (como `--fa`).
     * 
     * @example
     * const cssText = ` 
     * .fa-user:before { --fa: "\\f007"; content: "\\f007"; }
     * .fa-camera:before { --fa: "\\f030"; content: "\\f030"; }
     * `;
     * 
     * const result = parseCssToJson(cssText);
     * console.log(result);
     * // [
     * //   { selector: "fa-user:before", unicode: { "--fa": "\\f007", "content": "\\f007" } },
     * //   { selector: "fa-camera:before", unicode: { "--fa": "\\f030", "content": "\\f030" } }
     * // ]
     */
export function parseCssToJson(cssText) {
    console.log('UniForge | Transformando CSS em JSON...');
    /**
     * Array que armazenará as regras CSS convertidas.
     * @type {Array<Object>}
     */
    const json = [];

    // Remover comentários no formato /* ... */
    /**
     * Texto CSS limpo sem comentários.
     * @type {string}
     */
    const cleanedCssText = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

    /**
     * Lista de blocos de CSS extraídos do texto.
     * Cada bloco é definido por seletores e suas propriedades.
     * @type {Array<string>|null}
     */
    const blocks = cleanedCssText.match(/([^{}]+)\{([^{}]*)\}/g);

    if (!blocks) return json; // Retorna vazio se não houver regras

    // Iterar sobre cada bloco encontrado
    blocks.forEach(block => {
        /**
         * Separa os seletores e as propriedades de estilo.
         * @type {Array<string>}
         */
        const [selectors, styles] = block.split('{').map(s => s.trim());

        // Ignorar blocos com seletores que começam com '@' (exemplo: @media)
        if (selectors.startsWith('@')) return;

        /**
         * Divide as propriedades do bloco em pares chave-valor.
         * Remove entradas vazias ou inválidas.
         * @type {Array<string>}
         */
        const stylesArray = styles.split(';').map(s => s.trim()).filter(Boolean);

        /**
         * Filtra propriedades que não contenham a chave `}` (corrige blocos mal formados).
         * @type {Array<string>}
         */
        const filteredStyles = stylesArray.filter(s => !s.includes('}'));

        /**
         * Converte a lista de propriedades para um objeto de chave-valor.
         * @type {Object<string, string>}
         */
        const stylesObject = Object.fromEntries(
            filteredStyles.map(style => {
                const [property, value] = style.split(':').map(s => s.trim());
                return [property, value];
            })
        );

        // Adicionar apenas regras com a propriedade `--fa` (usada pelo FontAwesome)
        if (stylesObject['--fa']) {
            json.push({
                /**
                 * O seletor CSS (sem o ponto inicial ou outro prefixo).
                 * @type {string}
                 */
                selector: selectors.trim().slice(1),

                /**
                 * Propriedades específicas do seletor.
                 * @type {Object<string, string>}
                 */
                unicode: stylesObject
            });
        }
    });

    return json;
}