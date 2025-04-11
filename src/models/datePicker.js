export default class DatePicker {
  
  /** Modos de vizualização do DatePicker.
   * @type {Object}
   * @property {string} days - Vizualiza os dias do mês.
   * @property {string} months - Vizualiza os meses do ano.
   * @property {string} years - Vizualiza os anos.
   */
  static Views = {
    days: 'days',
    months: 'months',
    years: 'years'
  }

  constructor(id, date = {}) {
    /**
    * O identificador do HTMLElement que representa o DatePicker.
    * @type {string}
    * 
    */
    this.id = id;

    // Inicia com os dados informados o genrenciador interno de Data do DatePicker.
    if (date && !date.isEmpty()) this.date = date;   
  }

  #state = {
    configured: false,
    opened: false,
    view: DatePicker.Views.days,
    clickCount: {
      next: 0,
      prev: 0,
      lastNext: 0,
      lastPrev: 0,
      interval: null
    }
  }

  #selectedDate = new CustomDate();
  #lastDate = null;

  get dataGroup() {
    return document.getElementById(`${this.id}`);
  }
  get dateInput() {
    return this.dataGroup?.querySelector('#dateInput') ?? null;
  }
  get #hiddenInput() {
    return this.dataGroup?.querySelector('#dateHiddenInput') ?? null;
  }
  get dateDisplay() {
    return this.dataGroup?.querySelector('#dateDisplay') ?? null;
  }
  get calendar() {
    return this.dataGroup?.querySelector('#calendar') ?? null;
  }
  get calendarView() {
    return this.dataGroup?.querySelector('#calendarView') ?? null;
  }
  get calendarContent() {
    return this.dataGroup?.querySelector('#calendarContent') ?? null;
  }
  get monthYearDisplay() {
    return this.dataGroup?.querySelector('#monthYearDisplay') ?? null;
  }
  get prevGroupButton() {
    return this.dataGroup?.querySelector('#prevGroup') ?? null;
  }
  get nextGroupButton() {
    return this.dataGroup?.querySelector('#nextGroup') ?? null;
  }

  get configured() {
    return this.#state.configured;
  }
  get opened() {
    return this.#state.opened;
  }

  get days() {
    return this.#selectedDate.days;
  }
  get months() {
    return this.#selectedDate.months;
  }
  get daysInMonth() {
    return this.#selectedDate.daysInMonth;
  }
  get date() {
    return this.#selectedDate;
  }
  get lastDate() {
    return this.#lastDate;
  }
  get currentView() {
    return this.#state.view;
  }
  get currentDay() {
    return this.#selectedDate.day;
  }
  get currentMonth() {
    return this.#selectedDate.month;
  }
  get currentMonthName() {
    return this.#selectedDate.monthName;
  }
  get currentYear() {
    return this.#selectedDate.year;
  }
  get currentFullYear() {
    return this.#selectedDate.fullYear;
  }

  get value() {    
    return this.#selectedDate.toString('MMn DD, YYYYs');
  }
  get ticks() {
    return this.#selectedDate.ticks;
  }
  get isEmpty() {
    return this.#hiddenInput.value.isEmpty();
  }

  get nextButtonClickCount() {
    return this.#state.clickCount.next;
  }
  get prevButtonClickCount() {
    return this.#state.clickCount.prev;
  }
  get lastNextButtonClickTime() {
    return this.#state.clickCount.lastNext;
  }
  get lastPrevButtonClickTime() {
    return this.#state.clickCount.lastPrev;
  }
  get decrementInterval() {
    return this.#state.clickCount.interval;
  }

  set configured(value) {
    this.#state.configured = value;
  }
  set opened(value) {
    this.#state.opened = value;
  }

  set date(value) {
    this.configured = false;
    const oldDate = {
      day: this.#selectedDate.day,
      month: this.#selectedDate.month,
      year: this.#selectedDate.year
    };

    this.#lastDate = new CustomDate(this.#selectedDate.calendar, oldDate);
    this.#selectedDate.selectDate(value.day, value.month, value.year);
  }
  set currentView(value) {
    this.#state.view = value;
  }
  set currentDay(value) {
    const oldDate = {
      day: this.#selectedDate.day,
      month: this.#selectedDate.month,
      year: this.#selectedDate.year
    };

    this.#lastDate = new CustomDate(this.#selectedDate.calendar, oldDate);
    this.#selectedDate.selectDate(value.day, value.month, value.year);
    this.#selectedDate.day = value;
  }
  set currentMonth(value) {
    const oldDate = {
      day: this.#selectedDate.day,
      month: this.#selectedDate.month,
      year: this.#selectedDate.year
    };

    this.#lastDate = new CustomDate(this.#selectedDate.calendar, oldDate);
    this.#selectedDate.selectDate(value.day, value.month, value.year);
    this.#selectedDate.month = value;
  }
  set currentYear(value) {
    const oldDate = {
      day: this.#selectedDate.day,
      month: this.#selectedDate.month,
      year: this.#selectedDate.year
    };

    this.#lastDate = new CustomDate(this.#selectedDate.calendar, oldDate);
    this.#selectedDate.selectDate(value.day, value.month, value.year);
    this.#selectedDate.year = value;
  }

  set nextButtonClickCount(value) {
    this.#state.clickCount.next = value;
  }
  set prevButtonClickCount(value) {
    this.#state.clickCount.prev = value;
  }
  set lastNextButtonClickTime(value) {
    this.#state.clickCount.lastNext = value;
  }
  set lastPrevButtonClickTime(value) {
    this.#state.clickCount.lastPrev = value;
  }
  set decrementInterval(value) {
    this.#state.clickCount.interval = value;
  }

  /**
   * Configura o DatePicker com um calendário customizado.
   * @param {object} calendar - Objeto com os dados do calendário a ser configurado.
   *   Contém as propriedades `months`, `days` e `daysInMonth`.
   * @param {boolean} [refresh=true] - Flag para limpar o texto do input de data
   *   ao configurar o DatePicker. Se `false`, o texto do input de data
   *   será mantido.
   */
  config(calendar, refresh = true) {
    // Defina meses, dias e anos customizados.
    this.#selectedDate = new CustomDate(calendar);

    if (refresh) {
      this.#clearCalendar(true);      
    }
    this.currentView = DatePicker.Views.days;
    this.changeView();

    this.configured = true;
  }

  // Função para atualizar o calendário conforme o modo
  update(reset = false) {
    this.#clearCalendar(reset);

    if (this.currentView === "years") {
      clearInterval(this.decrementInterval);
      this.decrementInterval = setInterval(() => {
        if (this.nextButtonClickCount > 0) {
          this.nextButtonClickCount--;
        }
        if (this.prevButtonClickCount > 0) {
          this.prevButtonClickCount--;
        }
      }, 1000); // Decrementa as contagens a cada 1 segundo de inatividade.
    } else {
      clearInterval(this.decrementInterval);
    }

    this.changeView(this.currentView);
  }

  updateDisplay(propagate = true) {
    if (!this.date.isEmpty) {
      this.dateDisplay.textContent = this.value;
      this.dataGroup.dataset.date = this.date.toString();

      this.#hiddenInput.value = this.date.toString();
      if (propagate) this.#hiddenInput.dispatchEvent(new Event('change'));
    }
  }

  /**
   * Carrega um calendário customizado no DatePicker.
   * @param {object} dateType - Objeto com os dados do calendário a ser carregado.
   * @param {boolean} [clearText=true] - Flag para limpar o texto do input de data
   *   ao carregar o calendário. Se `false`, o texto do input de data
   *   será mantido.
  
  show(dateType, clearText = true) {
    if(!this.opened) this.config(dateType, clearText);

    this.update(); // Inicializa o calendário.
  }
  */

  /**
  * Define a data máxima permitida para o DatePicker.
  * @param {CustomDate} date - A data máxima permitida.
  */
  setMaxDate(date) {
    this.maxDate = date;
    this.update();
  }

  /**
   * Define a data mínima permitida para o DatePicker.
   * @param {CustomDate} date - A data mínima permitida.
   */
  setMinDate(date) {
    this.minDate = date;
    this.update();
  }

  /**
   * Limpa a data selecionada e reset o input hidden.
   * @see {@link DatePicker#config} para mais informações sobre como configurar o DatePicker.
   */
  clearDate() {
    this.date.clearDate();
    this.#lastDate = null;

    this.dateDisplay.textContent = 'Selecione uma data';
    this.#hiddenInput.value = null;
  }

  /**
   * Adiciona um listener de eventos personalizado para o seletor de datas.
   * @param {string} event - O nome do evento a ser adicionado.
   * @param {Function} callback - A função a ser executada quando o evento for disparado.
   */
  addEventListener(event, callback) {
    this.#hiddenInput.addEventListener(event, callback);
  }

  /**
   * Configura ouvintes de eventos básicos para o seletor de datas.
   * @private
   */
  activateBaseListeners() {
    // Abre ou fecha o calendário ao clicar.
    this.dateInput.addEventListener('click', () => { this.onDatePickerClick(); });
    // Navegação entre datas futuras.
    this.nextGroupButton.addEventListener('click', (event) => { this.onNextGroupClick(event); });
    // Navegação entre datas anteriores.
    this.prevGroupButton.addEventListener('click', (event) => { this.onPrevGroupClick(event); });
    // Alterna a visualização de acordo com o clique no monthYearDisplay
    this.monthYearDisplay.addEventListener('click', (event) => { this.onMonthYearClick(event); });

    // Fecha o calendário se clicar fora dele.
    document.addEventListener('click', (event) => { this.onOutsideClick(event); });

    this.configured = true;
  }

  onDatePickerClick() {
    const calendar = this.calendar;
    const dateDisplay = this.dateDisplay;
    const calendarRect = calendar.getBoundingClientRect();
    const dateDisplayRect = dateDisplay.getBoundingClientRect();

    calendar.style.top = `${dateDisplayRect.bottom}px`;
    calendar.style.left = `${dateDisplayRect.left}px`;

    calendar.classList.toggle('open');
    this.opened = true;
  }
  onNextGroupClick(event) {
    event.stopPropagation(); // Impede que o clique "vaze" para o container e feche o calendário.

    this.prevButtonClickCount = 0;
    const currentTime = Date.now();

    if (this.currentView === "days") {
      this.currentMonth++;
      if (this.currentMonth >= this.months.length) {
        this.currentMonth = 0;  // Volta para o primeiro mês
        this.currentYear++;  // Incrementa o ano
      }
    } else if (this.currentView === "months") {
      this.currentYear++;
    } else if (this.currentView === "years") {
      if (this.nextButtonClickCount < 10) {
        this.currentYear += 10;
      } else if (this.nextButtonClickCount < 20) {
        this.currentYear += 100;
      } else {
        this.currentYear += 1000;
      }

      // A alteração no incremento de 10 para 100 e para 1000 anos deve ser feito apenas se o último clique
      // ocorreu a menos de 500 ms.
      if (currentTime - this.lastNextButtonClickTime < 500) this.nextButtonClickCount++;
      this.lastNextButtonClickTime = currentTime;
    }

    if (this.currentYear == 0) this.currentYear++;

    this.update();
  }
  onPrevGroupClick(event) {
    event.stopPropagation(); // Impede que o clique "vaze" para o container e feche o calendário.

    this.nextButtonClickCount = 0;
    const currentTime = Date.now();

    if (this.currentView === "days") {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = this.months.length - 1;  // Volta para o último mês.
        this.currentYear--;  // Decrementa o ano.
      }
    } else if (this.currentView === "months") {
      this.currentYear--;
    } else if (this.currentView === "years") {
      if (this.prevButtonClickCount < 10) {
        this.currentYear -= 10;
      } else if (this.prevButtonClickCount < 20) {
        this.currentYear -= 100;
      } else {
        this.currentYear -= 1000;
      }
      this.prevButtonClickCount++;

      // A alteração no decremento de 10 para 100 e para 1000 anos deve ser feito apenas se o último clique
      // ocorreu a menos de 500 ms.
      if (currentTime - this.lastPrevButtonClickTime < 500) this.prevButtonClickCount++;
      this.lastPrevButtonClickTime = currentTime;
    }

    if (this.currentYear == 0) this.currentYear--;

    this.update();
  }
  onMonthYearClick(event) {
    event.stopPropagation(); // Impede que o clique "vaze" para o container e feche o calendário.

    this.nextButtonClickCount = 0;
    this.prevButtonClickCount = 0;

    if (this.currentView === 'days') {
      this.currentView = 'months';  // Primeira troca: mostra meses do ano.
    } else if (this.currentView === 'months') {
      this.currentView = 'years';  // Segunda troca: mostra anos.
    } else if (this.currentView === 'years') {
      this.currentView = 'days';  // Terceira troca: volta para dias.
    }
    this.update();
  }
  onOutsideClick(event) {
    if (this.opened && !this.dateInput?.contains(event.target)) {
      this.currentView = DatePicker.Views.days;
      this.updateDisplay();

      this.calendar.classList.remove('open');
      this.opened = false;
    }
  }    

  // Função para atualizar o calendário conforme o valor da data selecionada.
  #clearCalendar(reset = false) {
    this.calendarContent.innerHTML = '';

    if (reset) {
      this.clearDate();
      this.currentView = DatePicker.Views.days;
    }
    this.monthYearDisplay.textContent = `${this.currentMonthName}, ${this.currentFullYear}`;

    this.calendarView.classList.remove(...this.calendarView.classList);
    this.calendarView.classList.add("calendar-view", this.currentView);    
  }

  changeView(newView = this.currentView) {
    // Adiciona a classe de animação
    this.calendarView.classList.add('zoom-out');
    // Aguarda a conclusão da animação antes de mudar a visualização
    setTimeout(() => {
      this.calendarView.classList.remove('zoom-out');

      // Lógica para mudar a visualização (ajustar para sua lógica específica)
      switch (newView) {
        case 'days':
          this.showDays();
          break;
        case 'months':
          this.showMonths();
          break;
        case 'years':
          this.showYears();
          break;
      }
    }, 100);
  }

  // Seleciona um mês
  selectMonth(month) {
    this.currentMonth = month;
    this.currentView = 'days';  // Volta para a exibição de dias após escolher o mês
    this.update();
  }

  // Seleciona um ano
  selectYear(year) {
    this.currentYear = year;
    this.currentView = 'months';  // Volta para a exibição de meses após escolher o ano
    this.update();
  }

  // Seleciona a data
  selectDate(day) {
    this.date = { day: day, month: this.currentMonth, year: this.currentYear };
    this.update();
  }

  // Seleciona a data completa
  selectFullDate(day, month, year) {
    this.date.selectDate(day, month, year);

    this.updateDisplay(false);
    this.update();
  }

  // Exibe os dias do mês
  showDays() {
    // Exibe os dias da semana.
    this.days.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.textContent = day;
      dayHeader.style.fontWeight = 'bold';
      this.calendarContent.appendChild(dayHeader);
    });

    // Exibe os dias do mês.
    const daysInCurrentMonth = this.daysInMonth[this.currentMonth];
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const day = document.createElement('div');
      day.textContent = i;
      day.className = 'day';
      day.addEventListener('click', () => this.selectDate(i));
      this.calendarContent.appendChild(day);

      if (!this.isDayValid(i)) {
        day.classList.add('invalid');
      }

      const date = new CustomDate(this.date.calendar, { 
        day: i, 
        month: this.currentMonth, 
        year: this.currentYear 
      });

      if(!this.date.isEmpty && date.ticks == this.date.ticks) {
        day.classList.add('selected');
      }
    }
  }

  // Exibe os meses do ano
  showMonths() {
    // Exibe os meses do ano.
    this.months.forEach((monthName, index) => {
      const month = document.createElement('div');
      month.textContent = monthName;
      month.className = 'month';
      month.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectMonth(index)
      });
      this.calendarContent.appendChild(month);

      if (!this.isMonthValid(index)) {
        month.classList.add('invalid');
      }
    });
  }

  // Exibe as décadas
  showYears() {
    // Calcula os 20 anos pertencentes ao intervalo 9 anteriores e 10 posteriores.
    const years = Array.from({ length: 20 }, (_, i) => this.currentYear - 9 + i).filter(year => year !== this.currentYear && year !== 0);

    years.forEach((year) => {
      const yearDiv = document.createElement('div');
      yearDiv.textContent = CustomDate.getYearString(year);
      yearDiv.className = 'year';
      yearDiv.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectYear(year);
      });
      this.calendarContent.appendChild(yearDiv);

      if (!this.isYearValid(year)) {
        yearDiv.classList.add('invalid');
      }
    });
  }

  isYearValid(year) {
    if (this.minDate && year < this.minDate.year) return false;
    if (this.maxDate && year > this.maxDate.year) return false;
    return true;
  }

  isMonthValid(month) {
    const year = this.lastDate?.year ?? this.currentYear;

    if (this.minDate && year < this.minDate.year) return false;
    if (this.minDate && year === this.minDate.year && month < this.minDate.month) return false;

    if (this.maxDate && year > this.maxDate.year) return false;
    if (this.maxDate && year === this.minDate.year &&  month > this.maxDate.month) return false;

    return true;
  }

  isDayValid(day) {
    const date = new CustomDate(this.date.calendar, { 
      day: day, 
      month: this.currentMonth, 
      year: this.currentYear 
    });

    if (this.minDate && date < this.minDate) return false;
    if (this.maxDate && date > this.maxDate) return false;
    return true;
  }
}

class CustomDate {
  constructor(calendar = {}, date = {}) {
    if (!calendar.isEmpty()) {
      this.calendar = calendar;
    };

    if (!date.isEmpty()) {
      this.day = date.day;
      this.month = date.month;
      this.year = date.year;
    }
  }

  #origin = {
    day: 1,
    month: 0,
    year: 1
  }

  #day = 1;
  #month = 0;
  #year = 1;

  #calendar = {
    clid: null,
    label: '',
    months: [],
    days: [],
    daysInMonth: []
  };

  #isEmpty = true;

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
    return this.#isEmpty;
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

  set day(value) { this.#day = value; this.#isEmpty = false; }
  set month(value) { this.#month = value; this.#isEmpty = false; }
  set year(value) { this.#year = value; this.#isEmpty = false; }

  selectDate(day, month, year) {
    this.day = day || this.day;
    this.month = month || this.month;
    this.year = year || this.year;

    this.#isEmpty = false;
  }

  clearDate() {
    this.day = this.#origin.day;
    this.month = this.#origin.month;
    this.year = this.#origin.year;

    this.#isEmpty = true;
  }

  static getYearString(year) {
    const suffix = year > 0 ? ' d.T.' : ' a.T.';
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