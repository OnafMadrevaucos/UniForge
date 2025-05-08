export default class CustomDate {
    constructor(calendar = {}, date = {}) {
      if (calendar && !calendar.empty()) {
        this.calendar = calendar;
      };
  
      if (date && !date.empty()) {
        this.day = date.day ?? this.#day;
        this.month = date.month ?? this.#month;
        this.year = date.year ?? this.#year;
      }
    }
  
    #origin = {
      day: 1,
      month: 0,
      year: 1
    }
  
    #day = 1;
    #month = 0;
    #year = 0;
  
    #calendar = {
      clid: null,
      label: '',
      months: [],
      days: [],
      daysInMonth: []
    };
  
    get months() { return this.#calendar.months; }
    get days() { return this.#calendar.days; }
    get daysInMonth() { return this.#calendar.daysInMonth; }
  
    get calendar() { return this.#calendar; }
  
    get day() { return this.#day; }
    get month() { return this.#month; }
    get year() { return this.#year; }
  
    get monthName() { return this.months[this.month]; }
    get fullYear() {
      const suffix = this.year > 0 ? ' d.T.' : ' a.T.';
      return `${Math.abs(this.year)}${suffix}`;
    }
  
    get ticks() {
      const year = this.year;
      const month = this.month;
      const day = this.day;
  
      const originYear = this.#origin.year;
      const originMonth = this.#origin.month;
      const originDay = this.#origin.day;
  
      const secPerDay = 24 * 3600; // Segundos por dia.
  
      let totalDays = 0;
      if (year > originYear || (year === originYear && month > originMonth) || (year === originYear && month === originMonth && day > originDay)) {
        for (let i = originYear; i < year; i++) {
          totalDays += this.daysInMonth.reduce((a, b) => a + b, 0);
        }
        totalDays += this.daysInMonth.slice(0, month).reduce((a, b) => a + b, 0);
        totalDays += day - this.daysInMonth.slice(0, originMonth).reduce((a, b) => a + b, 0) - originDay;
      } else {
        for (let i = year; i < originYear; i++) {
          totalDays -= this.daysInMonth.reduce((a, b) => a + b, 0);
        }
        totalDays -= this.daysInMonth.slice(0, originMonth).reduce((a, b) => a + b, 0);
        totalDays -= originDay - (this.daysInMonth.slice(0, month).reduce((a, b) => a + b, 0) + day);
      }
  
      const ticks = totalDays * secPerDay;
  
      return ticks;
    }
    get isEmpty() {
      return this.#year === 0;
    }
  
  
    set calendar(value) {
      if (!value) {
        throw new Error('O calendário não pode ser nulo ou indefinido');
      }
  
      if (!('clid' in value) || !('label' in value) || !('months' in value) || !('days' in value) || !('daysInMonth' in value)) {
        throw new Error('O calendário deve ter os campos clid, label, months, days e daysInMonth');
      }
  
      if (typeof value.clid !== 'number') {
        throw new Error('O campo clid deve ser uma string');
      }
  
      if (typeof value.label !== 'string') {
        throw new Error('O campo label deve ser uma string');
      }
  
      if (!Array.isArray(value.months) || value.months.length === 0) {
        throw new Error('O campo months deve ser um array não vazio');
      }
  
      if (!Array.isArray(value.days) || value.days.length !== 7) {
        throw new Error('O campo days deve ser um array com 7 elementos');
      }
  
      if (!Array.isArray(value.daysInMonth) || value.daysInMonth.length !== value.months.length) {
        throw new Error('O campo daysInMonth deve ser um array com o mesmo número de elementos que o campo months');
      }
  
      this.#calendar = value;
    }
  
    set day(value) { this.#day = value; }
    set month(value) { this.#month = value; }
    set year(value) { this.#year = value; }
  
    selectDate(day, month, year) {
      this.day = day || this.day;
      this.month = month || this.month;
      this.year = year || this.year;
    }
  
    clearDate() {
      this.day = 1;
      this.month = 0;
      this.year = 0;
    }
  
    static getYearString(year) {
      const suffix = (year > 0 ? ' d.T.' : (year < 0 ? ' a.T.' : ''));
      return `${Math.abs(year)}${suffix}`;
    }
  
    valueOf() { return this.ticks; }
  
    toString(regex='DD-MM-YYYY') {
      if(this.isEmpty) return '';
    
      const year = this.year.toString().padStart(4, '0');
      const month = (this.month + 1).toString().padStart(2, '0');
      const day = this.day.toString().padStart(2, '0');
  
      const fullYear = this.fullYear;
      const monthName = this.monthName;
  
      const formatMap = {
        DD: day,
        MM: month,
        MMn: monthName,
        YYYY: year,
        YYYYs: fullYear
      };
  
      let pattern;
      if (typeof regex === "string") {
        pattern = regex;
      } else if (regex instanceof RegExp) {
        pattern = regex.source;
      } else {
        throw new Error("O parâmetro deve ser uma string ou uma expressão regular.");
      }
    
      const formattedDate = pattern.replace(/DD|MMn|MM|YYYYs|YYYY/g, (match) => formatMap[match] || match);
    
      return formattedDate;
    }
  }