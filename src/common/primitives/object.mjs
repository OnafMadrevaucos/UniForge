console.log('UniForge | Atribuindo primitivos ao protótipo dos Objects...');

function empty() {
    return !Object.keys(this).length || !Object.values(this).length === 0;
}

Object.defineProperties(Object.prototype, {
    empty: { value: empty, configurable: true }
});