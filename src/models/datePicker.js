import CustomDate from "../common/primitives/date.mjs";
import Application from "./application.js";

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

  constructor(id, parent = null, date = {}) {
    if(parent instanceof Application) this.parent = parent;
    if(!this.parent) throw new Error('O DatePicker precisa de uma aplicação.');   

    /**
    * O identificador do HTMLElement que representa o DatePicker.
    * @type {string}
    * 
    */
    this.id = id;

    // Inicia com os dados informados o genrenciador interno de Data do DatePicker.
    if (date && !date.empty()) this.date = date;
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
  #currentDate = new CustomDate(null, { day: 1, month: 0, year: 1 });

  get dataGroup() {
    return this.parent.querySelector(`#${this.id}`);
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
  get currentView() {
    return this.#state.view;
  }
  get currentDay() {
    return this.#currentDate.day;
  }
  get currentMonth() {
    return this.#currentDate.month;
  }
  get currentMonthName() {
    return this.#currentDate.monthName;
  }
  get currentYear() {
    return this.#currentDate.year;
  }
  get currentFullYear() {
    return this.#currentDate.fullYear;
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
    const calendar = this.calendar;

    if (value === true) calendar.classList.add('open');
    else calendar.classList.remove('open');

    this.#state.opened = value;
  }

  set date(value) {
    this.configured = false;
    this.#selectedDate.selectDate(value.day, value.month, value.year);
  }
  set currentView(value) {
    this.#state.view = value;
  }
  set currentDay(value) {
    this.#currentDate.day = value;
  }
  set currentMonth(value) {
    this.#currentDate.month = value;
  }
  set currentYear(value) {
    this.#currentDate.year = value;
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
    // Defina meses, dias e anos customizados.
    this.#currentDate = new CustomDate(calendar, { day: 1, month: 0, year: 1 });

    this.#clearCalendar(refresh);

    this.currentView = DatePicker.Views.days;
    this.changeView();

    this.configured = true;
  }

  // Função para atualizar o calendário conforme o modo
  update(reset = false, options = { doZoom: true, zoom: 'out', doSlide: false, slide: 'left' }) {

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

    this.changeView(this.currentView, reset, options);
  }

  updateView() {
    this.monthYearDisplay.textContent = `${this.currentMonthName}, ${this.currentFullYear}`;

    this.calendarView.classList.remove(...this.calendarView.classList);
    this.calendarView.classList.add("calendar-view", this.currentView);
  }

  updateDisplay(propagate = true) {
    if (!this.date.isEmpty) {
      this.dateDisplay.textContent = this.value;
      this.dataGroup.dataset.date = this.#currentDate.toString();

      this.#hiddenInput.value = this.date.toString();
      if (propagate) this.#hiddenInput.dispatchEvent(new Event('change'));
    }
  }

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
    if (!this.opened) {
      const calendar = this.calendar;
      const dateDisplay = this.dateDisplay;
      const dateDisplayRect = dateDisplay.getBoundingClientRect();

      calendar.style.top = `${dateDisplayRect.bottom}px`;
      calendar.style.left = `${dateDisplayRect.left}px`;

      if (this.currentYear === 0) this.currentYear = 1;

      if (!this.date.isEmpty) {
        this.#currentDate = new CustomDate(this.date.calendar, { day: this.date.day, month: this.date.month, year: this.date.year });
        this.changeView(this.currentView, false, { animate: false });
      }

      this.opened = true;
    } else {
      this.opened = false;
    }
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

    this.update(false, { doZoom: false, doSlide: true, slide: 'right' });
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

    this.update(false, { doZoom: false, doSlide: true, slide: 'left' });
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
  }

  changeView(newView = this.currentView, reset = false, options = {}) {
    options = uniforge.utils.mergeObjects({ animate: true, doZoom: true, zoom: 'out', doSlide: false, slide: 'left' }, options);

    // Se for para animar, busque as classes de animação selecionadas.
    if (options.animate) {
      // Obtém as classes de animação.
      const animClass = this._getAnimClass(options);

      // Há alguma animação a ser executada.
      if (animClass.length > 0)
        // Adiciona as classes de animação.
        this.calendarView.classList.add(animClass);

      // Aguarda a conclusão da animação antes de mudar a visualização.
      setTimeout(() => {
        // Limpa o calendário.
        this.#clearCalendar(reset);

        // Há alguma animação a ser finalizada.
        if (animClass.length > 0)
          // Remove as classes de animação.
          this.calendarView.classList.remove(animClass);

        // Lógica para mudar a visualização (ajustar para sua lógica específica).
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

        this.updateView();
      }, 300);
    } else {
      // Limpa o calendário.
      this.#clearCalendar(reset);

      // Lógica para mudar a visualização (ajustar para sua lógica específica).
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

      this.updateView();
    }
  }

  // Seleciona um mês
  selectMonth(month) {
    this.currentMonth = month;
    this.currentView = 'days';  // Volta para a exibição de dias após escolher o mês.
    this.update(false, {animate: false});
  }

  // Seleciona um ano
  selectYear(year) {
    this.currentYear = year;
    this.currentView = 'months';  // Volta para a exibição de meses após escolher o ano.
    this.update(false, {animate: false});
  }

  // Seleciona a data
  selectDate(day) {
    if (this.currentYear === 0) this.currentYear = 1;

    this.date = { day: day, month: this.currentMonth, year: this.currentYear };
    this.updateDisplay(false);
    this.update(false, {animate: false});
  }

  // Seleciona a data completa
  selectFullDate(day, month, year) {
    this.date.selectDate(day, month, year);

    this.updateDisplay(false);
    this.update(false, {animate: false});
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

      if (!this.date.isEmpty && date.ticks == this.date.ticks) {
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
    const year = this.currentYear;

    if (this.minDate && year < this.minDate.year) return false;
    if (this.minDate && year === this.minDate.year && month < this.minDate.month) return false;

    if (this.maxDate && year > this.maxDate.year) return false;
    if (this.maxDate && year === this.maxDate.year && month > this.maxDate.month) return false;

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

  _getAnimClass(options = { doZoom: true, zoom: 'out', doSlide: false, slide: 'left' }) {
    const animClass = [];
    if (options.doZoom) animClass.push(`zoom-${options.zoom}`);
    if (options.doSlide) animClass.push(`slide-${options.slide}`);
    return animClass;
  }
}