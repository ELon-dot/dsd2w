// Mock Telegram Web App for local testing
const tg = {
    showPopup: (options, callback) => {
        alert(options.message);
        callback(options.buttons[0].id);
    },
    showAlert: (message, success = true) => showNotification(message, success),
    close: () => console.log("App closed"),
    initDataUnsafe: {
        user: {
            id: 123456789,
            username: "testuser",
            first_name: "Test"
        },
        start_param: null
    },
    openTelegramLink: (url) => console.log("Opening Telegram link:", url),
    openLink: (url) => console.log("Opening link:", url)
};

const userId = tg.initDataUnsafe.user.id;
const username = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name;

// State (stored in localStorage)
let userData = JSON.parse(localStorage.getItem('userData')) || {
    userId: userId,
    username: username,
    agreed: false,
    invested: 0,
    profit: 0,
    firstInvestmentDate: null,
    referrals: [],
    investments: []
};

let settings = JSON.parse(localStorage.getItem('settings')) || {
    dailyProfitPercentage: 2.0,
    minInvestment: 25,
    investmentOptions: [25, 50, 100, 250, 500, 1000]
};

let topUsers = JSON.parse(localStorage.getItem('topUsers')) || [
    { userId: "fake1", username: "FakeUser1", invested: 1000, profit: 200 },
    { userId: "fake2", username: "FakeUser2", invested: 500, profit: 100 },
    { userId: "fake3", username: "FakeUser3", invested: 250, profit: 50 }
];

// Save state to localStorage
function saveState() {
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('settings', JSON.stringify(settings));
    localStorage.setItem('topUsers', JSON.stringify(topUsers));
}

// Show Notification
function showNotification(message, success = true) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    if (notification && notificationText) {
        notificationText.innerText = message;
        notification.className = 'notification';
        if (success) {
            notification.classList.add('success');
        } else {
            notification.classList.add('error');
        }
        notification.style.display = 'flex';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    } else {
        console.error("Notification elements not found");
    }
}

// Close all modals on initialization
function closeAllModals() {
    console.log("Closing all modals on initialization");
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    const notification = document.getElementById('notification');
    if (notification) {
        notification.style.display = 'none';
    }
}

// Open a modal
function openModal(modalId) {
    console.log(`Opening modal: ${modalId}`);
    closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    } else {
        console.error(`Modal ${modalId} not found`);
    }
}

