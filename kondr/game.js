// главный объект игры
const game = {
    // данные игрока
    currentUser: null,
    currentNight: 1,
    coins: 0,
    gameMode: 'fnaf1', // 'fnaf1' или 'fnaf2'
    items: {
        goodmanHelp: false
    },
    
    // состояние игры
    gameActive: false,
    gameTime: 0, // в секундах (0 = 12 AM, 360 = 6 AM)
    power: 100,
    powerUsage: 1,
    
    // механики FNAF 1
    doors: { left: false, right: false },
    lights: { left: false, right: false },
    
    // механики FNAF 2
    maskOn: false,
    flashlight: { left: false, right: false, vent: false },
    musicBox: 100,
    musicBoxDrainRate: 0.1,
    
    // камеры
    cameraOpen: false,
    currentCamera: 0,
    cameraLocations: [
        { name: 'CAM 1A', title: 'Show Stage' },
        { name: 'CAM 1B', title: 'Dining Area' },
        { name: 'CAM 1C', title: 'Pirate Cove' },
        { name: 'CAM 2A', title: 'West Hall' },
        { name: 'CAM 2B', title: 'East Hall' },
        { name: 'CAM 3', title: 'Kitchen' },
        { name: 'CAM 4A', title: 'West Hall Corner' },
        { name: 'CAM 4B', title: 'East Hall Corner' },
        { name: 'CAM 5', title: 'Backstage' },
        { name: 'CAM 6', title: 'Restrooms' },
        { name: 'CAM 7', title: 'Supply Closet' }
    ],
    
    // кондрат - система как в fnaf
    kondrat: {
        location: 0, // индекс камеры где находится
        // путь движения: 0 (stage) -> 1 или 5 -> 3 (west hall) или 2 -> 4 (east hall) -> door
        phase: 1, // текущая картинка (1, 2, или 3)
        aiLevel: 0, // уровень AI (0-20)
        moveTimer: 0,
        movementOpportunities: 0,
        atDoor: null, // 'left' или 'right'
        doorAttackTimer: 0,
        luredTo: null, // камера куда его привлекли звуком
        inVent: false, // в вентиляции
        ventLocation: null // 'left', 'right' или 'center'
    },
    
    // таймеры
    gameTimer: null,
    powerTimer: null,
    aiTimer: null,
    nextAiCheck: 5000, // динамический интервал для AI
    lureCooldown: 0, // кулдаун на привлечение звуком
    
    // звуки
    sounds: {
        footsteps: new Audio('kondrat.mp3'),
        jumpscare: new Audio('kondrat.mp3'),
        lure: new Audio('kondrat.mp3') // звук привлечения
    },
    
    init() {
        console.log('init() вызван');
        // проверяем есть ли сохраненный пользователь
        const savedUser = localStorage.getItem('fnacCurrentUser');
        if (savedUser) {
            this.currentUser = savedUser;
            // загружаем последний выбранный режим или ставим fnaf1 по умолчанию
            const savedMode = localStorage.getItem('fnacGameMode') || 'fnaf1';
            this.gameMode = savedMode;
            console.log('Загружен режим:', savedMode);
            this.showMenu();
        } else {
            this.showAuth();
        }
    },
    
    // авторизация и регистрация
    showAuth() {
        this.hideAllScreens();
        document.getElementById('authScreen').classList.add('active');
    },
    
    showLogin() {
        console.log('showLogin() вызвана');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    },
    
    showRegister() {
        console.log('showRegister() вызвана');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    },
    
    login() {
        console.log('login() вызвана');
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        console.log('Имя:', username, 'Пароль:', password ? 'есть' : 'нет');
        
        if (!username || !password) {
            alert('Заполни все поля');
            return;
        }
        
        // проверяем существует ли пользователь
        const userDataStr = localStorage.getItem('fnac_user_' + username);
        
        if (!userDataStr) {
            alert('Пользователь не найден. Зарегистрируйся сначала.');
            return;
        }
        
        const userData = JSON.parse(userDataStr);
        
        // проверяем пароль
        if (userData.password !== password) {
            alert('Неверный пароль');
            return;
        }
        
        // успешный вход
        this.currentUser = username;
        localStorage.setItem('fnacCurrentUser', username);
        this.showModeSelect();
    },
    
    register() {
        console.log('register() вызвана');
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        console.log('Регистрация:', username, password ? 'есть пароль' : 'нет пароля');
        
        if (!username || !password || !passwordConfirm) {
            alert('Заполни все поля');
            return;
        }
        
        if (username.length < 3) {
            alert('Имя должно быть минимум 3 символа');
            return;
        }
        
        if (password.length < 4) {
            alert('Пароль должен быть минимум 4 символа');
            return;
        }
        
        if (password !== passwordConfirm) {
            alert('Пароли не совпадают');
            return;
        }
        
        // проверяем не занято ли имя
        if (localStorage.getItem('fnac_user_' + username)) {
            alert('Это имя уже занято');
            return;
        }
        
        // создаем нового пользователя с паролем и прогрессом
        const newUser = {
            username: username,
            password: password,
            unlockedNights: 1,
            completedNights: [],
            coins: 0,
            items: {
                goodmanHelp: false
            },
            progress: {
                fnaf1: { maxNight: 1, completed: [] },
                fnaf2: { maxNight: 1, completed: [] }
            }
        };
        
        localStorage.setItem('fnac_user_' + username, JSON.stringify(newUser));
        this.currentUser = username;
        localStorage.setItem('fnacCurrentUser', username);
        alert('Аккаунт создан успешно!');
        this.showModeSelect();
    },
    
    logout() {
        localStorage.removeItem('fnacCurrentUser');
        this.currentUser = null;
        // очищаем все поля
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerPasswordConfirm').value = '';
        this.showAuth();
    },
    
    // экран выбора режима
    showModeSelect() {
        this.hideAllScreens();
        document.getElementById('modeSelectScreen').classList.add('active');
    },
    
    selectMode(mode) {
        console.log('selectMode вызван, режим:', mode);
        this.gameMode = mode;
        // сохраняем выбранный режим
        localStorage.setItem('fnacGameMode', mode);
        this.showMenu();
    },
    
    // меню
    
    showMenu() {
        console.log('showMenu вызвана');
        this.hideAllScreens();
        const menuScreen = document.getElementById('menuScreen');
        if (!menuScreen) {
            console.error('menuScreen не найден!');
            return;
        }
        menuScreen.classList.add('active');
        console.log('menuScreen активирован');
        
        // добавляем класс для стилизации в зависимости от режима
        menuScreen.classList.remove('fnaf1-style', 'fnaf2-style');
        if (this.gameMode === 'fnaf1') {
            menuScreen.classList.add('fnaf1-style');
        } else {
            menuScreen.classList.add('fnaf2-style');
        }
        
        // загружаем прогресс
        const userData = JSON.parse(localStorage.getItem('fnac_user_' + this.currentUser));
        
        // миграция старых данных
        if (!userData.coins) userData.coins = 0;
        if (!userData.items) userData.items = { goodmanHelp: false };
        if (!userData.progress) {
            userData.progress = {
                fnaf1: { maxNight: userData.unlockedNights || 1, completed: userData.completedNights || [] },
                fnaf2: { maxNight: 1, completed: [] }
            };
            localStorage.setItem('fnac_user_' + this.currentUser, JSON.stringify(userData));
        }
        
        this.coins = userData.coins;
        this.items = userData.items;
        
        document.getElementById('welcomeText').textContent = `Добро пожаловать, ${this.currentUser}!`;
        document.getElementById('coinBalance').textContent = this.coins;
        
        // обновляем заголовок в зависимости от режима
        const menuTitle = document.getElementById('menuTitle');
        if (this.gameMode === 'fnaf1') {
            menuTitle.textContent = "FIVE NIGHTS AT KONDRAT'S";
        } else {
            menuTitle.textContent = "FIVE NIGHTS AT KONDRAT'S 2";
        }
        
        // получаем прогресс для текущего режима
        const modeProgress = userData.progress[this.gameMode];
        
        // создаем кнопки ночей
        const nightButtons = document.getElementById('nightButtons');
        nightButtons.innerHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            const btn = document.createElement('button');
            btn.className = 'night-btn';
            btn.textContent = `Ночь ${i}`;
            
            if (i <= modeProgress.maxNight) {
                btn.onclick = () => this.startNight(i);
                if (modeProgress.completed.includes(i)) {
                    btn.classList.add('completed');
                    btn.textContent += ' ✓';
                }
            } else {
                btn.disabled = true;
                btn.classList.add('locked');
                btn.textContent += ' 🔒';
            }
            
            nightButtons.appendChild(btn);
        }
        
        console.log('Кнопки ночей созданы:', nightButtons.children.length);
        
        // обновляем элементы UI в зависимости от режима
        this.updateModeUI();
    },
    
    // магазин
    openShop() {
        const userData = JSON.parse(localStorage.getItem('fnac_user_' + this.currentUser));
        this.coins = userData.coins || 0;
        this.items = userData.items || { goodmanHelp: false };
        
        document.getElementById('shopCoinBalance').textContent = this.coins;
        
        // обновляем кнопку покупки
        const buyBtn = document.getElementById('buyGoodmanBtn');
        const ownedIndicator = document.getElementById('goodmanOwned');
        
        if (this.items.goodmanHelp) {
            buyBtn.style.display = 'none';
            ownedIndicator.style.display = 'block';
        } else {
            buyBtn.style.display = 'inline-block';
            ownedIndicator.style.display = 'none';
            
            if (this.coins < 50) {
                buyBtn.disabled = true;
                buyBtn.classList.add('disabled');
            } else {
                buyBtn.disabled = false;
                buyBtn.classList.remove('disabled');
            }
        }
        
        this.hideAllScreens();
        document.getElementById('shopScreen').classList.add('active');
    },
    
    closeShop() {
        this.showMenu();
    },
    
    buyItem(itemId) {
        if (itemId === 'goodmanHelp') {
            if (this.coins >= 50 && !this.items.goodmanHelp) {
                this.coins -= 50;
                this.items.goodmanHelp = true;
                
                // сохраняем
                const userData = JSON.parse(localStorage.getItem('fnac_user_' + this.currentUser));
                userData.coins = this.coins;
                userData.items = this.items;
                localStorage.setItem('fnac_user_' + this.currentUser, JSON.stringify(userData));
                
                alert('Куплено! Теперь ты начинаешь игру со 110% энергии!');
                this.openShop(); // обновляем магазин
            }
        }
    },
    
    // запуск игры
    startNight(night) {
        this.currentNight = night;
        this.hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        document.getElementById('currentNight').textContent = night;
        
        // устанавливаем data-mode для CSS
        document.body.setAttribute('data-mode', this.gameMode);
        
        // загружаем предметы
        const userData = JSON.parse(localStorage.getItem('fnac_user_' + this.currentUser));
        this.items = userData.items || { goodmanHelp: false };
        
        // сброс состояния
        this.gameActive = true;
        this.gameTime = 0;
        // если куплена помощь Гудмана - начинаем со 110%
        this.power = this.items.goodmanHelp ? 110 : 100;
        this.powerUsage = 1;
        
        // сброс в зависимости от режима
        if (this.gameMode === 'fnaf1') {
            this.doors = { left: false, right: false };
            this.lights = { left: false, right: false };
            
            // сбрасываем визуалы дверей и света
            ['left', 'right'].forEach(side => {
                const doorVisual = document.getElementById(side + 'Door');
                const lightVisual = document.getElementById(side + 'Light');
                
                if (doorVisual) doorVisual.classList.remove('closed');
                if (lightVisual) lightVisual.style.opacity = '0';
            });
            
            // скрываем музыкальную шкатулку в FNAF 1
            const musicBoxIndicator = document.querySelector('.music-box-indicator');
            if (musicBoxIndicator) musicBoxIndicator.style.display = 'none';
        } else {
            this.maskOn = false;
            this.flashlight = { left: false, right: false, vent: false };
            this.musicBox = 100;
            
            // показываем музыкальную шкатулку в FNAF 2
            const musicBoxIndicator = document.querySelector('.music-box-indicator');
            if (musicBoxIndicator) musicBoxIndicator.style.display = 'block';
        }
        
        this.cameraOpen = false;
        
        // настройка AI кондрата как в fnaf
        // ночь 1: level 0, ночь 2: level 5, ночь 3: level 10, и т.д.
        const aiLevels = [0, 0, 1, 5, 10, 15, 20];
        this.kondrat = {
            location: 0, // начинаем на сцене
            phase: 1,
            aiLevel: aiLevels[night] || 20,
            baseAiLevel: aiLevels[night] || 20, // запоминаем начальный уровень для прогрессии
            moveTimer: 0,
            movementOpportunities: 0,
            atDoor: null,
            doorAttackTimer: 0
        };
        
        // обновляем интерфейс и элементы управления
        this.updateUI();
        this.updateModeUI();
        this.renderOffice();
        
        // запускаем таймеры
        this.startGameLoop();
    },
    
    startGameLoop() {
        // таймер игрового времени (6 реальных минут = 6 игровых часов = 360 секунд)
        this.gameTimer = setInterval(() => {
            if (!this.gameActive) return;
            
            this.gameTime += 1;
            
            // отсчет кулдауна привлечения
            if (this.lureCooldown > 0) {
                this.lureCooldown--;
            }
            
            // обновляем фазу кондрата по времени
            const hour = Math.floor(this.gameTime / 60);
            if (hour >= 3 && this.kondrat.phase < 3) {
                this.kondrat.phase = 3;
            } else if (hour >= 2 && this.kondrat.phase < 2) {
                this.kondrat.phase = 2;
            }
            
            // прогрессивное увеличение AI level (каждый час +1)
            // делает игру напряженнее к концу ночи
            const aiBoost = Math.floor(hour * 0.5); // плавное увеличение
            this.kondrat.aiLevel = Math.min(20, this.kondrat.baseAiLevel + aiBoost);
            
            this.updateUI();
            
            // проверка победы 6 AM
            if (this.gameTime >= 360) {
                this.win();
            }
        }, 1000);
        
        // таймер расхода энергии (как в fnaf - медленнее)
        this.powerTimer = setInterval(() => {
            if (!this.gameActive || this.power <= 0) return;
            
            // расчет расхода в зависимости от режима
            let usage = 1; // базовый расход
            
            if (this.gameMode === 'fnaf1') {
                if (this.doors.left) usage += 1;
                if (this.doors.right) usage += 1;
                if (this.lights.left) usage += 1;
                if (this.lights.right) usage += 1;
                if (this.cameraOpen) usage += 1;
            } else {
                if (this.flashlight.left) usage += 1;
                if (this.flashlight.right) usage += 1;
                if (this.flashlight.vent) usage += 1;
                if (this.cameraOpen) usage += 1;
            }
            
            this.powerUsage = usage;
            // очень медленный расход для стратегической игры - 0.015%
            // можно активно использовать камеры и механики
            this.power -= usage * 0.015;
            
            if (this.power <= 0) {
                this.power = 0;
                this.powerOutage();
            }
            
            this.updateUI();
        }, 100);
        
        // AI таймер - динамический интервал (3-7 секунд) для непредсказуемости
        this.scheduleNextAICheck();
        
        // таймер музыкальной шкатулки (только в FNAF 2)
        if (this.gameMode === 'fnaf2') {
            this.musicBoxTimer = setInterval(() => {
            if (!this.gameActive) return;
            
            // шкатулка разряжается
            this.musicBox -= this.musicBoxDrainRate;
            
            if (this.musicBox <= 0) {
                this.musicBox = 0;
                // если шкатулка села - атака через некоторое время
                if (!this.kondrat.musicBoxAttack) {
                    this.kondrat.musicBoxAttack = true;
                    setTimeout(() => {
                        if (this.gameActive && this.musicBox <= 0) {
                            this.lose();
                        }
                    }, 5000 + Math.random() * 5000); // 5-10 секунд
                }
            } else {
                this.kondrat.musicBoxAttack = false;
            }
            
            this.updateUI();
        }, 100);
        }
    },
    
    scheduleNextAICheck() {
        // случайный интервал от 3 до 7 секунд - делает поведение менее предсказуемым
        this.nextAiCheck = 3000 + Math.random() * 4000;
        
        this.aiTimer = setTimeout(() => {
            if (!this.gameActive) return;
            this.updateKondratAI();
            this.scheduleNextAICheck(); // планируем следующую проверку
        }, this.nextAiCheck);
    },
    
    // система AI как в fnaf
    updateKondratAI() {
        // если в вентиляции (только FNAF 2)
        if (this.gameMode === 'fnaf2' && this.kondrat.inVent) {
            this.kondrat.doorAttackTimer++;
            
            // если маска надета - уходит
            if (this.maskOn) {
                if (Math.random() < 0.6) {
                    this.kondrat.inVent = false;
                    this.kondrat.ventLocation = null;
                    // возвращается на карту
                    const previousLocations = [1, 2, 5, 8];
                    this.kondrat.location = previousLocations[Math.floor(Math.random() * previousLocations.length)];
                    this.kondrat.doorAttackTimer = 0;
                    this.renderOffice();
                }
            } else {
                // маска не надета - атакует
                const attackChance = 0.15 + (this.kondrat.doorAttackTimer * 0.08);
                if (Math.random() < attackChance) {
                    this.lose();
                }
            }
            return;
        }
        
        // если у дверей
        if (this.kondrat.atDoor) {
            this.kondrat.doorAttackTimer++;
            
            if (this.gameMode === 'fnaf1') {
                // FNAF 1 - двери блокируют
                const door = this.doors[this.kondrat.atDoor];
                if (door) {
                    // дверь закрыта - уходит
                    if (Math.random() < 0.75) {
                        this.kondrat.atDoor = null;
                        const previousLocations = [1, 2, 3, 4];
                        this.kondrat.location = previousLocations[Math.floor(Math.random() * previousLocations.length)];
                        this.kondrat.doorAttackTimer = 0;
                        this.renderOffice();
                    }
                } else {
                    // дверь открыта - атакует (замедленно, как в FNAF 1)
                    // дает ~20-30 секунд на закрытие двери
                    const attackChance = 0.05 + (this.kondrat.doorAttackTimer * 0.03);
                    if (Math.random() < attackChance) {
                        this.lose();
                    }
                }
            } else {
                // FNAF 2 - только маска спасает
                if (this.maskOn) {
                    if (Math.random() < 0.7) {
                        this.kondrat.atDoor = null;
                        const previousLocations = [1, 2, 3, 4];
                        this.kondrat.location = previousLocations[Math.floor(Math.random() * previousLocations.length)];
                        this.kondrat.doorAttackTimer = 0;
                        this.renderOffice();
                    }
                } else {
                    // атакует если маска не надета
                    const attackChance = 0.2 + (this.kondrat.doorAttackTimer * 0.1);
                    if (Math.random() < attackChance) {
                        this.lose();
                    }
                }
            }
            return;
        }
        
        // движение по карте (система как в fnaf 1)
        this.kondrat.movementOpportunities++;
        
        // если привлечен звуком - идет туда с высоким приоритетом
        if (this.kondrat.luredTo !== null) {
            this.kondrat.location = this.kondrat.luredTo;
            this.kondrat.luredTo = null;
            this.updateCamera();
            return;
        }
        
        // проверяем можно ли двигаться (ai level проверка)
        const random = Math.floor(Math.random() * 20) + 1;
        
        if (random <= this.kondrat.aiLevel) {
            // кондрат пытается переместиться
            const currentLoc = this.kondrat.location;
            let nextLocation = null;
            
            // маршруты передвижения с новыми камерами
            switch(currentLoc) {
                case 0: // CAM 1A (Show Stage) -> может пойти в 1B, 5 или 6
                    const choice = Math.random();
                    if (choice < 0.5) nextLocation = 1;
                    else if (choice < 0.8) nextLocation = 8;
                    else nextLocation = 9;
                    break;
                    
                case 1: // CAM 1B (Dining) -> идет в 3 (West Hall) или 5 (Kitchen)
                    nextLocation = Math.random() < 0.6 ? 3 : 5;
                    break;
                    
                case 2: // CAM 1C (Pirate Cove) -> идет в 4 или 7 (East Hall Corner)
                    nextLocation = Math.random() < 0.7 ? 4 : 7;
                    break;
                    
                case 3: // CAM 2A (West Hall)
                    if (this.gameMode === 'fnaf2') {
                        // FNAF 2 - может идти в вентиляцию
                        const westChoice = Math.random();
                        if (westChoice < 0.4) {
                            this.kondrat.inVent = true;
                            this.kondrat.ventLocation = 'left';
                            this.kondrat.doorAttackTimer = 0;
                            if (this.kondrat.phase === 3) {
                                this.sounds.footsteps.currentTime = 0;
                                this.sounds.footsteps.play().catch(() => {});
                            }
                            this.renderOffice();
                            return;
                        } else if (westChoice < 0.7) {
                            this.kondrat.atDoor = 'left';
                            this.kondrat.doorAttackTimer = 0;
                            this.renderOffice();
                            return;
                        } else {
                            nextLocation = 6;
                        }
                    } else {
                        // FNAF 1 - просто идет к двери или в угол
                        if (Math.random() < 0.7) {
                            this.kondrat.atDoor = 'left';
                            this.kondrat.doorAttackTimer = 0;
                            this.renderOffice();
                            return;
                        } else {
                            nextLocation = 6;
                        }
                    }
                    break;
                    
                case 4: // CAM 2B (East Hall)
                    if (this.gameMode === 'fnaf2') {
                        const eastChoice = Math.random();
                        if (eastChoice < 0.4) {
                            this.kondrat.inVent = true;
                            this.kondrat.ventLocation = 'right';
                            this.kondrat.doorAttackTimer = 0;
                            if (this.kondrat.phase === 3) {
                                this.sounds.footsteps.currentTime = 0;
                                this.sounds.footsteps.play().catch(() => {});
                            }
                            this.renderOffice();
                            return;
                        } else if (eastChoice < 0.7) {
                            this.kondrat.atDoor = 'right';
                            this.kondrat.doorAttackTimer = 0;
                            this.renderOffice();
                            return;
                        } else {
                            nextLocation = 7;
                        }
                    } else {
                        // FNAF 1 - просто идет к двери или в угол
                        if (Math.random() < 0.7) {
                            this.kondrat.atDoor = 'right';
                            this.kondrat.doorAttackTimer = 0;
                            this.renderOffice();
                            return;
                        } else {
                            nextLocation = 7;
                        }
                    }
                    break;
                    
                case 5: // CAM 3 (Kitchen) -> может пойти в 1 или 3
                    nextLocation = Math.random() < 0.5 ? 1 : 3;
                    break;
                    
                case 6: // CAM 4A (West Hall Corner) -> идет в 3
                    nextLocation = 3;
                    break;
                    
                case 7: // CAM 4B (East Hall Corner) -> идет в 4
                    nextLocation = 4;
                    break;
                    
                case 8: // CAM 5 (Backstage) -> может пойти в 3, 2 или 10
                    const bChoice = Math.random();
                    if (bChoice < 0.4) nextLocation = 3;
                    else if (bChoice < 0.7) nextLocation = 2;
                    else nextLocation = 10;
                    break;
                    
                case 9: // CAM 6 (Restrooms) -> идет в 1 или 5
                    nextLocation = Math.random() < 0.5 ? 1 : 5;
                    break;
                    
                case 10: // CAM 7 (Supply Closet) -> идет в 8 или 3
                    nextLocation = Math.random() < 0.5 ? 8 : 3;
                    break;
            }
            
            if (nextLocation !== null) {
                this.kondrat.location = nextLocation;
                
                // звук шагов когда кондрат приближается к дверям (в углах коридора)
                if (nextLocation === 6 || nextLocation === 7) {
                    this.playSound('footsteps');
                }
                
                this.updateCamera(); // обновляем камеру если открыта
            }
        }
    },
    
    // управление FNAF 2
    toggleMask() {
        if (!this.gameActive) return;
        
        this.maskOn = !this.maskOn;
        this.renderOffice();
        
        // показываем/скрываем вид маски
        const maskView = document.getElementById('maskView');
        const officeView = document.getElementById('officeView');
        if (this.maskOn) {
            maskView.style.display = 'block';
            officeView.style.opacity = '0.3';
        } else {
            maskView.style.display = 'none';
            officeView.style.opacity = '1';
        }
    },
    
    toggleFlashlight(location) {
        if (!this.gameActive || this.power <= 0) return;
        
        if (location === 'vent') {
            this.flashlight.vent = !this.flashlight.vent;
        } else {
            this.flashlight[location] = !this.flashlight[location];
        }
        
        this.renderOffice();
        this.updateUI();
    },
    
    windMusicBox() {
        if (!this.gameActive || !this.cameraOpen) return;
        
        // заводим шкатулку на камерах
        this.musicBox = Math.min(100, this.musicBox + 2);
        this.updateUI();
    },
    
    // управление FNAF 1
    toggleDoor(side) {
        if (!this.gameActive || this.gameMode !== 'fnaf1') return;
        if (this.power <= 0) return;
        
        this.doors[side] = !this.doors[side];
        
        // звук двери
        this.playSound('door');
        
        const btn = document.getElementById(side + 'DoorBtn');
        if (btn) {
            btn.classList.toggle('active', this.doors[side]);
        }
        
        // показываем/скрываем визуал закрытой двери с анимацией
        const doorVisual = document.getElementById(side + 'Door');
        if (doorVisual) {
            if (this.doors[side]) {
                doorVisual.classList.add('closed');
            } else {
                doorVisual.classList.remove('closed');
            }
        }
        
        this.updateUI();
    },
    
    toggleLight(side, state) {
        if (!this.gameActive || this.gameMode !== 'fnaf1') return;
        if (this.power <= 0) return;
        
        // свет работает только пока зажата кнопка
        this.lights[side] = state;
        console.log(`toggleLight: side=${side}, state=${state}`);
        
        // звук света
        if (state) {
            this.playSound('light');
        }
        
        const btn = document.getElementById(side + 'LightBtn');
        if (btn) {
            btn.classList.toggle('active', this.lights[side]);
        }
        
        // показываем/скрываем свет
        const lightElement = document.getElementById(side + 'Light');
        console.log(`Элемент света ${side}Light:`, lightElement);
        if (lightElement) {
            lightElement.style.display = 'block'; // принудительно показываем
            lightElement.style.opacity = this.lights[side] ? '1' : '0';
            console.log(`Установлена opacity света: ${lightElement.style.opacity}`);
        }
        
        // проверяем, есть ли Кондрат у двери
        if (this.lights[side] && this.kondrat.atDoor === side) {
            // показываем Кондрата в дверном проеме
            const doorElement = document.getElementById('kondrat' + (side === 'left' ? 'Left' : 'Right') + 'Door');
            if (doorElement) doorElement.style.opacity = '1';
        } else {
            // скрываем Кондрата когда свет выключен
            const doorElement = document.getElementById('kondrat' + (side === 'left' ? 'Left' : 'Right') + 'Door');
            if (doorElement) doorElement.style.opacity = '0';
        }
        
        this.updateUI();
    },
    
    toggleCamera() {
        if (!this.gameActive || this.power <= 0) return;
        
        this.cameraOpen = !this.cameraOpen;
        const panel = document.getElementById('cameraPanel');
        const officeView = document.getElementById('officeView');
        
        if (this.cameraOpen) {
            panel.classList.add('active');
            officeView.style.display = 'none';
            this.updateCamera();
        } else {
            panel.classList.remove('active');
            officeView.style.display = 'block';
        }
    },
    
    selectCamera(index) {
        if (!this.cameraOpen) return;
        this.currentCamera = index;
        this.updateCamera();
        
        // подсвечиваем выбранную камеру на карте
        document.querySelectorAll('.cam-button').forEach((btn) => {
            const cam = parseInt(btn.getAttribute('data-cam'));
            if (cam === index) {
                btn.setAttribute('fill', 'rgba(0, 255, 0, 0.3)');
            } else {
                btn.setAttribute('fill', 'transparent');
            }
        });
    },
    
    updateCamera() {
        if (!this.cameraOpen) return;
        
        const camName = document.getElementById('currentCamName');
        const kondratDiv = document.getElementById('kondratOnCamera');
        const cam = this.cameraLocations[this.currentCamera];
        
        camName.textContent = `${cam.name} - ${cam.title}`;
        
        // обновляем мини-карту
        this.updateMinimap();
        
        // показываем кондрата если он здесь
        if (this.kondrat.location === this.currentCamera && !this.kondrat.atDoor) {
            kondratDiv.innerHTML = `<img src="kondrat${this.kondrat.phase}.png" alt="">`;
            kondratDiv.style.display = 'block';
        } else {
            kondratDiv.style.display = 'none';
        }
    },
    
    updateMinimap() {
        // подсвечиваем текущую камеру на мини-карте
        for (let i = 0; i < 11; i++) {
            const miniCam = document.getElementById(`miniCam${i}`);
            if (miniCam) {
                if (i === this.currentCamera) {
                    miniCam.setAttribute('fill', 'rgba(0, 255, 0, 0.3)');
                    miniCam.setAttribute('stroke-width', '2');
                } else if (i === this.kondrat.location && !this.kondrat.atDoor) {
                    // красная подсветка где находится кондрат
                    miniCam.setAttribute('fill', 'rgba(255, 0, 0, 0.4)');
                    miniCam.setAttribute('stroke-width', '2');
                } else if ((i === 6 || i === 7) && this.kondrat.location === i) {
                    // угловые камеры 4A и 4B - красная тревога
                    miniCam.setAttribute('fill', 'rgba(255, 0, 0, 0.6)');
                    miniCam.setAttribute('stroke-width', '3');
                } else {
                    miniCam.setAttribute('fill', '#0a0a0a');
                    miniCam.setAttribute('stroke-width', '1.5');
                }
            }
        }
        
        // показываем точку Кондрата на карте
        const kondratDot = document.getElementById('kondratDot');
        if (kondratDot && !this.kondrat.atDoor) {
            // координаты центров комнат на расширенной мини-карте
            const positions = [
                { x: 100, y: 25 },  // CAM 1A (Show Stage)
                { x: 45, y: 72 },   // CAM 1B (Dining)
                { x: 155, y: 72 },  // CAM 1C (Pirate Cove)
                { x: 32, y: 114 },  // CAM 2A (West Hall)
                { x: 167, y: 114 }, // CAM 2B (East Hall)
                { x: 100, y: 90 },  // CAM 3 (Kitchen)
                { x: 20, y: 140 },  // CAM 4A (West Hall Corner)
                { x: 180, y: 140 }, // CAM 4B (East Hall Corner)
                { x: 100, y: 45 },  // CAM 5 (Backstage)
                { x: 65, y: 50 },   // CAM 6 (Restrooms)
                { x: 135, y: 50 }   // CAM 7 (Supply Closet)
            ];
            
            const pos = positions[this.kondrat.location];
            if (pos) {
                kondratDot.setAttribute('cx', pos.x);
                kondratDot.setAttribute('cy', pos.y);
                kondratDot.style.display = 'block';
            }
        } else if (kondratDot) {
            kondratDot.style.display = 'none';
        }
    },
    
    // привлечение кондрата звуком на камеру
    lureKondrat(cameraIndex) {
        if (!this.gameActive || !this.cameraOpen) return;
        if (this.kondrat.atDoor) return; // не работает если у двери
        
        // проверяем кулдаун
        if (this.lureCooldown > 0) {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.textContent = `КУЛДАУН: ${this.lureCooldown}с`;
            feedbackDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 0, 0, 0.9);
                color: #fff;
                padding: 20px 40px;
                font-size: 24px;
                font-weight: bold;
                border-radius: 10px;
                z-index: 9999;
            `;
            document.body.appendChild(feedbackDiv);
            setTimeout(() => feedbackDiv.remove(), 1000);
            return;
        }
        
        // устанавливаем кулдаун 10 секунд
        this.lureCooldown = 10;
        
        // воспроизводим звук
        this.sounds.lure.currentTime = 0;
        this.sounds.lure.play().catch(() => {});
        
        // кондрат идет на эту камеру
        this.kondrat.luredTo = cameraIndex;
        
        // визуальная обратная связь
        const feedbackDiv = document.createElement('div');
        feedbackDiv.textContent = 'ЗВУК АКТИВИРОВАН!';
        feedbackDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.9);
            color: #000;
            padding: 20px 40px;
            font-size: 24px;
            font-weight: bold;
            border-radius: 10px;
            z-index: 9999;
            animation: fadeOut 1s forwards;
        `;
        document.body.appendChild(feedbackDiv);
        
        setTimeout(() => {
            feedbackDiv.remove();
        }, 1000);
    },
    
    // отрисовка офиса (визуальная)
    renderOffice() {
        if (this.gameMode === 'fnaf1') {
            this.renderOfficeFNAF1();
        } else {
            this.renderOfficeFNAF2();
        }
        
        // показываем статические помехи если кондрат в углах коридора (CAM 4A или 4B)
        const staticWarning = document.getElementById('staticWarning');
        if (staticWarning) {
            if (this.kondrat.location === 6 || this.kondrat.location === 7) {
                // кондрат в угловых камерах - показываем статику
                staticWarning.style.display = 'block';
            } else {
                staticWarning.style.display = 'none';
            }
        }
    },
    
    renderOfficeFNAF1() {
        const leftDoorClosed = document.getElementById('leftDoorClosed');
        const rightDoorClosed = document.getElementById('rightDoorClosed');
        const leftLight = document.getElementById('leftLight');
        const rightLight = document.getElementById('rightLight');
        const kondratLeft = document.getElementById('kondratLeftDoor');
        const kondratRight = document.getElementById('kondratRightDoor');
        
        // двери
        if (leftDoorClosed) leftDoorClosed.style.display = this.doors.left ? 'block' : 'none';
        if (rightDoorClosed) rightDoorClosed.style.display = this.doors.right ? 'block' : 'none';
        
        // подсветка и кондрат
        if (leftLight) leftLight.style.display = this.lights.left ? 'block' : 'none';
        if (rightLight) rightLight.style.display = this.lights.right ? 'block' : 'none';
        
        // показываем кондрата у дверей
        if (kondratLeft) {
            if (this.lights.left && this.kondrat.atDoor === 'left' && !this.doors.left) {
                kondratLeft.style.backgroundImage = `url('kondrat${this.kondrat.phase}.png')`;
                kondratLeft.style.display = 'block';
            } else {
                kondratLeft.style.display = 'none';
            }
        }
        
        if (kondratRight) {
            if (this.lights.right && this.kondrat.atDoor === 'right' && !this.doors.right) {
                kondratRight.style.backgroundImage = `url('kondrat${this.kondrat.phase}.png')`;
                kondratRight.style.display = 'block';
            } else {
                kondratRight.style.display = 'none';
            }
        }
        
        // обновляем кнопки
        const leftBtn = document.getElementById('leftDoorBtn');
        const rightBtn = document.getElementById('rightDoorBtn');
        if (leftBtn) leftBtn.classList.toggle('active', this.doors.left);
        if (rightBtn) rightBtn.classList.toggle('active', this.doors.right);
        
        const leftLightBtn = document.getElementById('leftLightBtn');
        const rightLightBtn = document.getElementById('rightLightBtn');
        if (leftLightBtn) leftLightBtn.classList.toggle('active', this.lights.left);
        if (rightLightBtn) rightLightBtn.classList.toggle('active', this.lights.right);
    },
    
    renderOfficeFNAF2() {
        const leftFlashlight = document.getElementById('leftFlashlight');
        const rightFlashlight = document.getElementById('rightFlashlight');
        const ventFlashlight = document.getElementById('ventFlashlight');
        const kondratLeft = document.getElementById('kondratLeftDoor');
        const kondratRight = document.getElementById('kondratRightDoor');
        const kondratVent = document.getElementById('kondratVent');
        
        // фонарик
        if (leftFlashlight) leftFlashlight.style.display = this.flashlight.left ? 'block' : 'none';
        if (rightFlashlight) rightFlashlight.style.display = this.flashlight.right ? 'block' : 'none';
        if (ventFlashlight) ventFlashlight.style.display = this.flashlight.vent ? 'block' : 'none';
        
        // показываем кондрата у дверей с фонариком
        if (kondratLeft) {
            if (this.flashlight.left && this.kondrat.atDoor === 'left') {
                kondratLeft.style.backgroundImage = `url('kondrat${this.kondrat.phase}.png')`;
                kondratLeft.style.display = 'block';
            } else {
                kondratLeft.style.display = 'none';
            }
        }
        
        if (kondratRight) {
            if (this.flashlight.right && this.kondrat.atDoor === 'right') {
                kondratRight.style.backgroundImage = `url('kondrat${this.kondrat.phase}.png')`;
                kondratRight.style.display = 'block';
            } else {
                kondratRight.style.display = 'none';
            }
        }
        
        // кондрат в вентиляции
        if (kondratVent) {
            if (this.flashlight.vent && this.kondrat.inVent) {
                kondratVent.style.backgroundImage = `url('kondrat${this.kondrat.phase}.png')`;
                kondratVent.style.display = 'block';
                kondratVent.style.left = this.kondrat.ventLocation === 'left' ? '10%' : 
                                         this.kondrat.ventLocation === 'right' ? '70%' : '45%';
            } else {
                kondratVent.style.display = 'none';
            }
        }
        
        // обновляем кнопки
        const maskBtn = document.getElementById('maskBtn');
        if (maskBtn) maskBtn.classList.toggle('active', this.maskOn);
        
        const leftFlashBtn = document.getElementById('leftFlashBtn');
        const rightFlashBtn = document.getElementById('rightFlashBtn');
        const ventFlashBtn = document.getElementById('ventFlashBtn');
        if (leftFlashBtn) leftFlashBtn.classList.toggle('active', this.flashlight.left);
        if (rightFlashBtn) rightFlashBtn.classList.toggle('active', this.flashlight.right);
        if (ventFlashBtn) ventFlashBtn.classList.toggle('active', this.flashlight.vent);
    },
    
    // обновление интерфейса
    updateUI() {
        // время в стиле fnaf
        const hours = Math.floor(this.gameTime / 60);
        const hour12 = ((hours % 12) || 12);
        const timeEl = document.getElementById('gameTime');
        if (timeEl) timeEl.textContent = `${hour12} AM`;
        
        // энергия
        const powerDisplay = Math.max(0, Math.ceil(this.power));
        const powerEl = document.getElementById('powerPercent');
        const usageEl = document.getElementById('powerUsage');
        if (powerEl) powerEl.textContent = powerDisplay;
        if (usageEl) usageEl.textContent = this.powerUsage;
        
        // музыкальная шкатулка (только FNAF 2)
        if (this.gameMode === 'fnaf2') {
            const musicBoxEl = document.getElementById('musicBoxLevel');
            if (musicBoxEl) {
                const musicLevel = Math.max(0, Math.ceil(this.musicBox));
                musicBoxEl.style.width = `${musicLevel}%`;
                musicBoxEl.style.background = musicLevel < 20 ? '#f00' : 
                                              musicLevel < 50 ? '#ff0' : '#0f0';
            }
        }
        
        // показываем/скрываем элементы UI в зависимости от режима
        this.updateModeUI();
    },
    
    updateModeUI() {
        console.log('updateModeUI вызвана, режим:', this.gameMode);
        const fnaf1Controls = document.querySelectorAll('.fnaf1-only');
        const fnaf2Controls = document.querySelectorAll('.fnaf2-only');
        console.log('FNAF1 элементов:', fnaf1Controls.length, 'FNAF2 элементов:', fnaf2Controls.length);
        
        fnaf1Controls.forEach(el => {
            if (this.gameMode === 'fnaf1') {
                el.style.display = '';
                el.style.removeProperty('display');
            } else {
                el.style.display = 'none';
            }
        });
        
        fnaf2Controls.forEach(el => {
            if (this.gameMode === 'fnaf2') {
                el.style.display = '';
                el.style.removeProperty('display');
            } else {
                el.style.display = 'none';
            }
        });
    },
    
    // окончания игры
    win() {
        this.gameActive = false;
        this.stopTimers();
        
        // награда монетами (зависит от ночи)
        const coinReward = this.currentNight * 10;
        
        // сохраняем прогресс
        const userData = JSON.parse(localStorage.getItem('fnac_user_' + this.currentUser));
        
        // миграция старых данных
        if (!userData.progress) {
            userData.progress = {
                fnaf1: { maxNight: 1, completed: [] },
                fnaf2: { maxNight: 1, completed: [] }
            };
        }
        
        const modeProgress = userData.progress[this.gameMode];
        
        // даем монеты только за первое прохождение
        if (!modeProgress.completed.includes(this.currentNight)) {
            modeProgress.completed.push(this.currentNight);
            userData.coins = (userData.coins || 0) + coinReward;
            this.coins = userData.coins;
        }
        
        // открываем следующую ночь
        if (this.currentNight === modeProgress.maxNight && modeProgress.maxNight < 5) {
            modeProgress.maxNight++;
        }
        
        localStorage.setItem('fnac_user_' + this.currentUser, JSON.stringify(userData));
        
        // показываем экран победы
        document.getElementById('completedNight').textContent = this.currentNight;
        document.getElementById('winMessage').innerHTML = `
            Ты выжил ночь ${this.currentNight}!<br>
            <span style="color: #ff0; font-size: 20px;">+${coinReward} 🪙</span>
        `;
        this.hideAllScreens();
        document.getElementById('winScreen').classList.add('active');
    },
    
    lose() {
        this.gameActive = false;
        this.stopTimers();
        
        // джампскер
        const jumpscare = document.getElementById('jumpscare');
        const img = document.getElementById('jumpscareImg');
        const sound = document.getElementById('jumpscareSound');
        
        img.src = `kondrat${this.kondrat.phase}.png`;
        
        // звук джампскера
        sound.currentTime = 0;
        sound.play().catch(() => {});
        
        this.hideAllScreens();
        document.getElementById('loseScreen').classList.add('active');
        jumpscare.classList.add('active');
        
        setTimeout(() => {
            jumpscare.classList.remove('active');
        }, 2000);
        
        document.getElementById('failedNight').textContent = this.currentNight;
    },
    
    powerOutage() {
        // отключение энергии как в fnaf
        document.getElementById('officeView').style.filter = 'brightness(0.1)';
        
        // кондрат придет через случайное время
        const attackDelay = 5000 + Math.random() * 10000; // 5-15 секунд
        setTimeout(() => {
            if (this.gameActive) {
                this.lose();
            }
        }, attackDelay);
    },
    
    playSound(type) {
        // простая система звуков через Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // разные звуки для разных событий
            switch(type) {
                case 'footsteps':
                    // низкий звук шагов
                    oscillator.frequency.value = 100;
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                    break;
                    
                case 'door':
                    // механический звук двери
                    oscillator.frequency.value = 150;
                    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.6);
                    break;
                    
                case 'light':
                    // электрический звук света
                    oscillator.frequency.value = 800;
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;
            }
        } catch(e) {
            // если не поддерживается, просто игнорируем
            console.log('Звук не поддерживается:', e);
        }
    },
    
    backToMenu() {
        this.stopTimers();
        this.showMenu();
    },
    
    stopTimers() {
        if (this.gameTimer) clearInterval(this.gameTimer);
        if (this.powerTimer) clearInterval(this.powerTimer);
        if (this.aiTimer) clearTimeout(this.aiTimer);
        if (this.musicBoxTimer) clearInterval(this.musicBoxTimer);
    },
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
};

// запускаем игру при загрузке страницы
window.addEventListener('load', () => {
    console.log('Страница загружена, запускаем game.init()');
    game.init();
});

// проверяем что объект game доступен глобально
console.log('game.js загружен, объект game создан');
