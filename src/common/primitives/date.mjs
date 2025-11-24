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

  /**
   * Retorna a quantidade de ticks (em segundos) desde a data de origem até a data atual.
   * A data de origem é uma data no calendário padrão, cujo dia, mÊs e ano são 1.
   * O cálculo é feito considerando a quantidade de dias em cada mês e ano.
   * @returns {number} A quantidade de ticks desde a data de origem até a data atual.
   */
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


  /**
   * Verifica se a data está vazia.
   * Uma data é considerada vazia se o ano for 0.
   * @returns {boolean} `true` se a data for vazia, caso contrário `false`.
   */
  get isEmpty() {
    return this.#year === 0;
  }


  /**
   * Define o calendário interno do objeto CustomDate.
   * @param {Object} value - O calendário a ser definido.
   * @throws {Error} - Se o calendário for nulo ou indefinido, ou se não tiver os campos clid, label, months, days e daysInMonth, ou se os tipos dos campos forem inválidos.
   */
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

  /**
  * Seleciona a data completa
  * @param {number} [day=CustomDate.day] O dia da data
  * @param {number} [month=CustomDate.month] O mês da data
  * @param {number} [year=CustomDate.year] O ano da data
  */
  selectDate(day, month, year) {
    this.day = day || this.day;
    this.month = month || this.month;
    this.year = year || this.year;
  }

  /**
   * Retorna um objeto com as propriedades day, month e year
   * @returns {[day: number, month: number, year: number]} Um array contendo o dia, mês e ano da data
   * @example
   * const date = new CustomDate();
   * const expandedDate = date.expand();
   * console.log(expandedDate); // {day: 1, month: 0, year: 0}
   */
  expand() {
    return [
      this.day,
      this.month,
      this.year
    ];
  }

/**
 * Limpa a data completa e define-a como vazia (dia = 1, m  s = 0, ano = 0).
 * @description
 * Esta função limpa a data e define-a com os valores padrão de um calendário.
 * Ela pode ser usada para resetar a data atual e defini-la como vazia.
 * @example
 * const date = new CustomDate();
 * date.clearDate();
 * console.log(date.day); // 1
 * console.log(date.month); // 0
 * console.log(date.year); // 0
 */
  clearDate() {
    this.day = 1;
    this.month = 0;
    this.year = 0;
  }

  /**
   * Retorna a string representando o ano com o sufixo "d.T." ou "a.T." dependendo do sinal do ano.
   * Se o ano for maior que zero, o sufixo "d.T." ser  adicionado.
   * Se o ano for menor que zero, o sufixo "a.T." ser  adicionado.
   * Se o ano for igual a zero, o sufixo ser  vazio.
   * @param {number} year O ano a ser convertido para string.
   * @returns {string} A string representando o ano com o sufixo.
   * @example
   * const yearString = CustomDate.getYearString(2019);
   * console.log(yearString); // "2019 d.T."
   */
  static getYearString(year) {
    const suffix = (year > 0 ? ' d.T.' : (year < 0 ? ' a.T.' : ''));
    return `${Math.abs(year)}${suffix}`;
  }

  valueOf() { return this.ticks; }

  /**
   * Converte a data para uma string de acordo com o padrão de data especificado.
   * @param {string|RegExp} [regex='DD-MM-YYYY'] O padrão de data a ser seguido.
   *  Se o parâmetro for uma string, ele ser é usado como padrão de data.
   *  Se o parâmetro for uma expressão regular, a string de fonte da expressão será usada como padrão de data.
   *  Se o parâmetro for omitido, o padrão de data ser é 'DD-MM-YYYY'.
   * @returns {string} A string representando a data completa no padr o especificado.
   * @example
   * const date = new CustomDate();
   * const formattedDate = date.toString('DD/MM/YYYY');
   * console.log(formattedDate); // "01/01/0000"
   */
  toString(regex = 'DD-MM-YYYY') {
    if (this.isEmpty) return '';

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