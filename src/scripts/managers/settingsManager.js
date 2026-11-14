/**
 * Gerenciador de configurações persistentes baseado em `localStorage`.
 *
 * Fornece uma API simples para armazenar, recuperar, remover e limpar
 * pares chave/valor no armazenamento local do navegador.
 *
 * @class
 * @example
 * import { SettingsManager } from './SettingsManager.js';
 *
 * const settings = new SettingsManager();
 * settings.set('theme', 'dark');
 * console.log(settings.get('theme')); // 'dark'
 * settings.remove('theme');
 * settings.clear();
*/
export default class SettingsManager {
    /** @private @constant */
    static #TYPES_KEY = '__settings_types__';

    /**
     * Tipos suportados na (des)serialização. Usado tanto no `set`
     * quanto na reidratação. Adicione aqui se precisar de novos tipos.
     * @private @constant
     */
    static #TYPE_REGISTRY = {
        String, Number, Boolean, Object, Array, Date
    };

    /**
     * Mapa chave → construtor do tipo original.
     * `null` significa "o valor armazenado era `null`".
     * @private
     * @type {Map<string, Function|null>}
     * 
    */
    #key_type = new Map();

    constructor() {
        // SIMULANDO UMA PRIMEIRA INICIALIZAÇÃO 
        //this.clear();

        // Carrega os tipos de chaves previamente armazenados, se houver.
        this.#loadKeyTypes();

        if (!localStorage.getItem('app.initialized')) {
            // Inicializa o gerenciador de configurações e define os valores padrão.
            this.#setDefaults();
        }
    }

    /**
     * Recupera o valor associado à chave, convertido de volta
     * para o tipo com que foi armazenado via {@link SettingsManager#set}.
     *
     * Se o tipo não for conhecido (ex.: após um reload da janela),
     * retorna o valor bruto em string.
     *
     * @param {string} key - Chave a ser recuperada.
     * @returns {any} Valor no tipo original, ou `null` se a chave não existir.
    */
    get(key) {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        if (!this.#key_type.has(key)) return raw; // fallback: sem tipo registrado
        return this.#deserialize(raw, this.#key_type.get(key));
    }

    /**
     * Remove o par chave/valor associado à chave informada.
     *
     * @param {string} key - Chave a ser removida do armazenamento.
     * @returns {void}
    */
    remove(key) {
        localStorage.removeItem(key);
    }

    /**
     * Armazena o valor e registra o tipo para reconstruí-lo em {@link get}.
     *
     * A chave **precisa** conter ao menos um `.` (o trecho antes do primeiro
     * `.` é usado como *tag* por {@link list}). Ex.: `"settings.theme"`.
     *
     * @param {string} key - Chave sob a qual o valor será armazenado.
     * @param {string|number|boolean|object|null|Date} value - Valor a armazenar.
     * @returns {void}
     * @throws {TypeError} Se `key` não for string, não contiver `.`, ou começar com `.`.
     */
    set(key, value) {
        if (typeof key !== 'string' || !key.includes('.')) {
            throw new TypeError(
                `set(${JSON.stringify(key)}, ...): a chave deve conter sua TAG identificadora separada por um "." do nome da opção` +
                `(ex.: "settings.theme").`
            );
        }
        if (key.startsWith('.')) {
            throw new TypeError(
                `set(${JSON.stringify(key)}, ...): a chave não pode começar com "."`
            );
        }
        const Type = value === null ? null : value.constructor;
        this.#key_type.set(key, Type);
        localStorage.setItem(key, this.#serialize(value));

        // Persiste o mapa de tipos no localStorage.
        this.#saveKeyTypes();
    }

    /**
     * Lista todos os itens do `localStorage` cujo prefixo — o trecho
     * da chave **anterior ao primeiro `.`** — coincide com a tag informada.
     *
     * As chaves retornadas são as chaves completas; os valores já vêm
     * desserializados via {@link get}.
     *
     * @param {string} tag - Prefixo (antes do primeiro `.`) a ser buscado.
     *   A comparação é *case-sensitive*. Um `.` final opcional é ignorado,
     *   então `list('settings')` e `list('settings.')` são equivalentes.
     * @returns {Object} Objeto `{ chaveCompleta: valor }` dos itens encontrados.
     * @throws {TypeError} Se `tag` não for uma string não vazia.
     * @example
     * const s = new SettingsManager();
     * s.set('settings.theme', 'dark');
     * s.set('settings.fontSize', 14);
     * s.set('user.name', 'Ada');
     *
     * s.list('settings'); // { 'settings.theme': 'dark', 'settings.fontSize': 14 }
     * s.list('user');     // { 'user.name': 'Ada' }
     * s.list('nope');     // {}
    */
    list(tag) {
        if (typeof tag !== 'string' || tag.length === 0) {
            throw new TypeError('A tag deve ser uma string não vazia.');
        }
        const normalized = tag.endsWith('.') ? tag.slice(0, -1) : tag;

        const out = {};
        for (let i = 0; i < localStorage.length; i++) {
            const fullKey = localStorage.key(i);
            if (fullKey === null) continue;

            const dot = fullKey.indexOf('.');
            if (dot === -1) continue;                // chave sem '.', ignora
            if (fullKey.slice(0, dot) !== normalized) continue;

            out[fullKey] = this.get(fullKey);
        }
        return out;
    }

    /**
     * Retorna um array com todos os itens do `localStorage` cujo prefixo
     * (antes do primeiro `.`) coincide com a tag informada.
     *
     * Cada item do array é um objeto `{ tag, value }`, onde `tag` é a parte
     * **após** o primeiro `.` e `value` é o valor já desserializado via {@link get}.
     *
     * Equivalente em array de {@link list}; útil para `map`/`filter`/`forEach`.
     * Retorna `[]` se nenhum item casar com a tag.
     *
     * @param {string} tag - Prefixo a ser buscado (mesmas regras de {@link list}).
     * @returns {Array<{tag: string, value: any}>}
     * @throws {TypeError} Se `tag` não for uma string não vazia.
     * @example
     * const s = new SettingsManager();
     * s.set('settings.theme', 'dark');
     * s.set('settings.fontSize', 14);
     * s.toArray('settings');
     * // [{ tag: 'theme', value: 'dark' }, { tag: 'fontSize', value: 14 }]
    */
    toArray(tag) {
        return Object.entries(this.list(tag)).map(([name, value]) => ({
            tag: name.split('.')[1],
            value,
        }));
    }

    /**
     * Remove **todas** as chaves/valores do armazenamento local.
     *
     * Atenção: este método também apaga dados de outras aplicações
     * que compartilhem o mesmo domínio.
     *
     * @returns {void}
    */
    clear() {
        localStorage.clear();
    }

    /**
     * Define valores padrão para o gerenciador de configurações.
     * Chamado no construtor, mas pode ser chamado novamente para resetar
     * os valores para o estado inicial.
     *
     * @private
    */
    #setDefaults() {
        const hotkeys = [
            {
                type: 'action',
                key: 'Escape',
                label: 'Fechar/cancelar operação'
            },
            {
                type: 'action',
                key: 'Enter',
                label: 'Confirma operação'
            },
            {
                type: 'map',
                key: 'Ctrl + P',
                label: 'Desenha Polígono'
            },
            {
                type: 'map',
                key: 'Ctrl + C',
                label: 'Desenha Círculo'
            },
            {
                type: 'map',
                key: 'Ctrl + R',
                label: 'Desenha Retângulo'
            },
            {
                type: 'map',
                key: 'Ctrl + M',
                label: 'Insere Marcador'
            },
            {
                type: 'action',
                key: 'F1',
                label: 'Abrir Códex'
            },
            {
                type: 'action',
                key: 'F2',
                label: 'Abrir Linhas do Tempo'
            },
            {
                type: 'action',
                key: 'F9',
                label: 'Abre Gerenciador de Formas do Leaflet'
            },
            {
                type: 'action',
                key: 'F10',
                label: 'Abre Lista de Objetos do Leaflet'
            },
            {
                type: 'action',
                key: 'F12',
                label: 'Sobre o Uniforge'
            },
            {
                type: 'time',
                key: '<',
                label: 'Retrocede 1 Ano'
            },
            {
                type: 'time',
                key: 'Ctrl + <',
                label: 'Retrocede 10 Anos'
            },
            {
                type: 'time',
                key: '>',
                label: 'Avança 1 Ano'
            },
            {
                type: 'time',
                key: 'Ctrl + >',
                label: 'Avança 10 Ano'
            }
        ];

        this.set('misc.hotkeys', hotkeys);

        const styles = {
            fillColor: "var(--color-b)",
            fillOpacity: 0.5,
            color: "var(--dark-color-b)",
            opacity: 1,
            weight: 5,
            dashArray: "0, 0",
            line: "solid",
            stroke: true
        };

        this.set('leafletStyle.pathOptions', styles);
    }

    /**
     * Serializa um valor para string para armazenamento no `localStorage`.
     *
     * @private
     * @param {string|number|boolean|object|null|Date} value
     * @returns {string}
    */
    #serialize(value) {
        if (value === null) return 'null';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (value instanceof Date) return value.toISOString();
        return JSON.stringify(value);
    }

    /**
     * Desserializa o valor bruto de acordo com o tipo registrado.
     *
     * @private
     * @param {string} raw
     * @param {Function|null} Type
     * @returns {any}
    */
    #deserialize(raw, Type) {
        if (Type === null) return null;
        if (Type === String) return raw;
        if (Type === Number) return Number(raw);
        if (Type === Boolean) return raw === 'true';
        if (Type === Date) return new Date(raw);
        if (Type === Object || Type === Array) return JSON.parse(raw);
        return raw; // fallback defensivo
    }

    /**
     * Persiste o mapa `#key_type` no `localStorage`, sob a chave interna
     * {@link SettingsManager.#TYPES_KEY}.
     *
     * Converte `Function` → `Type.name`. Valores `null` viram a string
     * `'Null'` para evitar ambiguidade com nomes de classe. Tipos fora do
     * `#TYPE_REGISTRY` são gravados como `'Object'` (fallback coerente com
     * a serialização por `JSON.stringify`).
     *
     * @private
     * @returns {void}
    */
    #saveKeyTypes() {
        /** @type {Object<string, string>} */
        const snapshot = {};

        for (const [key, Type] of this.#key_type) {
            if (Type === null) {
                snapshot[key] = 'Null';
            } else if (SettingsManager.#TYPE_REGISTRY[Type.name] === Type) {
                snapshot[key] = Type.name;
            } else {
                // Tipo customizado → cai como Object (JSON.stringify o achata)
                snapshot[key] = 'Object';
            }
        }

        try {
            localStorage.setItem(
                SettingsManager.#TYPES_KEY,
                JSON.stringify(snapshot)
            );
        } catch (error) {
            // Cobre cota cheia e modo privado (Safari/iOS) que lançam no setItem.
            console.warn('SettingsManager: falha ao persistir tipos.', error);
        }
    }

    /**
     * Reidrata `#key_type` a partir da chave interna {@link SettingsManager.#TYPES_KEY}.
     *
     * - Ignora metadados de chaves que **não existem mais** no `localStorage`
     *   (auto-limpeza quando alguém apaga algo por fora).
     * - JSON inválido → descarta a chave interna e começa do zero.
     * - Nome de tipo desconhecido → cai em `String` (fallback defensivo).
     *
     * @private
     * @returns {void}
    */
    #loadKeyTypes() {
        let raw;
        try {
            raw = localStorage.getItem(SettingsManager.#TYPES_KEY);
        } catch {
            return; // localStorage indisponível
        }

        if (!raw) return;

        let snapshot;
        try {
            snapshot = JSON.parse(raw);
        } catch {
            localStorage.removeItem(SettingsManager.#TYPES_KEY);
            return;
        }

        if (!snapshot || typeof snapshot !== 'object') return;

        let changed = false;

        for (const [key, typeName] of Object.entries(snapshot)) {
            // Metadado órfão: a chave não existe mais no localStorage.
            if (localStorage.getItem(key) === null) {
                changed = true;
                continue;
            }

            if (typeName === 'Null') {
                this.#key_type.set(key, null);
                continue;
            }

            const Type = SettingsManager.#TYPE_REGISTRY[typeName];
            this.#key_type.set(key, Type ?? String);

            if (!Type) changed = true; // tipo desconhecido → normaliza depois
        }

        if (changed) this.#saveKeyTypes();
    }
}