// Close a modal
function closeModal(modalId) {
    console.log(`Closing modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    } else {
        console.error(`Modal ${modalId} not found`);
    }
}

// Initialize User
function initUser() {
    console.log("Initializing user");
    if (!userData.agreed) {
        tg.showPopup({
            title: 'Пользовательское соглашение',
            message: 'Ознакомьтесь с условиями: https://telegra.ph/Polzovatelskoe-soglashenie-04-17-5\nНажмите "Принять", чтобы начать.',
            buttons: [{ id: 'agree', type: 'ok', text: 'Принять' }]
        }, (buttonId) => {
            if (buttonId === 'agree') {
                userData.agreed = true;
                saveState();
                tg.showAlert('Добро пожаловать!');
                loadHome();
            } else {
                tg.close();
            }
        });
    } else {
        loadHome();
    }
}

// Toggle History
function toggleHistory(listId, toggleId) {
    const historyList = document.getElementById(listId);
    const toggleBtn = document.getElementById(toggleId);
    if (historyList && toggleBtn) {
        if (historyList.classList.contains('expanded')) {
            historyList.classList.remove('expanded');
            toggleBtn.innerText = 'Показать больше';
        } else {
            historyList.classList.add('expanded');
            toggleBtn.innerText = 'Свернуть';
        }
    }
}

// Load Home
function loadHome() {
    console.log("Loading home tab");
    if (!userData.agreed) return;
    // Load balance on home
    const invested = document.getElementById('balance-invested');
    const profit = document.getElementById('balance-profit');
    const total = document.getElementById('balance-total');
    if (invested && profit && total) {
        invested.innerText = `Инвестировано: ${userData.invested}`;
        profit.innerText = `Прибыль: ${userData.profit.toFixed(2)}`;
        total.innerText = `${(userData.invested + userData.profit).toFixed(2)}`;
    }
    // Load history on home
    const historyList = document.getElementById('history-list');
    const toggleBtn = document.getElementById('toggle-history-home');
    if (historyList && toggleBtn) {
        historyList.innerHTML = '';
        if (!userData.investments || userData.investments.length === 0) {
            historyList.innerHTML = '<p>У тебя пока нет инвестиций.</p>';
            toggleBtn.style.display = 'none';
        } else {
            userData.investments.slice(-10).forEach((inv, index) => {
                const date = new Date(inv.date).toLocaleString();
                historyList.innerHTML += `<p>${index + 1}. ${inv.amount} — ${date}</p>`;
            });
            toggleBtn.style.display = userData.investments.length > 5 ? 'block' : 'none';
        }
    }
}

// Load Balance
function loadBalance() {
    console.log("Loading balance tab");
    const investedTab = document.getElementById('balance-invested-tab');
    const profitTab = document.getElementById('balance-profit-tab');
    const totalTab = document.getElementById('balance-total-tab');
    if (investedTab && profitTab && totalTab) {
        investedTab.innerText = `Инвестировано: ${userData.invested}`;
        profitTab.innerText = `Прибыль: ${userData.profit.toFixed(2)}`;
        totalTab.innerText = `Общий: ${(userData.invested + userData.profit).toFixed(2)}`;
    } else {
        console.error("Balance tab elements not found");
    }
}

// Load Stats
function loadStats() {
    console.log("Loading stats tab");
    const referrals = userData.referrals || [];
    const referralCount = referrals.length;
    let referralBonus = referrals.reduce((sum, ref) => sum + (ref.invested * 0.1), 0);
    let daysPassed = 0;
    if (userData.firstInvestmentDate) {
        const firstDate = new Date(userData.firstInvestmentDate);
        daysPassed = Math.floor((new Date() - firstDate) / (1000 * 60 * 60 * 24));
    }
    const statsInvested = document.getElementById('stats-invested');
    const statsDays = document.getElementById('stats-days');
    const statsProfit = document.getElementById('stats-profit');
    const statsReferrals = document.getElementById('stats-referrals');
    const statsBonus = document.getElementById('stats-bonus');
    if (statsInvested && statsDays && statsProfit && statsReferrals && statsBonus) {
        statsInvested.innerText = `Инвестировано: ${userData.invested}`;
        statsDays.innerText = `Дней: ${daysPassed}/30`;
        statsProfit.innerText = `Прибыль: ${userData.profit.toFixed(2)}`;
        statsReferrals.innerText = `Рефералов: ${referralCount}`;
        statsBonus.innerText = `Бонус: ${referralBonus.toFixed(2)}`;
    }
}

// Load History
function loadHistory() {
    console.log("Loading history tab");
    const historyList = document.getElementById('history-list-tab');
    const toggleBtn = document.getElementById('toggle-history-tab');
    if (historyList && toggleBtn) {
        historyList.innerHTML = '';
        if (!userData.investments || userData.investments.length === 0) {
            historyList.innerHTML = '<p>У тебя пока нет инвестиций.</p>';
            toggleBtn.style.display = 'none';
        } else {
            userData.investments.slice(-10).forEach((inv, index) => {
                const date = new Date(inv.date).toLocaleString();
                historyList.innerHTML += `<p>${index + 1}. ${inv.amount} — ${date}</p>`;
            });
            toggleBtn.style.display = userData.investments.length > 5 ? 'block' : 'none';
        }
    }
}

// Load Referrals
function loadReferrals() {
    console.log("Loading referrals tab");
    const referrals = userData.referrals || [];
    const referralCount = referrals.length;
    const referralBonus = referrals.reduce((sum, ref) => sum + (ref.invested * 0.1), 0);
    const referralLink = `https://example.com/start=${userId}`;
    const referralLinkElement = document.getElementById('referral-link');
    const referralCountElement = document.getElementById('referral-count');
    const referralBonusElement = document.getElementById('referral-bonus');
    if (referralLinkElement && referralCountElement && referralBonusElement) {
        referralLinkElement.innerHTML = `Твоя ссылка: <code>${referralLink}</code>`;
        referralCountElement.innerText = `Рефералов: ${referralCount}`;
        referralBonusElement.innerText = `Бонус: ${referralBonus.toFixed(2)}`;
    }
}

// Load Top
function loadTop() {
    console.log("Loading top tab");
    const allUsers = [...topUsers, userData].filter(u => u.invested > 0);
    const totalInvestors = allUsers.length;
    const totalInvested = allUsers.reduce((sum, u) => sum + u.invested, 0);
    const totalProfit = allUsers.reduce((sum, u) => sum + u.profit, 0);
    const sortedUsers = allUsers.sort((a, b) => b.invested - a.invested).slice(0, 3);
    const topBalanceTotal = document.getElementById('top-balance-total');
    const topInvestors = document.getElementById('top-investors');
    const topInvested = document.getElementById('top-invested');
    const topProfit = document.getElementById('top-profit');
    const topList = document.getElementById('top-list');
    const toggleBtn = document.getElementById('toggle-top-list');
    if (topBalanceTotal && topInvestors && topInvested && topProfit && topList && toggleBtn) {
        topBalanceTotal.innerText = `${(userData.invested + userData.profit).toFixed(2)}`;
        topInvestors.innerText = `Всего: ${totalInvestors}`;
        topInvested.innerText = `Инвестировано: ${totalInvested}`;
        topProfit.innerText = `Заработано: ${totalProfit.toFixed(2)}`;
        topList.innerHTML = '';
        sortedUsers.forEach((user, index) => {
            topList.innerHTML += `<p>${index + 1}. ${user.username}: ${user.invested}, Прибыль ${user.profit.toFixed(2)}</p>`;
        });
        toggleBtn.style.display = sortedUsers.length > 5 ? 'block' : 'none';
    }
}

// Load Admin
function loadAdmin() {
    console.log("Loading admin tab");
    const currentProfit = document.getElementById('current-profit');
    const currentStats = document.getElementById('current-stats');
    const currentButtons = document.getElementById('current-buttons');
    const removeButtonsList = document.getElementById('remove-buttons-list');
    const currentMinInvest = document.getElementById('current-min-invest');
    if (currentProfit && currentStats && currentButtons && removeButtonsList && currentMinInvest) {
        currentProfit.innerText = `Текущий процент: ${settings.dailyProfitPercentage}%`;
        const allUsers = [...topUsers, userData].filter(u => u.invested > 0);
        const totalInvestors = allUsers.length;
        const totalInvested = allUsers.reduce((sum, u) => sum + u.invested, 0);
        const totalProfit = allUsers.reduce((sum, u) => sum + u.profit, 0);
        currentStats.innerText = `Инвесторов: ${totalInvestors}, Инвестировано: ${totalInvested}, Прибыль: ${totalProfit.toFixed(2)}`;
        currentButtons.innerText = `Текущие суммы: ${settings.investmentOptions.join(', ')}`;
        removeButtonsList.innerText = `Текущие суммы: ${settings.investmentOptions.join(', ')}`;
        currentMinInvest.innerText = `Текущая сумма: ${settings.minInvestment}`;
    }
}

// Add background stars
function addStars() {
    const numStars = 50;
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 2}s`;
        document.body.appendChild(star);
    }
}

// Run after DOM is loaded
window.onload = () => {
    console.log("DOM loaded, starting initialization");

    // Add stars
    addStars();

    // Close all modals to ensure none are open
    closeAllModals();

    // Notification close
    const closeNotification = document.getElementById('close-notification');
    if (closeNotification) {
        closeNotification.onclick = (event) => {
            event.preventDefault();
            const notification = document.getElementById('notification');
            if (notification) {
                notification.style.display = 'none';
            }
        };
    }

    // Bottom Navigation
    const tabs = document.querySelectorAll('.navbar-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            event.preventDefault();
            console.log(`Tab ${tab.getAttribute('data-tab')} clicked`);
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            const tabId = tab.getAttribute('data-tab');
            const content = document.getElementById(tabId);
            if (content) {
                content.classList.add('active');
                if (tabId === 'home') loadHome();
                else if (tabId === 'balance') loadBalance();
                else if (tabId === 'stats') loadStats();
                else if (tabId === 'history') loadHistory();
                else if (tabId === 'referrals') loadReferrals();
                else if (tabId === 'top') loadTop();
                else if (tabId === 'admin') loadAdmin();
            }
        });
    });

    // Toggle History Event Listeners
    const toggleHistoryHome = document.getElementById('toggle-history-home');
    if (toggleHistoryHome) {
        toggleHistoryHome.onclick = (event) => {
            event.preventDefault();
            toggleHistory('history-list', 'toggle-history-home');
        };
    }

    const toggleHistoryTab = document.getElementById('toggle-history-tab');
    if (toggleHistoryTab) {
        toggleHistoryTab.onclick = (event) => {
            event.preventDefault();
            toggleHistory('history-list-tab', 'toggle-history-tab');
        };
    }

    const toggleTopList = document.getElementById('toggle-top-list');
    if (toggleTopList) {
        toggleTopList.onclick = (event) => {
            event.preventDefault();
            toggleHistory('top-list', 'toggle-top-list');
        };
    }

    // Event Handlers
    const shareReferral = document.getElementById('share-referral');
    if (shareReferral) {
        shareReferral.onclick = (event) => {
            event.preventDefault();
            console.log("Share referral clicked");
            const referralLink = `https://example.com/start=${userId}`;
            tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Инвестируй и получай прибыль с Инвестор Stars!`);
        };
    }

    const investBtn = document.getElementById('invest-btn');
    if (investBtn) {
        investBtn.onclick = (event) => {
            event.preventDefault();
            console.log("Invest button clicked");
            if (!userData.agreed) return;
            const minInvestText = document.getElementById('min-invest-text');
            if (minInvestText) {
                minInvestText.innerText = `Минимальная сумма: ${settings.minInvestment}`;
            }
            const optionsDiv = document.getElementById('invest-options');
            if (optionsDiv) {
                optionsDiv.innerHTML = '';
                settings.investmentOptions.forEach(amount => {
                    const btn = document.createElement('button');
                    btn.className = 'bg-accent py-2 button';
                    btn.innerText = `${amount}`;
                    btn.onclick = (event) => {
                        event.preventDefault();
                        console.log(`Investing ${amount}`);
                        invest(amount);
                    };
                    optionsDiv.appendChild(btn);
                });
            }
            openModal('invest-modal');
        };
    }

    const closeInvestModal = document.getElementById('close-invest-modal');
    if (closeInvestModal) {
        closeInvestModal.onclick = (event) => {
            event.preventDefault();
            console.log("Close invest modal clicked");
            closeModal('invest-modal');
        };
    }

    function invest(amount) {
        console.log(`Processing investment of ${amount}`);
        if (amount < settings.minInvestment) {
            tg.showAlert(`Сумма ${amount} меньше минимальной (${settings.minInvestment}).`, false);
            return;
        }
        const newInvested = userData.invested + amount;
        if (!userData.firstInvestmentDate) {
            userData.firstInvestmentDate = new Date().toISOString();
        }
        userData.invested = newInvested;
        userData.investments.push({ amount: amount, date: new Date().toISOString() });
        saveState();
        tg.showAlert(`Инвестиция на ${amount} принята!`);
        closeModal('invest-modal');
        const allUsers = [...topUsers, userData].filter(u => u.invested > 0);
        const sortedUsers = allUsers.sort((a, b) => b.invested - a.invested);
        const topIds = sortedUsers.slice(0, 3).map(u => u.userId);
        if (topIds.includes(userId)) {
            tg.showAlert('Поздравляем! Ты вошёл в топ-3 инвесторов!');
        }
        loadHome(); // Refresh home to update balance and history
    }

    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.onclick = (event) => {
            event.preventDefault();
            console.log("Withdraw button clicked");
            if (!userData.agreed) return;
            const withdrawText = document.getElementById('withdraw-text');
            const confirmBtn = document.getElementById('confirm-withdraw');
            if (withdrawText && confirmBtn) {
                if (userData.invested === 0) {
                    withdrawText.innerText = 'У тебя нет инвестиций.';
                    confirmBtn.style.display = 'none';
                } else {
                    withdrawText.innerText = 'Запрос будет обработан в течение 30 дней.';
                    confirmBtn.style.display = 'block';
                }
            }
            openModal('withdraw-modal');
        };
    }

    const confirmWithdraw = document.getElementById('confirm-withdraw');
    if (confirmWithdraw) {
        confirmWithdraw.onclick = (event) => {
            event.preventDefault();
            console.log("Confirm withdraw clicked");
            tg.showAlert('Запрос на вывод принят!');
            closeModal('withdraw-modal');
        };
    }

    const closeWithdrawModal = document.getElementById('close-withdraw-modal');
    if (closeWithdrawModal) {
        closeWithdrawModal.onclick = (event) => {
            event.preventDefault();
            console.log("Close withdraw modal clicked");
            closeModal('withdraw-modal');
        };
    }

    const adminProfitBtn = document.getElementById('admin-profit-btn');
    if (adminProfitBtn) {
        adminProfitBtn.onclick = (event) => {
            event.preventDefault();
            console.log("Admin profit button clicked");
            openModal('admin-profit-modal');
        };
    }

    const saveProfit = document.getElementById('save-profit');
    if (saveProfit) {
        saveProfit.onclick = (event) => {
            event.preventDefault();
            console.log("Save profit clicked");
            const newProfitInput = document.getElementById('new-profit');
            if (newProfitInput) {
                const newProfit = parseFloat(newProfitInput.value);
                if (isNaN(newProfit) || newProfit <= 0) {
                    tg.showAlert('Введите корректный процент.', false);
                    return;
                }
                settings.dailyProfitPercentage = newProfit;
                saveState();
                tg.showAlert(`Процент изменён на ${newProfit}%.`);
                closeModal('admin-profit-modal');
                loadAdmin();
            }
        };
    }

    const closeProfitModal = document.getElementById('close-profit-modal');
    if (closeProfitModal) {
        closeProfitModal.onclick = (event) => {
            event.preventDefault();
            console.log("Close profit modal clicked");
            closeModal('admin-profit-modal');
        };
    }

    const adminStatsBtn = document.getElementById('admin-stats-btn');
    if (adminStatsBtn) {
        adminStatsBtn.onclick = (event) => {
            event.preventDefault();
            console.log("Admin stats button clicked");
            openModal('admin-stats-modal');
        };
    }

    const saveStats = document.getElementById('save-stats');
    if (saveStats) {
        saveStats.onclick = (event) => {
            event.preventDefault();
            console.log("Save stats clicked");
            const newStatsInput = document.getElementById('new-stats');
            if (newStatsInput) {
                const input = newStatsInput.value;
                const [investors, invested, profit] = input.split(',').map(parseFloat);
                if (isNaN(investors) || isNaN(invested) || isNaN(profit)) {
                    tg.showAlert('Введите: инвесторы,инвестировано,прибыль.', false);
                    return;
                }
                const allUsers = [...topUsers, userData].filter(u => u.invested > 0);
                let currentInvestors = allUsers.length;
                let currentInvested = allUsers.reduce((sum, u) => sum + u.invested, 0);
                let currentProfit = allUsers.reduce((sum, u) => sum + u.profit, 0);

                const deltaInvestors = Math.round(investors - currentInvestors);
                const deltaInvested = invested - currentInvested;
                const deltaProfit = profit - currentProfit;

                if (deltaInvestors > 0) {
                    for (let i = 0; i < deltaInvestors; i++) {
                        topUsers.push({
                            userId: `fake_${Date.now()}_${i}`,
                            username: `FakeUser${i}`,
                            invested: 0,
                            profit: 0
                        });
                    }
                } else if (deltaInvestors < 0) {
                    topUsers.splice(0, -deltaInvestors);
                }

                if (deltaInvested !== 0 || deltaProfit !== 0) {
                    userData.invested = Math.max(0, userData.invested + deltaInvested);
                    userData.profit = Math.max(0, userData.profit + deltaProfit);
                }

                saveState();
                tg.showAlert('Статистика обновлена!');
                closeModal('admin-stats-modal');
                loadAdmin();
            }
        };
    }

    const closeStatsModal = document.getElementById('close-stats-modal');
    if (closeStatsModal) {
        closeStatsModal.onclick = (event) => {
            event.preventDefault();
            console.log("Close stats modal clicked");
            closeModal('admin-stats-modal');
        };
    }

    const adminButtonsBtn = document.getElementById('admin-buttons-btn');
    if (adminButtonsBtn) {
        adminButtonsBtn.onclick = (event) => {
            event.preventDefault();
            console.log("Admin buttons button clicked");
            openModal('admin-buttons-modal');
        };
    }

    const addButton = document.getElementById('add-button');
    if (addButton) {
        addButton.onclick = (event) => {
            event.preventDefault();
            console.log("Add button clicked");
            closeModal('admin-buttons-modal');
            openModal('admin-add-button-modal');
        };
    }

    const removeButton = document.getElementById('remove-button');
    if (removeButton) {
        removeButton.onclick = (event) => {
            event.preventDefault();
            console.log("Remove button clicked");
            closeModal('admin-buttons-modal');
            openModal('admin-remove-button-modal');
        };
    }

    const closeButtonsModal = document.getElementById('close-buttons-modal');
    if (closeButtonsModal) {
        closeButtonsModal.onclick = (event) => {
            event.preventDefault();
            console.log("Close buttons modal clicked");
            closeModal('admin-buttons-modal');
        };
    }

    const saveNewButton = document.getElementById('save-new-button');
    if (saveNewButton) {
        saveNewButton.onclick = (event) => {
            event.preventDefault();
            console.log("Save new button clicked");
            const newButtonInput = document.getElementById('new-button');
            if (newButtonInput) {
                const newAmount = parseInt(newButtonInput.value);
                if (isNaN(newAmount) || newAmount <= 0) {
                    tg.showAlert('Введите корректную сумму.', false);
                    return;
                }
                if (settings.investmentOptions.includes(newAmount)) {
                    tg.showAlert('Эта сумма уже существует.', false);
                    return;
                }
                settings.investmentOptions.push(newAmount);
                settings.investmentOptions.sort((a, b) => a - b);
                saveState();
                tg.showAlert(`Сумма ${newAmount} добавлена.`);
                closeModal('admin-add-button-modal');
                loadAdmin();
            }
        };
    }

    const closeAddButtonModal = document.getElementById('close-add-button-modal');
    if (closeAddButtonModal) {
        closeAddButtonModal.onclick = (event) => {
            event.preventDefault();
            console.log("Close add button modal clicked");
            closeModal('admin-add-button-modal');
        };
    }

    const saveRemoveButton = document.getElementById('save-remove-button');
    if (saveRemoveButton) {
        saveRemoveButton.onclick = (event) => {
            event.preventDefault();
            console.log("Save remove button clicked");
            const removeButtonInput = document.getElementById('remove-button-input');
            if (removeButtonInput) {
                const amount = parseInt(removeButtonInput.value);
                if (!settings.investmentOptions.includes(amount)) {
                    tg.showAlert('Этой суммы нет в списке.', false);
                    return;
                }
                settings.investmentOptions = settings.investmentOptions.filter(a => a !== amount);
                saveState();
                tg.showAlert(`Сумма ${amount} удалена.`);
                closeModal('admin-remove-button-modal');
                loadAdmin();
            }
        };
    }

    const closeRemoveButtonModal = document.getElementById('close-remove-button-modal');
    if (closeRemoveButtonModal) {
        closeRemoveButtonModal.onclick = (event) => {
            event.preventDefault();
            console.log("Close remove button modal clicked");
            closeModal('admin-remove-button-modal');
        };
    }

    const adminMinInvestBtn = document.getElementById('admin-min-invest-btn');
    if (adminMinInvestBtn) {
        adminMinInvestBtn.onclick = (event) => {
            event.preventDefault();
            console.log("Admin min invest button clicked");
            openModal('admin-min-invest-modal');
        };
    }

    const saveMinInvest = document.getElementById('save-min-invest');
    if (saveMinInvest) {
        saveMinInvest.onclick = (event) => {
            event.preventDefault();
            console.log("Save min invest clicked");
            const newMinInvestInput = document.getElementById('new-min-invest');
            if (newMinInvestInput) {
                const newMin = parseInt(newMinInvestInput.value);
                if (isNaN(newMin) || newMin <= 0) {
                    tg.showAlert('Введите корректную сумму.', false);
                    return;
                }
                settings.minInvestment = newMin;
                saveState();
                tg.showAlert(`Минимальная сумма: ${newMin}.`);
                closeModal('admin-min-invest-modal');
                loadAdmin();
            }
        };
    }

    const closeMinInvestModal = document.getElementById('close-min-invest-modal');
    if (closeMinInvestModal) {
        closeMinInvestModal.onclick = (event) => {
            event.preventDefault();
            console.log("Close min invest modal clicked");
            closeModal('admin-min-invest-modal');
        };
    }

    // Initialize
    initUser();
    const homeTab = document.querySelector('.navbar-btn[data-tab="home"]');
    if (homeTab) {
        homeTab.click();
    }
};