// hooks.js
const hooks = {};

function registerHook(hookName, callback) {
  if (!hooks[hookName]) {
    hooks[hookName] = [];
  }
  hooks[hookName].push(callback);
}

async function triggerHook(hookName, ...args) {
  if (hooks[hookName]) {
    await Promise.all(hooks[hookName].map(callback => {
        if (typeof callback === 'function') {
          return callback(...args);
        } else {
          return Promise.resolve();
        }
      }));
  }

  return true;
}

export { registerHook, triggerHook };