const FORMSPREE_URL = 'https://formspree.io/f/xpqggkdp';

let selectedLocation = '';
let selectedDate = '';
let selectedTime = '';

let currentCalendarDate = new Date();
const monthsRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

let noButtonClicks = 0;

document.addEventListener("DOMContentLoaded", () => {
    renderCalendar();

    const timeWrapper = document.getElementById("time-picker-wrapper");
    const hiddenTimeInput = document.getElementById("time-select");
    const defaultTime = "17:00"; 

    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hoursStr = h.toString().padStart(2, '0');
            const minsStr = m.toString().padStart(2, '0');
            const timeVal = `${hoursStr}:${minsStr}`;
            
            const card = document.createElement("div");
            card.className = "time-card";
            card.innerText = timeVal;
            card.setAttribute("data-time", timeVal);
            
            if (timeVal === defaultTime) {
                card.classList.add("selected");
            }
            
            card.addEventListener("click", function() {
                document.querySelectorAll(".time-card").forEach(c => c.classList.remove("selected"));
                this.classList.add("selected");
                hiddenTimeInput.value = this.getAttribute("data-time");
            });
            
            timeWrapper.appendChild(card);
        }
    }
    
    setTimeout(() => {
        const defaultCard = document.querySelector(`[data-time="${defaultTime}"]`);
        if (defaultCard) {
            defaultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 300);

    const noBtn = document.getElementById("no-btn-1");

    // Обрабатываем касание на смартфонах (срабатывает мгновенно до генерации клика)
    noBtn.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Полностью блокирует генерацию клика по координатам
        handleNoAction();
    }, { passive: false });

    // Обрабатываем наведение мышки на ПК
    noBtn.addEventListener("mouseenter", (e) => {
        handleNoAction();
    });

    // Страховочный клик
    noBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleNoAction();
    });
});

// Единая логика для кнопки "Нет"
function handleNoAction() {
    if (noButtonClicks >= 5) {
        document.getElementById("sad-modal").classList.add("active");
    } else {
        moveNoButton();
    }
}

function moveNoButton() {
    const noBtn = document.getElementById("no-btn-1");
    if (noButtonClicks < 5) {
        noButtonClicks++;
        noBtn.classList.add("runaway");
        
        const phrases = ["Нет", "Правда нет? 😢", "А если подумать? 🤔", "Мимо! 😜", "Ой, не туда! 🎯"];
        noBtn.innerText = phrases[noButtonClicks] || "Нет";

        // Вычисляем случайные координаты так, чтобы кнопка не перекрывала кнопку "Давай" на первом шаге
        const x = Math.random() * (window.innerWidth - 150);
        let y = Math.random() * (window.innerHeight - 60);

        // Если кнопка улетает слишком близко к центру экрана (где кнопка Давай), смещаем её повыше или пониже
        if (y > window.innerHeight / 2 - 100 && y < window.innerHeight / 2 + 100) {
            y = y < window.innerHeight / 2 ? y - 100 : y + 100;
        }
        
        noBtn.style.left = `${x}px`;
        noBtn.style.top = `${y}px`;
    }
}

function renderCalendar() {
    const grid = document.getElementById("calendar-days-grid");
    const monthYearLabel = document.getElementById("calendar-month-year");
    grid.innerHTML = "";
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    monthYearLabel.innerText = `${monthsRu[month]} ${year}`;
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startSpaces = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 0; i < startSpaces; i++) {
        grid.appendChild(document.createElement("div"));
    }
    
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement("div");
        dayCell.className = "cal-day";
        dayCell.innerText = day;
        
        const thisCellDate = new Date(year, month, day);
        
        if (thisCellDate < today) {
            dayCell.classList.add("disabled");
        } else {
            const dateStr = `${day.toString().padStart(2, '0')}.${(month + 1).toString().padStart(2, '0')}.${year}`;
            
            if (selectedDate === dateStr || (selectedDate === "" && thisCellDate.getTime() === today.getTime())) {
                dayCell.classList.add("selected");
                if(selectedDate === "") selectedDate = dateStr;
            }
            
            dayCell.addEventListener("click", function() {
                document.querySelectorAll(".cal-day").forEach(d => d.classList.remove("selected"));
                this.classList.add("selected");
                selectedDate = dateStr;
            });
        }
        grid.appendChild(dayCell);
    }
}

function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

function nextStep(stepNumber) {
    if (stepNumber === 3) {
        const inputVal = document.getElementById("location-input").value.trim();
        selectedLocation = inputVal !== "" ? inputVal : "Не указано";
    }
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
}

function showModal() {
    selectedTime = document.getElementById("time-select").value;
    document.getElementById("confirm-modal").classList.add("active");
}

function closeModal() {
    document.getElementById("confirm-modal").remove("active");
}

function startDeployment() {
    closeModal();
    document.getElementById("loader-overlay").classList.add("active");

    const formData = {
        "📍 Место": selectedLocation,
        "📅 Дата": selectedDate,
        "🕒 Время": selectedTime
    };

    fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        setTimeout(() => {
            if (response.ok) {
                document.getElementById("loading-box").classList.add("hidden");
                document.getElementById("success-box").classList.remove("hidden");
            } else {
                alert("Ошибка отправки через Formspree. Проверь URL формы.");
            }
        }, 2500);
    })
    .catch(error => {
        console.error(error);
        alert("Ошибка сети.");
    });
}
