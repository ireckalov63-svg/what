const TELEGRAM_BOT_TOKEN = '8843669108:AAGTYvB4dsTl3A_klUgWSfua4BPLfV63XB8';
const TELEGRAM_CHAT_ID = '568583469';

let selectedLocation = '';
let selectedDate = '';
let selectedTime = '';

let currentCalendarDate = new Date();
const monthsRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

// Счетчик для кнопки "Нет"
let noButtonClicks = 0;

document.addEventListener("DOMContentLoaded", () => {
    renderCalendar();

    // Настраиваем время
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

    // ПОДКЛЮЧАЕМ ЛОГИКУ УБЕГАНИЯ ДЛЯ КНОПКИ "НЕТ"
    const noBtn = document.getElementById("no-btn-1");
    
    // pointerenter ловит и наведение мыши на ПК, и первый тач пальца на телефоне
    noBtn.addEventListener("pointerenter", moveNoButton); 
    noBtn.addEventListener("click", (e) => {
        // Если кнопка все-таки нажата (после 5 перемещений), показываем окно
        if (noButtonClicks >= 5) {
            document.getElementById("sad-modal").classList.add("active");
        } else {
            // На мобилке клик может сработать одновременно с тачем, уводим кнопку еще раз
            moveNoButton();
        }
    });
});

// ФУНКЦИЯ УБЕГАНИЯ КНОПКИ "НЕТ"
function moveNoButton() {
    const noBtn = document.getElementById("no-btn-1");
    
    if (noButtonClicks < 5) {
        noButtonClicks++;
        
        // Добавляем класс, отрывающий кнопку, чтобы она летала по всему экрану окна браузера
        noBtn.classList.add("runaway");
        
        // Меняем текст, чтобы было веселее
        const phrases = ["Нет", "Правда нет? 😢", "А если подумать? 🤔", "Мимо! 😜", "Ой, не туда! 🎯"];
        noBtn.innerText = phrases[noButtonClicks] || "Нет";

        // Рассчитываем случайные координаты по всей ширине и высоте экрана
        // Вычитаем 150px и 60px, чтобы кнопка гарантированно не улетала за границы экрана
        const x = Math.random() * (window.innerWidth - 150);
        const y = Math.random() * (window.innerHeight - 60);
        
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
    document.getElementById("confirm-modal").classList.remove("active");
}

function startDeployment() {
    closeModal();
    document.getElementById("loader-overlay").classList.add("active");

    const message = `
🚀 **Скомпилирован новый выезд в реал!**

• 📍 Место: ${selectedLocation}
• 📅 Дата: ${selectedDate}
• 🕒 Время: ${selectedTime}

*Данные успешно записаны.*
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
    })
    .then(response => {
        setTimeout(() => {
            if (response.ok) {
                document.getElementById("loading-box").classList.add("hidden");
                document.getElementById("success-box").classList.remove("hidden");
            } else {
                alert("Ошибка Telegram API.");
            }
        }, 2500);
    })
    .catch(error => {
        console.error(error);
        alert("Ошибка сети.");
    });
}