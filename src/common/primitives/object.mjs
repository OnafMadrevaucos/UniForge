console.log('UniForge | Atribuindo primitivos ao protótipo dos Objects...');

function isEmpty() {
    return !Object.keys(this).length || !Object.values(this).length === 0;
}

Object.defineProperties(Object.prototype, {
    isEmpty: { value: isEmpty, configurable: true }
});