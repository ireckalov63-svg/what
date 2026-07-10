const FORMSPREE_URL = 'https://formspree.io/f/xpqggkdp';

let selectedLocation = 'Не выбрано (Екатеринбург)';
let selectedDate = '';
let selectedTime = '';

let currentCalendarDate = new Date();
const monthsRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

let noButtonClicks = 0;
let isYesButtonBlocked = false; 

let map, marker;
const defaultCoords = [56.8389, 60.6057]; // Координаты Екатеринбурга

document.addEventListener("DOMContentLoaded", () => {
    renderCalendar();
    initMap(); 

    const timeWrapper = document.getElementById("time-picker-wrapper");
    const hiddenTimeInput = document.getElementById("time-select");
    
    const defaultTime = "00:00"; 
    hiddenTimeInput.value = defaultTime;

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
    const yesBtn = document.getElementById("yes-btn");

    yesBtn.addEventListener("click", (e) => {
        if (isYesButtonBlocked) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        nextStep(2);
    });

    yesBtn.addEventListener("touchstart", (e) => {
        if (isYesButtonBlocked) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, { passive: false });

    noBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        blockYesButtonTemporarily(); 
        handleNoAction();
    }, { passive: false });

    noBtn.addEventListener("mouseenter", (e) => {
        handleNoAction();
    });

    noBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        blockYesButtonTemporarily(); 
        handleNoAction();
    });
});

function initMap() {
    map = L.map('map', {
        zoomControl: true,
        attributionControl: false
    }).setView(defaultCoords, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    marker = L.marker(defaultCoords, { draggable: true }).addTo(map);

    silentGeocode(defaultCoords[0], defaultCoords[1]);

    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
    });

    marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        reverseGeocode(lat, lng);
    });

    const searchInput = document.getElementById('map-search-input');
    const MathResultsContainer = document.getElementById('search-results');
    let searchTimeout;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();
        
        if (query.length < 3) {
            MathResultsContainer.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
                .then(res => res.json())
                .then(data => {
                    MathResultsContainer.innerHTML = '';
                    if (data.length === 0) {
                        MathResultsContainer.style.display = 'none';
                        return;
                    }
                    
                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'search-item';
                        div.innerText = item.display_name;
                        div.addEventListener('click', () => {
                            const lat = parseFloat(item.lat);
                            const lon = parseFloat(item.lon);
                            
                            map.setView([lat, lon], 16);
                            marker.setLatLng([lat, lon]);
                            
                            selectedLocation = `${item.display_name} | Гугл-карта: https://www.google.com/maps?q=${lat},${lon}`;
                            searchInput.value = item.display_name;
                            MathResultsContainer.style.display = 'none';
                        });
                        MathResultsContainer.appendChild(div);
                    });
                    MathResultsContainer.style.display = 'block';
                });
        }, 400);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.map-search-container')) {
            MathResultsContainer.style.display = 'none';
        }
    });
}

function silentGeocode(lat, lng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
            const address = data.display_name || `Екатеринбург (Центр)`;
            selectedLocation = `${address} | Гугл-карта: https://www.google.com/maps?q=${lat},${lng}`;
        })
        .catch(() => {
            selectedLocation = `Екатеринбург | Гугл-карта: https://www.google.com/maps?q=${lat},${lng}`;
        });
}

function reverseGeocode(lat, lng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
            const address = data.display_name || `Координаты: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            document.getElementById('map-search-input').value = address;
            selectedLocation = `${address} | Гугл-карта: https://www.google.com/maps?q=${lat},${lng}`;
        })
        .catch(() => {
            selectedLocation = `Координаты: ${lat}, ${lng} | Гугл-карта: https://www.google.com/maps?q=${lat},${lng}`;
        });
}

function blockYesButtonTemporarily() {
    isYesButtonBlocked = true;
    setTimeout(() => {
        isYesButtonBlocked = false;
    }, 400); 
}

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

        const x = Math.random() * (window.innerWidth - 150);
        let y = Math.random() * (window.innerHeight - 60);

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
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    if (stepNumber === 2) {
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }
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

    const formData = {
        "📍 Место и Карта": selectedLocation,
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
