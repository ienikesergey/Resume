// Фоновый холст и частицы
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
        ctx.fillStyle = 'rgba(0, 255, 65, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

let mouse = { x: null, y: null };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function initParticles() {
    particles = [];
    const count = window.innerWidth < 768 ? 25 : 70; // Оптимизация для мобильных
    for (let i = 0; i < count; i++) particles.push(new Particle());
}
initParticles();

let debrisParticles = [];

class Debris {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 3 + 2;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy += 0.1; // Гравитация
    }
    draw(ctx) {
        ctx.fillStyle = this.color.replace('rgb', 'rgba').replace(')', `, ${this.life})`);
        if (this.color.startsWith('#')) {
            // Простой откат HEX к RGBA
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.size, this.size);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        } else {
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.size, this.size);
            ctx.fill();
        }
    }
}

function createExplosion(rect, color = '#ff0000', count = 20) {
    for (let i = 0; i < count; i++) {
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;
        debrisParticles.push(new Debris(x, y, color));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Фоновая сеть
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // Соединение частиц
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
                ctx.strokeStyle = `rgba(0, 255, 65, ${0.15 - distance / 800})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }

        // Соединение курсора
        if (mouse.x) {
            const dx = particles[i].x - mouse.x;
            const dy = particles[i].y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                ctx.strokeStyle = `rgba(0, 255, 65, ${0.3 - dist / 500})`;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
    }

    // Отрисовка обломков
    for (let k = debrisParticles.length - 1; k >= 0; k--) {
        const p = debrisParticles[k];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) {
            debrisParticles.splice(k, 1);
        }
    }

    requestAnimationFrame(animateParticles);
}
animateParticles();

// Даты
const BIRTH_DATE = new Date('2002-04-17');
const JOB1_START = new Date('2025-07-01'); // Будущая дата по времени симулятора
const PREV_JOBS_MONTHS = 9; // 9 месяцев с предыдущей работы

// Динамические вычисления
function getAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function getMonthDiff(d1, d2) {
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

function updateDynamicStats() {
    // Возраст
    const age = getAge(BIRTH_DATE);
    document.getElementById('age-val').textContent = age + " ГОДА";

    // Опыт
    const today = new Date();
    // Длительность работы 1
    const job1Months = getMonthDiff(JOB1_START, today);
    // Всего
    const totalMonths = job1Months + PREV_JOBS_MONTHS;

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    let expStr = "";
    if (years > 0) expStr += `${years} ГОД `;
    if (months > 0) expStr += `${months} МЕС.`;
    document.getElementById('exp-total-val').textContent = expStr;

    return { job1Months, totalMonths };
}

const cvData = {
    experience: [
        {
            getYear: () => {
                const today = new Date();
                const m = getMonthDiff(JOB1_START, today);
                return `Июль 2025 — Настоящее время (${m} мес)`;
            },
            role: "Системный администратор 1 категории",
            company: "ОГУЭП Облкоммунэнерго (Ангарские электрические сети)",
            isOpen: false,
            sections: [
                {
                    title: "1. Управление Серверной Инфраструктурой и Виртуализацией",
                    items: [
                        "Поддержка и развитие серверной инфраструктуры (Windows Server, Alt Linux).",
                        "Установка, настройка и обслуживание серверных ролей (RDP, WSUS).",
                        "Управление средой виртуализации Proxmox.",
                        "Администрирование доменных служб: Active Directory, DNS, DHCP, DFS, Файловые службы.",
                        "Управление групповыми политиками (GPO).",
                        "Планирование и контроль процедур резервного копирования (Backup) и восстановления данных.",
                        "Настройка и поддержание работы сетевого хранилища (NAS) на базе Synology.",
                        "Развитие информационной системы предприятия."
                    ]
                },
                {
                    title: "2. Администрирование Баз Данных и Спец. ПО",
                    items: [
                        "Поддержка и администрирование систем управления базами данных, включая PostgreSQL (резервное копирование, мониторинг).",
                        "Изучение и администрирование платформы 1С:Предприятие (создание, управление информационными базами).",
                        "Работа с корпоративной электронной почтой по протоколам POP3 и IMAP."
                    ]
                },
                {
                    title: "3. Сетевое Администрирование и Коммуникации",
                    items: [
                        "Администрирование ЛВС предприятия.",
                        "Установка, настройка, обслуживание различного сетевого оборудования, включая оборудование Mikrotik.",
                        "Настройка динамической маршрутизации.",
                        "Управление сетевой безопасностью и настройка Firewall.",
                        "Обеспечение безопасного удаленного доступа (VPN).",
                        "Физическое обслуживание ЛВС: Диагностика, ремонт и восстановление обрывов кабелей локальной сети.",
                        "Обслуживание и работа с телефонией и систем видеоконференцсвязи (ВКС)."
                    ]
                },
                {
                    title: "4. Автоматизация и Разработка",
                    items: [
                        "Разработка собственного ПО на базе Python, TypeScript для автоматизации сложных бизнес-процессов.",
                        "Разработка и использование скриптов (Bash, Powershell) для автоматизации рутинных задач.",
                        "Внедрение и поддержка систем централизованного мониторинга."
                    ]
                },
                {
                    title: "5. Техническая Поддержка и Обслуживание (Help Desk)",
                    items: [
                        "Оперативное решение инцидентов и запросов пользователей.",
                        "Внедрение сервиса заявок (Help Desk) для удобной работы.",
                        "Диагностика, мелкий ремонт и техническое обслуживание компьютерной и офисной техники.",
                        "Базовое обслуживание МФУ.",
                        "Поддержка рабочих мест: установка, настройка и обновление ОС (Windows, Alt Linux)."
                    ]
                },
                {
                    title: "6. Учет и Управление Активами",
                    items: [
                        "Инвентаризация, учет и управление жизненным циклом ПО и техники.",
                        "Внедрение и поддержка систем централизованного развертывания."
                    ]
                }
            ]
        },
        {
            getYear: () => "Февраль 2024 — Октябрь 2024 (9 мес)",
            role: "Лаборант (Системный администратор)",
            company: "Государственные организации / ГБПОУ ИО 'АПТ'",
            isOpen: false,
            sections: [
                {
                    title: "1. Администрирование Сетей и Серверов",
                    items: [
                        "Администрирование серверов на базе Windows (поддержание надежной работы, мониторинг производительности).",
                        "Управление доменной инфраструктурой: Active Directory (учетные записи, домен), DHCP, маршрутизация.",
                        "Поддержание работоспособности почтового и файлового серверов, контроллеров домена.",
                        "Локальные Вычислительные Сети (ЛВС): Построение, монтаж, обслуживание и настройка сетевого оборудования; анализ и оптимизация сетевых маршрутов; ремонт физических обрывов кабеля.",
                        "Взаимодействие с провайдерами интернет-услуг."
                    ]
                },
                {
                    title: "2. Техническая Поддержка и Обслуживание Оборудования",
                    items: [
                        "Установка, обслуживание и оптимизация широкого спектра техники (ПК, ноутбуки, телевизоры, МФУ, интерактивные комплексы, видеорегистраторы).",
                        "Установка и настройка различных операционных систем (Windows, Linux).",
                        "Управление лицензированием ПО: Запросы, получение, установка и управление лицензионными ключами.",
                        "Автоматизация: Разработка и внедрение скриптов для автоматизации рутинных задач.",
                        "Проверка совместимости нового ПО и оборудования с существующими системами."
                    ]
                },
                {
                    title: "3. Информационная Безопасность и Электронный Документооборот",
                    items: [
                        "Работа с криптографическими средствами защиты информации: Crypto PRO CSP и VipNet.",
                        "Полный цикл работы с Электронными Цифровыми Подписями (ЭЦП): Оформление, установка на ПК и сервисы.",
                        "Поддержка пользователей в работе с государственными информационными системами и гос. сайтами."
                    ]
                },
                {
                    title: "4. Работа с Специализированными Системами",
                    items: [
                        "Опыт работы с ключевыми государственными и образовательными системами, включая: 1С (тонкий клиент), АЦК, ФИС ГИА, ФРДО, Госзаказ, Moodle, bus.gov.",
                        "Системы видеонаблюдения: Установка, настройка, мелкий ремонт видеокамер и видеорегистраторов, предоставление доступа и архивация записей."
                    ]
                },
                {
                    title: "5. Административно-Учебная Деятельность",
                    items: [
                        "Закупки (44-ФЗ): Оформление договоров, проведение закупок техники по 44 ФЗ, переговоры с поставщиками, оценка качества.",
                        "Консультирование и Обучение: Разработка планов, проведение консультаций и обучения сотрудников/практикантов по работе с ПО и техникой.",
                        "Ведение документации: Оформление отчетной и технической документации, сметных расчётов, работа с Microsoft Office.",
                        "Медиа/Звук: Работа со звуковым оборудованием (микшерный пульт SoundCraft Signature 10), настройка беспроводных микрофонов на мероприятиях.",
                        "Ведение сайта на Wordpress и социальных сетей."
                    ]
                }
            ]
        }
    ],
    languages: [
        { name: "Русский", lvl: "Родной" },
        { name: "Английский", lvl: "B2 (Medium)" },
        { name: "Немецкий", lvl: "A2 (Basic)" }
    ],
    skills: [
        { name: "Windows / Alt Linux Server", level: 90 },
        { name: "Сети (Mikrotik / Cisco)", level: 85 },
        { name: "Виртуализация (Proxmox)", level: 80 },
        { name: "Скрипты (Python / JS)", level: 75 },
        { name: "1С: Предприятие", level: 60 }
    ],
    tags: [
        "Настройка ПК", "Настройка ПО", "Ремонт ПК", "HTML", "CSS", "Python",
        "Git", "Сборка ПК", "Видеонаблюдение", "Email Server", "VPN",
        "Firewall", "Backup", "PostgreSQL", "Help Desk", "СКУД", "Wordpress"
    ],
    education: [
        { year: "2029 (В процессе)", place: "Московский технологический институт", desc: "Бакалавр: Информационные системы и технологии. Технологии искусственного интеллекта." },
        { year: "2025", place: "Ангарский политехнический техникум", desc: "Информационные системы и программирование. Специалист по информационным системам." }
    ]
};

const bootScreen = document.getElementById('boot-screen');
// Если boot-logs находится внутри cmd-window, мы должны правильно его захватить
const bootLogs = document.getElementById('boot-logs');
const dashboard = document.getElementById('desktop'); // Переименовано из id dashboard
const taskbar = document.getElementById('taskbar');
const skillsContainer = document.getElementById('skills-container');
const expContainer = document.getElementById('experience-container');
const eduContainer = document.getElementById('education-container');
const langContainer = document.getElementById('lang-container');
const tagsContainer = document.getElementById('tags-container');

/* === ФУНКЦИИ ОТРИСОВКИ === */
function renderLanguages() {
    cvData.languages.forEach(lang => {
        const html = `<div class="lang-row"><span>${lang.name}</span><span class="lang-lvl">${lang.lvl}</span></div>`;
        langContainer.innerHTML += html;
    });
}

function renderSkills() {
    cvData.skills.forEach(skill => {
        const html = `
        <div class="skill-bar">
            <div class="skill-name"><span>${skill.name}</span></div>
            <div class="progress-track">
                <div class="progress-fill" style="width: 0%" data-width="${skill.level}%"></div>
            </div>
        </div>`;
        skillsContainer.innerHTML += html;
    });
    cvData.tags.forEach(tag => {
        const html = `<span class="skill-tag">${tag}</span>`;
        tagsContainer.innerHTML += html;
    });
}

function renderExperience() {
    expContainer.innerHTML = '';
    cvData.experience.forEach((job, index) => {
        const sectionsHtml = job.sections.map(sec => `
        <div class="job-category">
            <div class="job-category-title">${sec.title}</div>
            <ul class="exp-desc">
                ${sec.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `).join('');
        const yearStr = job.getYear ? job.getYear() : job.year;
        const html = `
        <details class="exp-card" ${job.isOpen ? 'open' : ''}>
            <summary>
                <div class="exp-role">${job.role}</div>
                <div class="exp-company">${yearStr} @ ${job.company}</div>
            </summary>
            <div class="exp-details">${sectionsHtml}</div>
        </details>`;
        expContainer.innerHTML += html;
    });
}

function renderEducation() {
    cvData.education.forEach(edu => {
        const html = `
       <div style="margin-bottom: 1rem;">
           <div style="color:var(--color-accent)">${edu.place}</div>
           <div style="font-size:0.85rem; color:#888;">${edu.year} // ${edu.desc}</div>
       </div>`;
        eduContainer.innerHTML += html;
    });
}

function animateSkills() {
    document.querySelectorAll('.progress-fill').forEach(bar => {
        setTimeout(() => { bar.style.width = bar.getAttribute('data-width'); }, 500);
    });
}

/* === ЗВУКОВОЙ ДВИЖОК === */
const Sfx = {
    ctx: null,
    init: function () {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    },
    createNoiseBuffer: function () {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },
    play: function (type) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Заглушить, если загрузка пропущена
        if (window.isBootSkipped && document.getElementById('boot-screen').style.display !== 'none') return;

        const t = this.ctx.currentTime;

        // Мастер-громкость (Лимитер)
        const masterGain = this.ctx.createGain();
        masterGain.connect(this.ctx.destination);
        masterGain.gain.value = 0.3; // Глобальная громкость

        if (type === 'key') {
            // Механический клик
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(masterGain);

            // Короткий ВЧ импульс
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.05);

            gain.gain.setValueAtTime(0.15, t); // Тише для печати
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

            osc.start(t);
            osc.stop(t + 0.03);

            // Добавление шума для текстуры
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer();
            const noiseGain = this.ctx.createGain();
            const noiseFilter = this.ctx.createBiquadFilter();

            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 3000;

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);

            noiseGain.gain.setValueAtTime(0.05, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.01);

            noise.start(t);
            noise.stop(t + 0.02);

        } else if (type === 'glitch') {
            // Цифровой сбой (Bandpass sweep)
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            filter.type = 'bandpass';
            filter.Q.value = 10;
            filter.frequency.setValueAtTime(1000, t);
            filter.frequency.linearRampToValueAtTime(Math.random() * 2000 + 100, t + 0.1);

            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

            noise.start(t);
            noise.stop(t + 0.1);

        } else if (type === 'alarm') {
            // Индустриальная тревога
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sawtooth';
            osc2.type = 'square';

            // Диссонанс
            osc1.frequency.setValueAtTime(150, t);
            osc2.frequency.setValueAtTime(145, t); // Частота биений

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(masterGain);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.5);

            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + 0.5);
            osc2.stop(t + 0.5);

        } else if (type === 'success') {
            // Нарастающий Sci-Fi звук
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.4);

            osc.connect(gain);
            gain.connect(masterGain);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
            gain.gain.linearRampToValueAtTime(0, t + 0.6);

            osc.start(t);
            osc.stop(t + 0.6);

        } else if (type === 'hover') {
            // Тонкий клик интерфейса
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2000, t);

            osc.connect(gain);
            gain.connect(masterGain);

            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

            osc.start(t);
            osc.stop(t + 0.02);
        } else if (type === 'defense') {
            // Активация щита
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            // Lowpass фильтр для приглушения
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 500;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            osc.frequency.setValueAtTime(100, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.5);

            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.5);

            osc.start(t);
            osc.stop(t + 0.5);
        } else if (type === 'spam') {
            // Скрежет HDD / Ошибка BIOS
            // FM синтез

            const carrier = this.ctx.createOscillator();
            const modulator = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            const gain = this.ctx.createGain();

            // Модулятор текстуры
            modulator.type = 'sawtooth';
            modulator.frequency.setValueAtTime(30 + Math.random() * 20, t);

            // Несущая частота
            carrier.type = 'square';
            carrier.frequency.setValueAtTime(100 + Math.random() * 50, t);

            // FM синтез
            modulator.connect(modGain);
            modGain.connect(carrier.frequency);

            // Глубина модуляции
            modGain.gain.setValueAtTime(800, t); // Сильная модуляция

            carrier.connect(gain);
            gain.connect(masterGain);

            // ADSR огибающая
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

            carrier.start(t);
            modulator.start(t);
            carrier.stop(t + 0.15);
            modulator.stop(t + 0.15);

        } else if (type === 'power_on') {
            // Звук включения ЭЛТ монитора

            // 1. Удар (Заряд конденсатора)
            const oscThump = this.ctx.createOscillator();
            const gainThump = this.ctx.createGain();
            oscThump.type = 'triangle';
            oscThump.frequency.setValueAtTime(50, t);
            oscThump.frequency.exponentialRampToValueAtTime(10, t + 0.5);

            gainThump.gain.setValueAtTime(0.5, t);
            gainThump.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            oscThump.connect(gainThump);
            gainThump.connect(masterGain);
            oscThump.start(t);
            oscThump.stop(t + 0.5);

            // 2. Писк (Строчный трансформатор)
            const oscWhine = this.ctx.createOscillator();
            const gainWhine = this.ctx.createGain();
            oscWhine.type = 'sine';
            oscWhine.frequency.setValueAtTime(12000, t); // Типично для ЭЛТ

            gainWhine.gain.setValueAtTime(0, t);
            gainWhine.gain.linearRampToValueAtTime(0.05, t + 0.1); // Нарастание
            gainWhine.gain.exponentialRampToValueAtTime(0.001, t + 2.0); // Затухание

            oscWhine.connect(gainWhine);
            gainWhine.connect(masterGain);
            oscWhine.start(t);
            oscWhine.stop(t + 2.0);

        } else if (type === 'boot') {
            // Фоновый гул
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(50, t);
            osc.frequency.linearRampToValueAtTime(100, t + 1.5);

            osc.connect(gain);
            gain.connect(masterGain);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.4, t + 0.5);
            gain.gain.linearRampToValueAtTime(0, t + 1.5);

            osc.start(t);
            osc.stop(t + 1.5);
        }
    }
};

/* === КОНТРОЛЛЕР ГЛЮКОВ === */
function scrambleText(element, originalText) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
    let iterations = 0;
    const interval = setInterval(() => {
        element.innerText = originalText.split('')
            .map((char, index) => {
                if (index < iterations) return originalText[index];
                return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');
        if (iterations >= originalText.length) clearInterval(interval);
        iterations += 1 / 2;
    }, 30);
}

function triggerGlitchInHouse() {
    const isMobile = window.innerWidth < 600;
    const glitchTypes = ['rgb', 'tear'];
    const targets = [
        document.getElementById('sys-status'),
        document.getElementById('avatar-box'),
        document.getElementById('exp-header'),
        document.querySelector('.panel-title'),
        document.body
    ];
    const target = targets[Math.floor(Math.random() * targets.length)];
    if (!target) return;
    const type = glitchTypes[Math.floor(Math.random() * glitchTypes.length)];

    if (isMobile && target === document.body && type === 'tear') return;

    // Аудио для глюка
    if (Math.random() > 0.5) Sfx.play('glitch');

    if (type === 'rgb') {
        target.classList.add('glitch-rgb-active');
        setTimeout(() => target.classList.remove('glitch-rgb-active'), 200 + Math.random() * 300);
    } else if (type === 'tear') {
        target.classList.add('glitch-tear-active');
        setTimeout(() => target.classList.remove('glitch-tear-active'), 150 + Math.random() * 150);
    }
    if (Math.random() > 0.8) {
        const headerStatus = document.getElementById('sys-status').querySelector('span');
        if (headerStatus) scrambleText(headerStatus, "ОНЛАЙН");
    }
    setTimeout(triggerGlitchInHouse, 500 + Math.random() * 2000);
}

/* === ДВИЖОК ЗАГРУЗКИ === */
window.isBootSkipped = false; // Флаг пропуска анимации

const delay = (ms) => window.isBootSkipped ? Promise.resolve() : new Promise(res => setTimeout(res, ms));

function createBootLine() {
    const line = document.createElement('div');
    line.className = 'boot-line';
    bootLogs.appendChild(line);
    // Auto scroll container
    bootLogs.scrollTop = bootLogs.scrollHeight;
    return line;
}

async function typeText(container, text, speed = 15) {
    const span = document.createElement('span');
    container.appendChild(span);

    if (window.isBootSkipped) {
        span.textContent = text;
        return span;
    }

    // Cursor
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.innerHTML = '&nbsp;';
    container.appendChild(cursor);

    for (let i = 0; i < text.length; i++) {
        span.textContent += text[i];
        if (Math.random() > 0.5) Sfx.play('key');
        await delay(speed + Math.random() * 10);
    }

    cursor.remove();
    return span;
}

async function runCounter(container, start, end, duration = 1000) {
    const span = document.createElement('span');
    container.appendChild(span);

    if (window.isBootSkipped) {
        span.textContent = end;
        return;
    }

    const startTime = performance.now();

    return new Promise(resolve => {
        function update(currentTime) {
            // Check skip inside loop
            if (window.isBootSkipped) {
                span.textContent = end;
                resolve();
                return;
            }

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const val = Math.floor(progress * (end - start) + start);
            span.textContent = val;

            if (Math.random() > 0.8) Sfx.play('key');

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(update);
    });
}

async function runProgressBar(container, length = 20, duration = 1000) {
    const span = document.createElement('span');
    span.style.color = 'var(--color-accent)';
    container.appendChild(span);

    if (window.isBootSkipped) {
        span.textContent = `[${'#'.repeat(length)}] 100%`;
        return;
    }

    const startTime = performance.now();
    return new Promise(resolve => {
        function update(currentTime) {
            if (window.isBootSkipped) {
                span.textContent = `[${'#'.repeat(length)}] 100%`;
                resolve();
                return;
            }

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const filledCount = Math.floor(progress * length);
            const emptyCount = length - filledCount;

            span.textContent = `[${'#'.repeat(filledCount)}${'.'.repeat(emptyCount)}] ${Math.floor(progress * 100)}%`;

            if (Math.random() > 0.9) Sfx.play('key');

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(update);
    });
}

async function runBootSequence() {
    // 1. ИНИЦИАЛИЗАЦИЯ BIOS
    // Звук загрузки теперь проигрывается при клике, но фон оставляем
    let line = createBootLine();
    await typeText(line, "ЗАГРУЗКА ЯДРА БЕЗОПАСНОСТИ: v4.11.2...", 5);

    line = createBootLine();
    await typeText(line, "ИНИЦИАЛИЗАЦИЯ ПРОТОКОЛОВ...", 5);

    line = createBootLine();
    await typeText(line, "ПРОВЕРКА ОБОРУДОВАНИЯ СЕРВЕРА...", 5);
    await delay(100);

    // 2. ТЕСТ ПАМЯТИ (Счетчик)
    line = createBootLine();
    await typeText(line, "ДОСТУПНО ОЗУ: ", 5);
    await runCounter(line, 0, 65536, 400);
    await typeText(line, " МБ [OK]", 5);

    await delay(200);

    // 3. HEX ДАМП И ФАЙЛЫ
    line = createBootLine();
    await typeText(line, "МОНТИРОВАНИЕ /dev/sda1... ", 10);
    await delay(300);

    // 4. ВЗЛОМ (Кинематографичный)
    line = createBootLine();
    line.style.marginTop = "10px";
    await typeText(line, "ОЖИДАНИЕ СОЕДИНЕНИЯ... ", 20);
    await delay(500);

    // Внезапный сдвиг
    line.textContent += " [ОШИБКА]";
    line.className = "boot-line color-red";
    Sfx.play('error');
    await delay(200);

    // НАЧАЛО ПАНИКИ
    bootScreen.classList.add('panic-mode');

    bootLogs.innerHTML = '';

    const giant = document.createElement('div');
    giant.className = 'panic-text';
    giant.style.opacity = '0';
    giant.innerHTML = "⚠ КРИТИЧЕСКАЯ ОШИБКА ⚠<br>ОБНАРУЖЕН НЕСАНКЦИОНИРОВАННЫЙ ДОСТУП";
    bootLogs.appendChild(giant);

    giant.style.opacity = '1';
    scrambleText(giant, "⚠ КРИТИЧЕСКАЯ ОШИБКА ⚠\nОБНАРУЖЕН НЕСАНКЦИОНИРОВАННЫЙ ДОСТУП");

    Sfx.play('alarm');

    await delay(500);

    // МАССИВ ДАННЫХ HEX (Deep Terminal Feel)
    const hexContainer = document.createElement('div');
    hexContainer.className = 'corrupt-data';
    bootLogs.appendChild(hexContainer);

    // Fast scroll hex dump
    for (let i = 0; i < 15; i++) {
        const hexLine = document.createElement('div');
        let hexStr = "";
        for (let j = 0; j < 8; j++) {
            hexStr += "0x" + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0') + " ";
        }
        hexLine.textContent = hexStr;
        hexContainer.appendChild(hexLine);
        bootLogs.scrollTop = bootLogs.scrollHeight;
        await delay(20);
    }

    // ЛОГИ АТАКИ (Вариативный нарратив)
    const attacks = [
        "IPS: ОБНАРУЖЕНО ВТОРЖЕНИЕ В СЕТЬ",
        "ROOT: ПОВЫШЕНИЕ ПРИВИЛЕГИЙ (REMOTE_USER)",
        "SYSTEM: KERNEL PANIC - ПОВРЕЖДЕНИЕ ПАМЯТИ",
        "UPLOAD: ОБНАРУЖЕН ТРОЯН (TROJAN.WIN32.HYDRA)",
        "FAIL: ЗАЩИТНЫЕ СИСТЕМЫ ОТКЛЮЧЕНЫ"
    ];

    for (let log of attacks) {
        const errLine = createBootLine();
        errLine.className = 'boot-line color-red';
        errLine.style.textAlign = 'center';
        errLine.style.fontSize = "1.1em";
        errLine.style.background = "#rgba(255,0,0,0.1)";

        await typeText(errLine, log, 5);
        Sfx.play('spam');

        await delay(50);
    }

    const alert = createBootLine();
    alert.className = 'boot-line color-red';
    alert.style.fontWeight = 'bold';
    alert.style.fontSize = '1.5em';
    alert.style.marginTop = '20px';
    alert.style.textAlign = 'center';
    alert.textContent = "";
    scrambleText(alert, "!!! БЛОКИРОВКА СИСТЕМЫ !!!");
    Sfx.play('alarm');

    await delay(2000);

    // 5. ОТВЕТ СИСТЕМЫ (Фаза защиты)
    bootScreen.classList.remove('panic-mode');
    bootLogs.innerHTML = '';

    const transLine = createBootLine();
    transLine.style.marginTop = "15px";
    transLine.style.textAlign = "center";
    transLine.setAttribute('style', 'color: #fff !important; margin-top: 15px; font-weight: bold; text-align: center; font-size: 1.2em;');

    scrambleText(transLine, "ЗАПУСК КОНТРМЕР...");
    await delay(1000);
    await runProgressBar(transLine, 40, 2000);

    const defenseLine = createBootLine();
    defenseLine.className = 'boot-line color-accent';
    defenseLine.style.textAlign = 'center';
    defenseLine.style.marginTop = "10px";

    const matrixBox = document.createElement('div');
    matrixBox.style.color = 'var(--color-accent)';
    matrixBox.style.fontSize = '10px';
    matrixBox.style.opacity = '0.5';
    matrixBox.style.height = '100px';
    matrixBox.style.overflow = 'hidden';
    matrixBox.style.textAlign = 'center';
    bootLogs.appendChild(matrixBox);

    let matrixInterval = setInterval(() => {
        matrixBox.textContent = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    }, 50);

    await typeText(defenseLine, "ВОССТАНОВЛЕНИЕ ПРОТОКОЛОВ БЕЗОПАСНОСТИ...", 20);
    clearInterval(matrixInterval);
    matrixBox.remove();

    Sfx.play('defense');;

    // Быстрые логи защиты
    const countermeasures = [
        "БЛОКИРОВКА ВНЕШНИХ ШЛЮЗОВ...",
        "ИЗОЛЯЦИЯ ПОДОЗРИТЕЛЬНЫХ ПРОЦЕССОВ...",
        "ПЕРЕНАПРАВЛЕНИЕ ТРАФИКА НА HONEYPOT...",
        "ОЧИСТКА ОПЕРАТИВНОЙ ПАМЯТИ...",
        "РАСЧЕТ ОБРАТНОГО ТРЕЙСИНГА..."
    ];

    for (let def of countermeasures) {
        const defLog = createBootLine();
        defLog.className = 'boot-line color-accent';
        defLog.textContent = def;
        await delay(150);
    }

    await delay(500);

    // 6. ПОБЕДА
    line = createBootLine();
    line.style.marginTop = "10px";
    const res = document.createElement('span');
    res.className = 'color-green';
    res.style.fontWeight = 'bold';
    res.textContent = "УГРОЗА УСТРАНЕНА. ИСТОЧНИК: LOCALHOST (АДМИНИСТРАТОР)";
    line.appendChild(res);
    Sfx.play('success');

    await delay(1500); // Даем пользователю прочитать концовку

    line = createBootLine();
    await typeText(line, "ВОССТАНОВЛЕНИЕ СЕССИИ...", 10);
    await delay(400);

    // 7. ФИНАЛЬНЫЙ ДОСТУП
    line = createBootLine();
    line.style.fontSize = "1.5em";
    line.style.marginTop = "1em";
    line.style.borderTop = "1px solid var(--color-term-dim)";
    line.style.borderBottom = "1px solid var(--color-term-dim)";
    line.style.padding = "10px 0";

    // Уменьшаем задержку и проверяем завершение
    try {
        await typeText(line, "ДОСТУП РАЗРЕШЕН", 30);
    } catch (e) {
        line.textContent = "ДОСТУП РАЗРЕШЕН";
    }
    Sfx.play('success');

    await delay(1000);

    // ЗАТУХАНИЕ / СХЛОПЫВАНИЕ
    bootScreen.classList.add('crt-collapse');
    await delay(500);

    const flash = document.createElement('div');
    flash.className = 'flash-overlay';
    document.body.appendChild(flash);

    setTimeout(() => {
        flash.remove();
        bootScreen.style.display = 'none';
        dashboard.style.display = 'block';
        taskbar.style.display = 'flex';
        WindowManager.open('win-term');
        animateSkills();
        updateDynamicStats();
        triggerGlitchInHouse();
    }, 500);
}

// INIT
updateDynamicStats();
renderLanguages();
renderSkills();
renderExperience();
renderEducation();

// Добавить звуки наведения

// SYSTEM MONITOR LOOP
// SYSTEM MONITOR & INTERACTIVITY
window.sysTimeMode = 0;
window.toggleTimeMode = function () {
    window.sysTimeMode = (window.sysTimeMode + 1) % 3;
    updateSystemMonitor();
    try { Sfx.play('key'); } catch (e) { }
};

const sysProcList = document.getElementById('sys-proc-list');
// Mock processes
const fakeProcs = [
    { name: 'kernel_task', cpu: 5, mem: 120 },
    { name: 'system_ui', cpu: 2, mem: 80 },
    { name: 'chrome_helper', cpu: 15, mem: 400 },
    { name: 'node', cpu: 1, mem: 45 },
    { name: 'matrix_daemon', cpu: 0, mem: 10 },
    { name: 'ssh_agent', cpu: 0, mem: 5 },
    { name: 'watchdog', cpu: 0, mem: 2 },
    { name: 'doom.exe', cpu: 66, mem: 666 }
];

function updateSystemMonitor() {
    // Clock
    const now = new Date();
    const timeEl = document.getElementById('sys-time');
    if (timeEl) {
        if (window.sysTimeMode === 0) {
            timeEl.innerText = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (window.sysTimeMode === 1) {
            timeEl.innerText = now.toLocaleDateString('ru-RU');
        } else {
            timeEl.innerText = Math.floor(now.getTime() / 1000);
        }
    }

    // Fake CPU/RAM Global
    const cpu = Math.floor(Math.random() * 30) + 5;
    const ram = Math.floor(Math.random() * 20) + 40;

    const statCpu = document.getElementById('stat-cpu');
    const statRam = document.getElementById('stat-ram');
    if (statCpu) statCpu.style.width = cpu + '%';
    if (statRam) statRam.style.width = ram + '%';

    const valCpu = document.getElementById('val-cpu');
    const valRam = document.getElementById('val-ram');
    if (valCpu) valCpu.innerText = cpu + '%';
    if (valRam) valRam.innerText = ram + '%';

    const netLed = document.getElementById('net-led');
    if (netLed && Math.random() > 0.5) {
        netLed.classList.toggle('active');
    }

    const winSys = document.getElementById('win-sysmon');
    if (winSys && winSys.style.display !== 'none' && sysProcList) {
        if (Math.random() > 0.5) {
            sysProcList.innerHTML = '';
            fakeProcs.forEach(p => {
                let c = p.cpu + Math.floor(Math.random() * 5) - 2;
                if (c < 0) c = 0;

                const row = document.createElement('div');
                row.className = 'sys-row';
                row.innerHTML = `
                                <span style="flex:1; color:#666;">${Math.floor(Math.random() * 10000)}</span>
                                <span style="flex:3;">${p.name}</span>
                                <span style="flex:1; text-align:right;">${c}%</span>
                                <span style="flex:1; text-align:right;">${p.mem}MB</span>
                            `;
                sysProcList.appendChild(row);
            });
        }
    }
}

setInterval(updateSystemMonitor, 1000);

/* === EASTER EGGS ENGINE === */
const EasterEggs = {
    stars: [false, false, false],
    init() {
        const saved = localStorage.getItem('ienike_easter_stars');
        if (saved) {
            this.stars = JSON.parse(saved);
        }
        this.render();
    },
    unlock(index) {
        if (this.stars[index - 1]) return;
        this.stars[index - 1] = true;
        localStorage.setItem('ienike_easter_stars', JSON.stringify(this.stars));
        this.render();
        try { Sfx.play('success'); } catch (e) { }

        if (this.stars.every(s => s)) {
            setTimeout(() => {
                alert("ВЫ НАШЛИ ВСЕ СЕКРЕТЫ! ВЫ ПОТРЯСАЮЩИЙ!");
                document.body.style.border = "4px solid #FFD700";
            }, 500);
        }
    },
    render() {
        const container = document.getElementById('easter-stars');
        if (!container) return;
        container.innerHTML = '';
        this.stars.forEach(unlocked => {
            const span = document.createElement('span');
            span.className = 'star-icon' + (unlocked ? ' unlocked' : '');
            span.textContent = '★';
            container.appendChild(span);
        });
    }
};

// Логика красной кнопки
function triggerRedButton() {
    if (typeof Physics !== 'undefined' && Physics.enabled) Physics.disable();
    try { Sfx.play('alarm'); } catch (e) { }
    document.body.classList.add('panic-mode');

    const fakes = [];
    const maxFakes = 50; // Максимальное количество фейковых окон
    let count = 0;

    // Спам фейковых окон
    const chaosInterval = setInterval(() => {
        if (count >= maxFakes) {
            clearInterval(chaosInterval);
            return;
        }
        const fake = document.createElement('div');
        fake.className = 'window fake-window';
        fake.style.position = 'fixed';
        fake.style.left = (Math.random() * (window.innerWidth - 300)) + 'px';
        fake.style.top = (Math.random() * (window.innerHeight - 150)) + 'px';
        fake.style.width = '300px';
        fake.style.height = '150px';
        fake.style.zIndex = 90000 + count; // Очень высокий zIndex
        fake.style.background = '#050505';
        fake.style.border = '2px solid var(--color-error)';
        fake.style.boxShadow = '0 0 15px var(--color-error)';
        fake.style.color = 'var(--color-error)';
        fake.style.display = 'flex';
        fake.style.flexDirection = 'column';
        fake.style.alignItems = 'center';
        fake.style.justifyContent = 'center';
        fake.style.fontFamily = 'monospace';
        fake.style.padding = '10px';
        fake.style.textAlign = 'center';

        fake.innerHTML = `
                        <div style="font-weight:bold; font-size:1.2em;">⚠ SYSTEM_CRITICAL ⚠</div>
                        <div style="margin-top:10px; font-size:0.8em;">ERR_ADDR: 0x${Math.floor(Math.random() * 16777215).toString(16).toUpperCase()}</div>
                    `;

        document.body.appendChild(fake);
        fakes.push(fake);

        // Случайные звуки
        if (Math.random() > 0.7) try { Sfx.play('spam'); } catch (e) { }

        count++;
    }, 50);

    setTimeout(() => {
        clearInterval(chaosInterval);

        if (!document.getElementById('disintegration-style')) {
            const style = document.createElement('style');
            style.id = 'disintegration-style';
            style.innerHTML = `
                            @keyframes particle-disintegrate {
                                0% { transform: scale(1) translate(0,0); opacity: 1; filter: blur(0px); }
                                100% { transform: scale(0) translate(0, 50px); opacity: 0; filter: blur(10px); }
                            }
                            .disintegrating {
                                animation: particle-disintegrate 0.8s forwards ease-in !important;
                                pointer-events: none !important;
                            }
                        `;
            document.head.appendChild(style);
        }

        const allWins = document.querySelectorAll('.window');
        allWins.forEach(w => {
            w.classList.add('disintegrating');
            createExplosion(w.getBoundingClientRect(), '#ff0000', 30);
        });
        const tb = document.getElementById('taskbar');
        if (tb) {
            tb.classList.add('disintegrating');
            createExplosion(tb.getBoundingClientRect(), '#ff0000', 50);
        }

        try { Sfx.play('defense'); } catch (e) { }

        setTimeout(() => {
            fakes.forEach(f => f.remove());

            const desktop = document.getElementById('desktop');
            const taskbar = document.getElementById('taskbar');
            desktop.style.display = 'none';
            taskbar.style.display = 'none';

            // 4. САМОУНИЧТОЖЕНИЕ ПОСЛЕДОВАТЕЛЬНОСТЬ
            const sdScreen = document.createElement('div');
            sdScreen.style.position = 'fixed';
            sdScreen.style.top = '0';
            sdScreen.style.left = '0';
            sdScreen.style.width = '100vw';
            sdScreen.style.height = '100vh';
            sdScreen.style.background = '#000';
            sdScreen.style.zIndex = 100000;
            sdScreen.style.display = 'flex';
            sdScreen.style.flexDirection = 'column';
            sdScreen.style.alignItems = 'center';
            sdScreen.style.justifyContent = 'center';
            sdScreen.style.fontFamily = 'monospace';
            sdScreen.id = 'sd-screen';

            // Сканирование overlay
            const scan = document.createElement('div');
            scan.style.position = 'absolute';
            scan.style.width = '100%'; scan.style.height = '100%';
            scan.style.background = 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))';
            scan.style.backgroundSize = '100% 2px, 3px 100%';
            scan.style.pointerEvents = 'none';
            sdScreen.appendChild(scan);

            document.body.appendChild(sdScreen);

            const msg = document.createElement('div');
            msg.style.color = 'var(--color-error)';
            msg.style.fontSize = '1.5em';
            msg.style.textAlign = 'center';
            msg.style.marginBottom = '20px';
            sdScreen.appendChild(msg);

            const timer = document.createElement('div');
            timer.style.color = 'var(--color-error)';
            timer.style.fontSize = '6em';
            timer.style.fontWeight = 'bold';
            timer.style.textShadow = '0 0 20px red';
            sdScreen.appendChild(timer);

            const typeLocal = async (text) => {
                msg.textContent = '';
                for (let i = 0; i < text.length; i++) {
                    msg.textContent += text[i];
                    await new Promise(r => setTimeout(r, 20));
                }
            };

            (async () => {
                try { Sfx.play('boot'); } catch (e) { }
                await typeLocal("ИНИЦИАЛИЗАЦИЯ ПРОТОКОЛА САМОУНИЧТОЖЕНИЯ...");

                let timeLeft = 3.00;
                const tInt = setInterval(() => {
                    timeLeft -= 0.01;
                    timer.textContent = timeLeft.toFixed(2);
                    if (timeLeft <= 0) {
                        clearInterval(tInt);

                        timer.remove();
                        msg.style.color = 'var(--color-term)';
                        msg.style.fontSize = '3em';
                        msg.innerHTML = "ШУТКА! :)";
                        try { Sfx.play('success'); } catch (e) { }
                        EasterEggs.unlock(2);

                        setTimeout(() => {
                            sdScreen.remove();
                            desktop.style.display = 'block';
                            taskbar.style.display = 'flex';

                            document.body.classList.remove('panic-mode');
                            document.querySelectorAll('.window').forEach(w => w.classList.remove('disintegrating'));
                            taskbar.classList.remove('disintegrating');
                        }, 2500);
                    }
                }, 10);
            })();

        }, 800);
    }, 2000);
}

let gravityEnabled = false;


EasterEggs.init();

document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.skill-tag') || e.target.closest('summary') || e.target.closest('.info-value') || e.target.closest('.header-status')) {
        Sfx.play('hover');
    }
});

// КЛИК ДЛЯ ЗАПУСКА
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');

let bootStarted = false; // Предотвращение двойного клика

function skipBoot() {
    if (!bootStarted) return;
    window.isBootSkipped = true;
}

document.addEventListener('keydown', (e) => {
    if (!bootStarted) return;
    if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        skipBoot();
    }
});

startBtn.addEventListener('click', () => {
    if (bootStarted) return;
    bootStarted = true;
    window.isBootSkipped = false;

    Sfx.init();
    Sfx.play('power_on'); // Проиграть звук включения ЭЛТ

    startOverlay.style.pointerEvents = 'none'; // Блокировка взаимодействия
    startOverlay.style.transition = 'opacity 0.5s';
    startOverlay.style.opacity = '0';

    setTimeout(() => {
        startOverlay.style.display = 'none';
        runBootSequence();
    }, 500);
});

// === SKIP BOOT ON CMD CLOSE ===
const cmdCloseBtn = document.querySelector('#cmd-window .cmd-btn.close');
if (cmdCloseBtn) {
    cmdCloseBtn.addEventListener('click', () => {
        if (document.getElementById('desktop').style.display !== 'none') return;

        window.isBootSkipped = true;

        const bootScreen = document.getElementById('boot-screen');
        const dashboard = document.getElementById('desktop');
        const taskbar = document.getElementById('taskbar');

        if (Sfx.ctx) Sfx.ctx.suspend();

        bootScreen.style.display = 'none';
        dashboard.style.display = 'block';
        taskbar.style.display = 'flex';

        WindowManager.open('win-term');

        animateSkills();
        updateDynamicStats();
        triggerGlitchInHouse();
    });
}

/* === СИСТЕМА УПРАВЛЕНИЯ ОКНАМИ === */
const Physics = {
    enabled: false,
    bodies: [],
    loopId: null,

    enable() {
        if (this.enabled) return;
        this.enabled = true;
        EasterEggs.unlock(3);

        this.bodies = [];
        document.querySelectorAll('.window').forEach(win => {
            const rect = win.getBoundingClientRect();
            win.style.transform = 'none';
            if (getComputedStyle(win).display !== 'none') {
                this.addBody(win, rect.left, rect.top);
            }
        });

        this.startLoop();
    },

    disable() {
        this.enabled = false;
        cancelAnimationFrame(this.loopId);
        this.bodies.forEach(b => {
            b.el.style.transform = '';
        });
        this.bodies = [];
        document.querySelectorAll('.window').forEach(w => w.style.transition = '');
    },

    addBody(el, x, y) {
        this.bodies = this.bodies.filter(b => b.el !== el);
        this.bodies.push({
            el: el,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: 0,
            width: el.offsetWidth,
            height: el.offsetHeight,
            isDragging: false
        });
        el.style.transition = 'none';
    },

    updateBodyState(el, x, y, vx, vy, isDragging) {
        const body = this.bodies.find(b => b.el === el);
        if (body) {
            if (x !== undefined) body.x = x;
            if (y !== undefined) body.y = y;
            if (vx !== undefined) body.vx = vx;
            if (vy !== undefined) body.vy = vy;
            if (isDragging !== undefined) body.isDragging = isDragging;

            // Обновляем размеры на случай изменения
            body.width = el.offsetWidth;
            body.height = el.offsetHeight;
        } else if (this.enabled && el.style.display !== 'none') {
            // Если не найдено, но включено - добавляем
            this.addBody(el, x || parseFloat(el.style.left), y || parseFloat(el.style.top));
        }
    },

    startLoop() {
        const gravity = 0.5;
        const bounce = 0.6;
        const friction = 0.98;
        const floor = window.innerHeight;
        const walls = window.innerWidth;

        const step = () => {
            if (!this.enabled) return;

            this.bodies.forEach(b => {
                if (b.isDragging) return;

                b.vy += gravity;
                b.x += b.vx;
                b.y += b.vy;

                if (b.y + b.height > floor - 50) {
                    b.y = floor - 50 - b.height;
                    b.vy *= -bounce;
                    b.vx *= friction;
                }

                if (b.x < 0) {
                    b.x = 0;
                    b.vx *= -bounce;
                }
                if (b.x + b.width > walls) {
                    b.x = walls - b.width;
                    b.vx *= -bounce;
                }

                b.el.style.left = b.x + 'px';
                b.el.style.top = b.y + 'px';
            });

            this.loopId = requestAnimationFrame(step);
        };
        step();
    }
};

/* === СИСТЕМА УПРАВЛЕНИЯ ОКНАМИ === */
const WindowManager = {
    topZ: 50000,
    activeWindow: null,

    init() {
        const windows = document.querySelectorAll('.window');
        windows.forEach((win, index) => {
            win.style.zIndex = 100 + index;
            this.setupDrag(win);
            win.addEventListener('mousedown', () => this.bringToFront(win), { capture: true });
            const closeBtn = win.querySelector('.win-btn.close');
            if (closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); this.close(win.id); };
        });
    },

    bringToFront(win) {
        this.topZ++;
        win.style.zIndex = this.topZ;
        this.activeWindow = win;
        document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
        win.classList.add('active');
    },

    setupDrag(win) {
        const header = win.querySelector('.window-header');
        let startX, startY, initialLeft, initialTop;

        // Для расчета скорости
        let lastX, lastY, lastTime;
        let velocityX = 0, velocityY = 0;

        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const newLeft = initialLeft + dx;
            const newTop = initialTop + dy;

            win.style.left = `${newLeft}px`;
            win.style.top = `${newTop}px`;

            const now = performance.now();
            const dt = now - lastTime;
            if (dt > 0) {
                velocityX = (e.clientX - lastX) / dt * 10;
                velocityY = (e.clientY - lastY) / dt * 10;
            }
            lastX = e.clientX;
            lastY = e.clientY;
            lastTime = now;

            if (Physics.enabled) {
                Physics.updateBodyState(win, newLeft, newTop, 0, 0, true);
            }
        };

        const onMouseUp = () => {
            document.body.style.cursor = 'default';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            if (Physics.enabled) {
                velocityX = Math.max(-20, Math.min(20, velocityX));
                velocityY = Math.max(-20, Math.min(20, velocityY));
                Physics.updateBodyState(win, parseFloat(win.style.left), parseFloat(win.style.top), velocityX, velocityY, false);
            }
        };

        header.addEventListener('mousedown', (e) => {
            if (window.innerWidth <= 768) return;
            startX = e.clientX;
            startY = e.clientY;
            lastX = e.clientX;
            lastY = e.clientY;
            lastTime = performance.now();
            velocityX = 0;
            velocityY = 0;

            const rect = win.getBoundingClientRect();
            // Исправление трансформации
            if (win.style.transform && win.style.transform !== 'none') {
                win.style.transform = 'none';
                win.style.left = rect.left + 'px';
                win.style.top = rect.top + 'px';
            }

            initialLeft = win.offsetLeft;
            initialTop = win.offsetTop;

            this.bringToFront(win);
            document.body.style.cursor = 'grabbing';

            if (Physics.enabled) {
                Physics.updateBodyState(win, initialLeft, initialTop, 0, 0, true);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        header.addEventListener('touchstart', (e) => {
            if (window.innerWidth <= 768) return;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            lastX = startX;
            lastY = startY;
            lastTime = performance.now();

            initialLeft = win.offsetLeft;
            initialTop = win.offsetTop;

            this.bringToFront(win);

            const onTouchMove = (tm) => {
                const t = tm.touches[0];
                const dx = t.clientX - startX;
                const dy = t.clientY - startY;
                win.style.left = `${initialLeft + dx}px`;
                win.style.top = `${initialTop + dy}px`;
            };

            const onTouchEnd = () => {
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
            };

            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', onTouchEnd);
        }, { passive: false });
    },

    toggle(winId) {
        const win = document.getElementById(winId);
        if (!win) return;
        if (win.style.display === 'none' || win.classList.contains('minimized')) {
            this.open(winId);
        } else {
            if (win === this.activeWindow) this.close(winId);
            else this.bringToFront(win);
        }
    },

    open(winId) {
        const win = document.getElementById(winId);
        if (!win) return;

        if (window.innerWidth <= 768) {
            if (window.location.hash !== '#' + winId) {
                window.history.pushState({ winId: winId }, '', '#' + winId);
            }
        }

        win.style.display = 'flex';
        win.classList.remove('minimized');

        void win.offsetWidth;

        this.bringToFront(win);
        if (Physics.enabled) {
            const rect = win.getBoundingClientRect();
            Physics.addBody(win, rect.left, rect.top);
        }
    },

    minimize(winId) {
        const win = document.getElementById(winId);
        win.classList.add('minimized');
        if (window.innerWidth <= 768) {
            if (window.location.hash === '#' + winId) {
                window.history.back();
            }
        }
    },

    close(winId) {
        const win = document.getElementById(winId);
        win.style.display = 'none';
        if (window.innerWidth <= 768) {
            if (window.location.hash === '#' + winId) {
                window.history.back();
            }
        }
    },

    closeInternal(winId) {
        const win = document.getElementById(winId);
        if (win) win.style.display = 'none';
    }
};

window.addEventListener('popstate', (event) => {
    const hash = window.location.hash;
    if (!hash || hash === '#') {
        document.querySelectorAll('.window').forEach(w => w.style.display = 'none');
    } else {
        const id = hash.replace('#', '');
        WindowManager.open(id);
        WindowManager.open(id);
    }
});

/* === СИСТЕМА ТЕРМИНАЛА === */
const Terminal = {
    history: [],
    historyIndex: -1,
    commands: ['help', 'помощь', 'clear', 'очистить', 'ls', 'список', 'open', 'открыть', 'close', 'закрыть', 'contact', 'связь', 'контакты', 'reboot', 'перезагрузка', 'cat', 'download', 'скачать', 'pdf', 'theme', 'тема', 'matrix', 'snake', 'змейка'],

    init() {
        const input = document.getElementById('term-input');
        const output = document.getElementById('term-output');
        const termWin = document.getElementById('win-term');

        // Фокус при клике в любом месте терминала
        if (termWin) {
            termWin.addEventListener('click', (e) => {
                // Не фокусироваться при выделении текста или клике на заголовок
                if (window.getSelection().toString().length === 0 && !e.target.closest('.window-header') && !e.target.classList.contains('term-clickable')) {
                    input.focus();
                }
            });
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                if (cmd) {
                    this.history.push(cmd);
                    this.historyIndex = this.history.length;
                }
                const promptHTML = `<span class="term-user">гость@система:~$</span> `;
                const cmdHTML = `<span class="term-cmd-highlight">${cmd}</span>`;
                this.print(promptHTML + cmdHTML, true);

                this.execute(cmd);
                input.value = '';
                // Автопрокрутка
                let winTermContent = document.querySelector('#win-term .window-content');
                if (winTermContent) winTermContent.scrollTop = winTermContent.scrollHeight;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.history.length > 0 && this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    input.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                const current = input.value.trim().toLowerCase();
                if (current) {
                    const match = this.commands.find(c => c.startsWith(current));
                    if (match) input.value = match;
                }
            }
        });
    },

    print(text, isHTML = false) {
        const output = document.getElementById('term-output');
        const line = document.createElement('div');
        line.className = 'term-line';
        if (isHTML) line.innerHTML = text;
        else line.textContent = text;
        output.appendChild(line);
        // Прокрутка при выводе текста
        const winTermContent = document.querySelector('#win-term .window-content');
        if (winTermContent) winTermContent.scrollTop = winTermContent.scrollHeight;
    },

    // Вставка текста в поле ввода
    insert(text) {
        const input = document.getElementById('term-input');
        input.value = text;
        input.focus();
    },

    // Программный запуск команды (для кликов)
    run(cmd) {
        const input = document.getElementById('term-input');
        input.value = cmd;
        // Имитация нажатия Enter
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            which: 13,
            bubbles: true
        });
        input.dispatchEvent(event);
    },

    // Хелпер для кликабельной команды
    printCmdHelp(cmd, desc) {
        this.print(`<span class="term-clickable" onclick="Terminal.run('${cmd}')">${cmd}</span> <span class="term-desc">${desc}</span>`, true);
    },

    // Хелпер для кликабельного файла
    printFile(name, cmdVal) {
        this.print(`<span class="term-clickable" onclick="Terminal.run('${cmdVal || name}')">${name}</span>`, true);
    },

    execute(cmd) {
        const args = cmd.toLowerCase().split(' ');
        const command = args[0];

        switch (command) {
            case 'help':
            case 'помощь':
                this.print("ДОСТУПНЫЕ КОМАНДЫ:", true);
                this.printCmdHelp('help', '- Список команд');
                this.printCmdHelp('clear', '- Очистить терминал');
                this.printCmdHelp('ls', '- Список файлов');
                this.printCmdHelp('open', '- Открыть окно (open identity)');
                this.printCmdHelp('contact', '- Связаться со мной');
                this.printCmdHelp('download', '- Скачать резюме (PDF)');
                this.printCmdHelp('snake', '- Играть в Змейку');
                this.printCmdHelp('theme', '- Сменить тему [green/amber/cyan]');
                this.printCmdHelp('reboot', '- Перезагрузка системы');
                // Подсказки
                this.printCmdHelp('gravity', '- [ЭКСПЕРИМЕНТАЛЬНАЯ ФИЗИКА]');
                this.printCmdHelp('matrix', '- [ВИЗУАЛИЗАЦИЯ КОДА]');
                break;
            case 'clear':
            case 'очистить':
                document.getElementById('term-output').innerHTML = '';
                break;
            case 'ls':
            case 'список':
                this.printFile("drwxr-xr-x  identity_matrix.exe", "open identity");
                this.printFile("drwxr-xr-x  skills_lib.dll", "open skills");
                this.printFile("drwxr-xr-x  exp_archive.db", "open exp");
                this.printFile("-rw-r--r--  readme.txt", "cat readme.txt");
                this.printFile("-rw-r--r--  contacts.vcf", "open contact");
                this.printFile("-rw-r--r--  resume_full.pdf", "download");
                break;
            case 'open':
            case 'открыть':
                if (!args[1]) {
                    this.print("Выберите модуль для запуска:", true);
                    this.print("<span class='term-clickable' onclick='Terminal.run(\"open identity\")'>[ПРОФИЛЬ]</span>  <span class='term-clickable' onclick='Terminal.run(\"open skills\")'>[НАВЫКИ]</span>  <span class='term-clickable' onclick='Terminal.run(\"open exp\")'>[АРХИВ]</span>  <span class='term-clickable' onclick='Terminal.run(\"open contact\")'>[КОНТАКТЫ]</span>", true);
                    return;
                }
                // Маппинг английских и русских ключей
                const map = {
                    'identity': 'win-identity', 'профиль': 'win-identity', 'id': 'win-identity',
                    'skills': 'win-skills', 'навыки': 'win-skills',
                    'exp': 'win-exp', 'архив': 'win-exp',
                    'term': 'win-term', 'терминал': 'win-term',
                    'contact': 'win-contact', 'связь': 'win-contact', 'контакты': 'win-contact'
                };
                const key = args[1];
                if (map[key]) {
                    WindowManager.open(map[key]);
                    this.print(`Запущен процесс: <span style="color:#fff">${map[key]}</span> ... [OK]`, true);
                } else {
                    this.print(`Ошибка: Процесс '${key}' не найден.`);
                }
                break;
            case 'contact':
            case 'связь':
            case 'контакты':
                WindowManager.open('win-contact');
                this.print("Инициализация протокола связи...", true);
                break;
            case 'close':
            case 'закрыть':
                const closeMap = {
                    'identity': 'win-identity', 'профиль': 'win-identity',
                    'skills': 'win-skills', 'навыки': 'win-skills',
                    'exp': 'win-exp', 'архив': 'win-exp',
                    'term': 'win-term', 'терминал': 'win-term',
                    'contact': 'win-contact'
                };
                if (closeMap[args[1]]) {
                    WindowManager.close(closeMap[args[1]]);
                    this.print(`Процесс завершен: ${closeMap[args[1]]}`);
                }
                break;
            case 'reboot':
            case 'перезагрузка':
                location.reload();
                break;
            case 'cat':
                if (args[1] === 'readme.txt') {
                    this.print("Привет! Я Сергей, IT-специалист.");
                    this.print("Это интерактивное резюме.");
                } else {
                    this.print("Файл не найден.");
                }
                break;
            case 'download':
            case 'скачать':
            case 'pdf':
                this.print("Инициирована загрузка файла: Иенике Сергей Дмитриевич.pdf ...");
                const link = document.createElement('a');
                link.href = 'Иенике Сергей Дмитриевич.pdf';
                link.download = 'Иенике Сергей Дмитриевич.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                this.print("Загрузка завершена [OK].");
                break;
            case 'theme':
            case 'тема':
                const theme = args[1];
                if (!theme) {
                    this.print("Выберите тему:");
                    // Предложить варианты
                    this.print("<span class='term-clickable' onclick='Terminal.run(\"theme green\")'>green</span> | <span class='term-clickable' onclick='Terminal.run(\"theme amber\")'>amber</span> | <span class='term-clickable' onclick='Terminal.run(\"theme cyan\")'>cyan</span>", true);
                    return;
                }
                const root = document.documentElement;
                if (theme === 'amber' || theme === 'orange') {
                    root.style.setProperty('--color-term', '#ffb000');
                    root.style.setProperty('--color-term-dim', 'rgba(255, 176, 0, 0.2)');
                    root.style.setProperty('--color-accent', '#ffcc00');
                    this.print("Тема изменена: <span style='color:#ffb000'>AMBER</span>", true);
                } else if (theme === 'cyan' || theme === 'blue') {
                    root.style.setProperty('--color-term', '#00ffff');
                    root.style.setProperty('--color-term-dim', 'rgba(0, 255, 255, 0.2)');
                    root.style.setProperty('--color-accent', '#0088ff');
                    this.print("Тема изменена: <span style='color:#00ffff'>CYAN</span>", true);
                } else if (theme === 'white' || theme === 'dos') {
                    root.style.setProperty('--color-term', '#ffffff');
                    root.style.setProperty('--color-term-dim', 'rgba(255, 255, 255, 0.2)');
                    root.style.setProperty('--color-accent', '#cccccc');
                    this.print("Тема изменена: <span style='color:#ffffff'>WHITE</span>", true);
                } else {
                    root.style.setProperty('--color-term', '#00ff00');
                    root.style.setProperty('--color-term-dim', 'rgba(0, 255, 0, 0.2)');
                    root.style.setProperty('--color-accent', '#00ffff');
                    this.print("Тема изменена: <span style='color:#00ff00'>CLASSIC GREEN</span>", true);
                }
                break;
            case 'matrix':
                this.print("Wake up, Neo...");
                break;
            case 'matrix':
                this.print("Загрузка матрицы...");
                const matrixLine = createBootLine();
                matrixLine.style.color = 'var(--color-term)';
                document.getElementById('term-output').appendChild(matrixLine);

                let matrixStr = '';
                const chars = '01';
                const dur = 50;
                let mInterval = setInterval(() => {
                    matrixStr += chars.charAt(Math.floor(Math.random() * chars.length));
                    if (matrixStr.length > 50) matrixStr = matrixStr.substring(matrixStr.length - 50);
                    matrixLine.textContent = matrixStr + matrixStr + matrixStr;
                }, 50);
                setTimeout(() => { clearInterval(mInterval); matrixLine.remove(); }, 3000);
                break;
            case 'gravity':
                this.print("⚠ ВНИМАНИЕ: Гравитационная аномалия активирована.");
                this.print("Введите <span class='term-clickable' onclick='Terminal.run(\"reset\")'>reset</span> для отключения.", true);
                Physics.enable();
                break;
            case 'reset':
            case 'сброс':
                if (Physics.enabled) {
                    Physics.disable();
                    this.print("Гравитация отключена. Окна зафиксированы.");
                } else {
                    this.print("Гравитация не активна.");
                }
                break;
            case 'snake':
            case 'змейка':
                startSnakeGame();
                break;
            default:
                if (command) this.print(`Команда не найдена: ${command}`);
        }
    }
};

// Инициализация Терминала
Terminal.init();



// Слушатель изменения размера окна
window.addEventListener('resize', () => {
    if (typeof resizeCanvas === 'function') resizeCanvas();

    if (window.innerWidth < 768) {
        if (Physics.enabled) Physics.disable();
    }
});

// Инициализация WM
WindowManager.init();

/* === SNAKE GAME === */
let snakeGameInterval;
function startSnakeGame() {
    const output = document.getElementById('term-output');
    const input = document.getElementById('term-input');
    const inputLine = input ? input.parentElement : null;
    const container = document.getElementById('snake-container');
    const canvas = document.getElementById('snake-canvas');

    if (!container || !canvas || !inputLine) {
        console.error("Snake init failed");
        return;
    }

    const ctx = canvas.getContext('2d');

    output.style.display = 'none';
    inputLine.style.display = 'none';
    container.style.display = 'block';

    const rootStyle = getComputedStyle(document.documentElement);
    const colorSnake = rootStyle.getPropertyValue('--color-term').trim() || '#00ff00';
    const colorApple = rootStyle.getPropertyValue('--color-error').trim() || '#ff0000';
    const colorGold = '#FFD700';

    const gridSize = 20;
    const tileCountX = canvas.width / gridSize;
    const tileCountY = canvas.height / gridSize;

    let prevX = 10;
    let prevY = 10;
    let trail = [];
    let tail = 5;
    let appleX = 12;
    let appleY = 12;
    let velX = 1;
    let velY = 0;
    let score = 0;
    let gameOver = false;
    let gameWon = false;

    function drawCup() {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const scale = 4;

        ctx.fillStyle = colorGold;

        ctx.fillRect(cx - 20, cy - 40, 40, 40);
        ctx.fillRect(cx - 30, cy - 35, 10, 20);
        ctx.fillRect(cx + 20, cy - 35, 10, 20);
        ctx.fillRect(cx - 5, cy, 10, 20);
        ctx.fillRect(cx - 20, cy + 20, 40, 10);
        ctx.fillStyle = 'white';
        ctx.fillRect(cx + 5, cy - 30, 5, 20);
    }

    function winGame() {
        gameWon = true;
        clearInterval(snakeGameInterval);
        gameWon = true;
        clearInterval(snakeGameInterval);
        Sfx.play('success');

        EasterEggs.unlock(1);

        const badge = document.getElementById('snake-master-badge');
        if (badge) badge.style.display = 'flex';
        const trophy = document.getElementById('trophy-icon');
        if (trophy) trophy.style.display = 'flex';

        const promptUser = document.getElementById('term-prompt-user');
        if (promptUser) promptUser.textContent = 'master';

        const godWidget = document.getElementById('god-mode-widget');
        if (godWidget) {
            godWidget.style.display = 'block';
            Sfx.play('success');
        }

        const startBtn = document.getElementById('main-start-btn');
        const startText = document.getElementById('start-btn-text');
        if (startBtn && startText) {
            startText.textContent = "АДМИН";
            startBtn.style.color = "#000000";
            startBtn.style.background = "#FFD700";
            startBtn.style.borderColor = "#FFD700";
            startBtn.style.boxShadow = "0 0 15px #FFD700";
            startBtn.style.fontWeight = "bold";
        }

        if (!document.getElementById('secret-skill-unlocked')) {
            const skills = document.getElementById('skills-container');
            if (skills) {
                const secretHtml = `
                        <div class="skill-bar" id="secret-skill-unlocked" style="animation: flash-anim 1s;">
                            <div class="skill-name"><span style="color:var(--color-warning)">★ SNAKE MASTER</span></div>
                            <div class="progress-track">
                                <div class="progress-fill" style="width: 100%; background: var(--color-warning);"></div>
                            </div>
                        </div>`;
                skillsContainer.innerHTML = secretHtml + skillsContainer.innerHTML;
                animateSkills();
            }
        }

        let frame = 0;
        const winLoop = setInterval(() => {
            if (!container.offsetParent) { clearInterval(winLoop); return; }

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? colorGold : colorApple;
                ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 4, 4);
            }

            drawCup();

            ctx.fillStyle = 'white';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            if (frame % 10 < 5) {
                ctx.fillText("ПОБЕДА!", canvas.width / 2, 50);
            }
            ctx.fillText("Секрет разблокирован!", canvas.width / 2, canvas.height - 50);

            ctx.font = '12px monospace';
            ctx.fillText("Нажмите Q для выхода", canvas.width / 2, canvas.height - 20);

            frame++;
        }, 100);
    }

    function gameLoop() {
        if (gameOver || gameWon) return;

        prevX += velX;
        prevY += velY;

        if (prevX < 0) prevX = tileCountX - 1;
        if (prevX > tileCountX - 1) prevX = 0;
        if (prevY < 0) prevY = tileCountY - 1;
        if (prevY > tileCountY - 1) prevY = 0;

        // Фон
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Змейка
        ctx.fillStyle = colorSnake;
        for (let i = 0; i < trail.length; i++) {
            ctx.fillRect(trail[i].x * gridSize, trail[i].y * gridSize, gridSize - 2, gridSize - 2);
            if (trail[i].x === prevX && trail[i].y === prevY && (trail.length > 2)) {
                tail = 5;
                score = 0;
                velX = 0;
                velY = 0;
            }
        }

        trail.push({ x: prevX, y: prevY });
        while (trail.length > tail) {
            trail.shift();
        }

        // Яблоко
        ctx.fillStyle = colorApple;
        ctx.fillRect(appleX * gridSize, appleY * gridSize, gridSize - 2, gridSize - 2);

        if (appleX === prevX && appleY === prevY) {
            tail++;
            score++;
            try { Sfx.play('key'); } catch (e) { }
            appleX = Math.floor(Math.random() * tileCountX);
            appleY = Math.floor(Math.random() * tileCountY);

            // Не спавнить на змейке
            let onSnake = true;
            while (onSnake) {
                onSnake = false;
                for (let t of trail) {
                    if (t.x === appleX && t.y === appleY) {
                        onSnake = true;
                        appleX = Math.floor(Math.random() * tileCountX);
                        appleY = Math.floor(Math.random() * tileCountY);
                        break;
                    }
                }
            }

            // Победа!
            if (score >= 10) {
                winGame();
                return;
            }
        }

        // Счет
        ctx.fillStyle = 'white';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText("Счет: " + score + "/10", 10, 20);

        if (velX === 0 && velY === 0 && trail.length > 2) {
            // Пауза / Проигрыш
            ctx.fillStyle = 'white';
            ctx.fillText("Вы проиграли! Для перезапуска игры нажмите стрелку.", canvas.width / 2 - 20, canvas.height / 2);
        }
    }

    function keyPush(evt) {
        let handled = false;
        const key = evt.key.toLowerCase();

        if (gameWon) {
            if (key === 'q' || key === 'й' || key === 'escape') {
                stopSnakeGame();
            }
            return;
        }

        switch (key) {
            case 'arrowleft': if (velX !== 1) { velX = -1; velY = 0; handled = true; } break;
            case 'arrowup': if (velY !== 1) { velX = 0; velY = -1; handled = true; } break;
            case 'arrowright': if (velX !== -1) { velX = 1; velY = 0; handled = true; } break;
            case 'arrowdown': if (velY !== -1) { velX = 0; velY = 1; handled = true; } break;
            case 'q':
            case 'й': // Русская Q
            case 'escape':
                stopSnakeGame();
                handled = true;
                break;
        }
        if (handled) {
            evt.preventDefault();
            evt.stopPropagation();
        }
    }

    document.addEventListener('keydown', keyPush);
    snakeGameInterval = setInterval(gameLoop, 100);

    // УПРАВЛЕНИЕ ДЛЯ МОБИЛЬНЫХ
    let controlsDiv = document.getElementById('snake-controls');
    if (!controlsDiv) {
        controlsDiv = document.createElement('div');
        controlsDiv.id = 'snake-controls';
        controlsDiv.style.cssText = 'justify-content:center; align-items:center; gap:15px; margin-top:10px; user-select:none; flex-wrap:wrap;';
        controlsDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <button class="snake-btn" id="s-left">←</button>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button class="snake-btn" id="s-up">↑</button>
                    <button class="snake-btn" id="s-down">↓</button>
                </div>
                <button class="snake-btn" id="s-right">→</button>
            </div>
            <button class="snake-btn" id="s-exit" style="width:auto; padding:0 15px; font-size:14px; border-color:var(--color-error); color:var(--color-error);">ВЫХОД</button>
        `;
        // Add styles dynamically
        const style = document.createElement('style');
        style.innerHTML = `
            .snake-btn {
                width: 50px; height: 50px; 
                background: #111; border: 1px solid var(--color-term); color: var(--color-term);
                font-size: 20px; border-radius: 5px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                -webkit-tap-highlight-color: transparent;
            }
            .snake-btn:active { background: var(--color-term); color: #000; }
            
            #snake-controls { display: none !important; }
            
            @media (max-width: 768px) {
                #snake-controls { display: flex !important; }
            }
        `;
        document.head.appendChild(style);
        container.appendChild(controlsDiv);

        const bind = (id, fn) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); }, { passive: false });
                btn.addEventListener('click', fn);
            }
        };

        bind('s-left', () => { if (velX !== 1) { velX = -1; velY = 0; } });
        bind('s-right', () => { if (velX !== -1) { velX = 1; velY = 0; } });
        bind('s-up', () => { if (velY !== 1) { velX = 0; velY = -1; } });
        bind('s-down', () => { if (velY !== -1) { velX = 0; velY = 1; } });
        bind('s-exit', () => window.stopSnakeGame());
    }
    // CSS handles display

    window.stopSnakeGame = function () {
        clearInterval(snakeGameInterval);
        document.removeEventListener('keydown', keyPush);
        container.style.display = 'none';
        if (controlsDiv) controlsDiv.style.removeProperty('display');

        output.style.display = 'block';
        inputLine.style.display = 'flex';
        if (input) input.focus();
    };
}



/* РЕЖИМ LOW FX */
function toggleLowGFX() {
    document.body.classList.toggle('low-fx');
    const btn = document.getElementById('btn-lowfx');
    if (document.body.classList.contains('low-fx')) {
        btn.textContent = "[FX: OFF]";
        btn.style.color = "var(--color-warning)";
    } else {
        btn.textContent = "[FX: ON]";
        btn.style.color = "";
    }
}

/* МОБИЛЬНАЯ ОПТИМИЗАЦИЯ */
const originalOpen = WindowManager.open;
WindowManager.open = function (winId) {
    originalOpen.call(this, winId);
    if (window.innerWidth < 768) {
        const win = document.getElementById(winId);
        win.classList.add('mobile-optimized');

        // Добавить текст Закрыть/Назад если нет
        let backBtn = win.querySelector('.mobile-back-btn');
        if (!backBtn) {
            // Возможно просто убедиться, что кнопка закрытия достаточно большая
        }
    }
};

let seconds = 0;
setInterval(() => {
    seconds++;
    const date = new Date(0);
    date.setSeconds(seconds);
    const uptime = document.getElementById('uptime');
    if (uptime) uptime.innerText = date.toISOString().substr(11, 8);
}, 1000);
