const baseManager = require('../src/scripts/managers/baseManager');

test('baseManager should do something', () => {
	expect(baseManager.someFunction()).toBe(someExpectedValue);
});

test('baseManager should handle errors', () => {
	expect(() => baseManager.someFunctionThatThrows()).toThrow();
});