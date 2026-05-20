export default class Dictionary extends Set {
    /**
     * Adiciona um item.
     * 
     * Formas:
     * 
     * add(obj)
     * add('grupo.item', obj)
     * 
     * @param {String|Object} target
     * @param {Object|null} value
     * @returns {NestedSet}
     */
    add(target, value = null) {

        /**
         * =========================================
         * add(obj)
         * =========================================
         */
        if (typeof target === 'object') {

            this.#validateItem(target);

            return super.add(target);
        }

        /**
         * =========================================
         * add('x.y', obj)
         * =========================================
         */
        if (typeof target === 'string') {

            if (!target.includes('.')) {
                throw new Error(
                    'O identificador deve seguir o padrão "x.y".'
                );
            }

            if (!value) {
                value = '';
            }           

            const [parentId, childId] = target.split('.');

            // Busca o pai.
            let parent = this.get(parentId);

            if (!parent) {
                const a = this.add({
                    _id: parentId,
                    _items: new Set()
                });

                parent = this.get(parentId);
            }

            // Adiciona no _items.
            parent._items.add({_id: childId, _value: value});

            return this;
        }

        throw new Error(
            'Parâmetros inválidos.'
        );
    }

    /**
     * Busca um item do Set.
     * 
     * Exemplos:
     *  get('usuarios')
     *  get('usuarios.admin')
     * 
     * @param {String} identifier
     * @returns {*|undefined}
     */
    get(identifier) {

        // Busca simples, retorna todo o grupo de itens.
        if (!identifier.includes('.')) {
            return this.#findById(this, identifier);
        }

        // Busca hierárquica.
        const [parentId, childId] = identifier.split('.');

        // Busca item pai.
        const parent = this.#findById(this, parentId);

        if (!parent) return undefined;

        // Verifica existência do _items.
        if (!(parent._items instanceof Set)) {
            return undefined;
        }

        // Busca item interno.
        return parent._items.get(childId);
    }

    /**
     * Procura um item em um Set pelo _id.
     * 
     * @private
     * @param {Set} set
     * @param {String} id
     * @returns {*|undefined}
     */
    #findById(set, id) {
        for (const item of set.toArray()) {
            if (item && typeof item === 'object' && item._id === id) {
                return item;
            }
        }

        return undefined;
    }

    /**
     * Valida item.
     * 
     * @private
     */
    #validateItem(item) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            throw new Error('O item deve ser um Object.');
        }

        if (!item.hasOwnProperty('_items')) {
            throw new Error('O objeto deve possuir "_items".');
        }

        if (!(item._items instanceof Set)) {
            throw new Error('A propriedade "_items" deve ser um Set.');
        }
    }
}