const { replaceComboTags, replaceSwitchTags, replaceCalendarTags } = require('./uniforge-esm');

describe('replaceComboTags', () => {
    test('should replace <combo> tags with <select> elements', () => {
        const html = '<combo id="exampleCombo" value="exampleKey" blank="true" />';
        const data = {
            exampleKey: ['Option1', 'Option2', 'Option3']
        };
        const result = replaceComboTags(html, data);
        expect(result).toBe(`
        <select id="exampleCombo" class="data" name="exampleCombo">
            <option value="true">&#8212</option>
            <option value="Option1">Option1</option>
            <option value="Option2">Option2</option>
            <option value="Option3">Option3</option>
        </select>`);
    });

    test('should return empty <select> if key is not found in data', () => {
        const html = '<combo id="exampleCombo" value="missingKey" />';
        const data = {
            exampleKey: ['Option1', 'Option2', 'Option3']
        };
        const result = replaceComboTags(html, data);
        expect(result).toBe('<select id="exampleCombo" class="data" name="exampleCombo"></select>');
    });
});
describe('replaceComboTags', () => {
    test('should replace self-closing <combo> tags with <select> elements', () => {
        const html = '<combo id="exampleCombo" value="exampleKey" blank="true" />';
        const data = {
            exampleKey: ['Option1', 'Option2', 'Option3']
        };
        const result = replaceComboTags(html, data);
        expect(result).toBe(`
        <select id="exampleCombo" class="data" name="exampleCombo">
            <option value="true">&#8212</option>
            <option value="Option1">Option1</option>
            <option value="Option2">Option2</option>
            <option value="Option3">Option3</option>
        </select>`);
    });

    test('should replace non-self-closing <combo> tags with <select> elements', () => {
        const html = '<combo id="exampleCombo" value="exampleKey" blank="true"></combo>';
        const data = {
            exampleKey: ['Option1', 'Option2', 'Option3']
        };
        const result = replaceComboTags(html, data);
        expect(result).toBe(`
        <select id="exampleCombo" class="data" name="exampleCombo">
            <option value="true">&#8212</option>
            <option value="Option1">Option1</option>
            <option value="Option2">Option2</option>
            <option value="Option3">Option3</option>
        </select>`);
    });

    test('should return empty <select> if key is not found in data', () => {
        const html = '<combo id="exampleCombo" value="missingKey" />';
        const data = {
            exampleKey: ['Option1', 'Option2', 'Option3']
        };
        const result = replaceComboTags(html, data);
        expect(result).toBe('<select id="exampleCombo" class="data" name="exampleCombo"></select>');
    });
});

describe('replaceSwitchTags', () => {
    test('should replace self-closing <switch> tags with switch template', () => {
        const html = '<switch />';
        const result = replaceSwitchTags(html);
        expect(result).toBe(`
        <label class="switch">
            <input type="checkbox" id="checkbox">
            <div class="slider"></div>
        </label>`);
    });

    test('should replace non-self-closing <switch> tags with switch template', () => {
        const html = '<switch></switch>';
        const result = replaceSwitchTags(html);
        expect(result).toBe(`
        <label class="switch">
            <input type="checkbox" id="checkbox">
            <div class="slider"></div>
        </label>`);
    });
});

escribe('replaceCalendarTags', () => {
    test('should replace self-closing <calendar> tags with <div> elements', () => {
        const html = '<calendar id="exampleCalendar" class="extra-class" />';
        const result = replaceCalendarTags(html, {});
        expect(result).toBe(`
    <div class="date-input data extra-class" id="exampleCalendar">
        <div class="date-display" id="dateDisplay">Selecione uma data</div>
        <div class="calendar" id="calendar">
            <div class="calendar-header">
                <button id="prevGroup"><i class="fa-solid fa-caret-left"></i></button>
                <span id="monthYearDisplay"></span>
                <button id="nextGroup"><i class="fa-solid fa-caret-right"></i></button>
            </div>              
            <div class="calendar-view" id="calendarView">
                <div class="calendar-content" id="calendarContent"></div>
            </div>              
        </div>
    </div>`);
    });

    test('should replace non-self-closing <calendar> tags with <div> elements', () => {
        const html = '<calendar id="exampleCalendar" class="extra-class"></calendar>';
        const result = replaceCalendarTags(html, {});
        expect(result).toBe(`
    <div class="date-input data extra-class" id="exampleCalendar">
        <div class="date-display" id="dateDisplay">Selecione uma data</div>
        <div class="calendar" id="calendar">
            <div class="calendar-header">
                <button id="prevGroup"><i class="fa-solid fa-caret-left"></i></button>
                <span id="monthYearDisplay"></span>
                <button id="nextGroup"><i class="fa-solid fa-caret-right"></i></button>
            </div>              
            <div class="calendar-view" id="calendarView">
                <div class="calendar-content" id="calendarContent"></div>
            </div>              
        </div>
    </div>`);
    });
});