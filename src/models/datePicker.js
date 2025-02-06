export default class DatePicker
{  
  constructor(pickerId, date={}) {
    this.pickerId = pickerId;    

    this.ready = false;

    this.selectedDate = { 
      day: date?.day ?? null,
      month: date?.month ?? 0,
      year: date?.year ?? 1 
    };  // Sem uso do Date, valores customizados.

    this.currentMonth = this.selectedDate.month;
    this.currentYear = this.selectedDate.year;  

    // Modos de visualização.
    this.currentView = 'days'; // 'days', 'months', 'years'.

    // Defina meses, dias e anos customizados.
    this.months = null;
    this.days = null;
    this.daysInMonth = null;

    this.nextButtonClickCount = 0;
    this.prevButtonClickCount = 0;

    this.lastNextButtonClickTime = 0;
    this.lastPrevButtonClickTime = 0;

    this.decrementInterval = null;
  }

  get dataGroup() {
    return document.getElementById(`${this.pickerId}`);
  }
  get dateInput() {
    return this.dataGroup?.querySelector('#dateInput') ?? null;
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
  
  _setupDatePicker() {  
    // Abre ou fecha o calendário ao clicar
    this.dateInput.addEventListener('click', () => {
      this.calendar.classList.toggle('open');
    });
    
    this.nextGroupButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Impede que o clique "vaze" para o container e feche o calendário.

      this.prevButtonClickCount = 0;
      const currentTime = Date.now();

      if(this.currentView === "days") {
        this.currentMonth++;
        if (this.currentMonth >= this.months.length) {
          this.currentMonth = 0;  // Volta para o primeiro mês
          this.currentYear++;  // Incrementa o ano
        }
      } else if(this.currentView === "months") {
        this.currentYear++;
      } else if(this.currentView === "years") {
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
      this.updateCalendar();
    });

    // Navegação entre meses
    this.prevGroupButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Impede que o clique "vaze" para o container e feche o calendário.

      this.nextButtonClickCount = 0;
      const currentTime = Date.now();

      if(this.currentView === "days") {
        this.currentMonth--;
        if (this.currentMonth < 0) {
          this.currentMonth = this.months.length - 1;  // Volta para o último mês.
          this.currentYear--;  // Decrementa o ano.
        }
      } else if(this.currentView === "months") {
        this.currentYear--;
      } else if(this.currentView === "years") {
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
      this.updateCalendar();
    });
    
    // Fecha o calendário se clicar fora
    document.addEventListener('click', (e) => {
      if (this.calendar?.classList.contains('open') && !this.dateInput?.contains(e.target)) {
        this.currentView = 'days';
        this.updateCalendar();
  
        this.calendar.classList.remove('open');
      }
    });  
  
    // Alterna a visualização de acordo com o clique no monthYearDisplay
    this.monthYearDisplay.addEventListener('click', (event) => {
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
      this.updateCalendar();
    });    

    this.ready = true;
  }

  _reloadDatePicker(dateType, clearText=true) {
    // Se o DatePicker ainda não foi inicializado, inicialize-o
    if(!this.ready) this._setupDatePicker();

    if(clearText) this.dateDisplay.textContent = 'Selecione uma data';

    // Defina meses, dias e anos customizados
    this.months = dateType.months;
    this.days = dateType.days;
    this.daysInMonth = dateType.daysInMonth;
  }

  _loadDatePicker(dateType, clearText=true) {
    this._reloadDatePicker(dateType, clearText);
    
    this.updateCalendar(); // Inicializa o calendário
  }

  // Função para atualizar o calendário conforme o modo
  updateCalendar() {
    this.refreshCalendar();

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
  // Função para atualizar o calendário conforme o valor da data selecionada.
  refreshCalendar() {
    this.calendarContent.innerHTML = '';
    this.monthYearDisplay.textContent = `${this.months[this.currentMonth]} ${this.currentYear}`;

    this.calendarView.classList.remove(...this.calendarView.classList);
    this.calendarView.classList.add("calendar-view", this.currentView);
  }

  changeView(newView) {
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
    this.updateCalendar();
  }

  // Seleciona um ano
  selectYear(year) {
    this.currentYear = year;
    this.currentView = 'months';  // Volta para a exibição de meses após escolher o ano
    this.updateCalendar();
  }  
  
  // Seleciona a data
  selectDate(day) {
    this.currentDay = day;

    this.selectedDate = { day: day, month: this.currentMonth, year: this.currentYear };
    this.dateDisplay.textContent = `${this.months[this.currentMonth]} ${day},  ${this.currentYear}`;
    this.dataGroup.dataset.date = `${day}/${this.months[this.currentMonth]}/${this.currentYear}`;
  }

  // Seleciona a data completa
  selectFullDate(day, month, year) {
    this.currentDay = day;
    this.currentMonth = month;
    this.currentYear = year;

    this.selectedDate = { day: day, month: this.currentMonth, year: this.currentYear };
    this.dateDisplay.textContent = `${this.months[this.currentMonth]} ${day},  ${this.currentYear}`;
    this.dataGroup.dataset.date = `${day}/${this.months[this.currentMonth]}/${this.currentYear}`;

    this.refreshCalendar();
  }

  // Exibe os dias do mês
  showDays() {    
    // Exibe os dias da semana
    this.days.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.textContent = day;
      dayHeader.style.fontWeight = 'bold';
      this.calendarContent.appendChild(dayHeader);
    });
    
    const daysInCurrentMonth = this.daysInMonth[this.currentMonth];
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const day = document.createElement('div');
      day.textContent = i;
      day.className = 'day';
      day.addEventListener('click', () => this.selectDate(i));
      this.calendarContent.appendChild(day);
    }
  }

  // Exibe os meses do ano
  showMonths() {   
    // Exibe os meses do ano
    this.months.forEach((monthName, index) => {
      const month = document.createElement('div');
      month.textContent = monthName;
      month.className = 'month';
      month.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectMonth(index)
      });
      this.calendarContent.appendChild(month);
    });
  }

  // Exibe as décadas
  showYears() {
    // Calcula os 20 anos pertencentes ao intervalo 9 anteriores e 10 posteriores
    const years = Array.from({ length: 20 }, (_, i) => this.currentYear - 9 + i).filter(year => year !== this.currentYear);

    years.forEach((year) => {
      const yearDiv = document.createElement('div');
      yearDiv.textContent = year;
      yearDiv.className = 'year';
      yearDiv.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectYear(year);
      });
      this.calendarContent.appendChild(yearDiv);
    });
  }
}