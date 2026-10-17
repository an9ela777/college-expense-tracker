// 1. 頁面切換 (SPA) 邏輯
const menuButtons = document.querySelectorAll('.menu-btn');
const pageViews = document.querySelectorAll('.page-view');

menuButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        menuButtons.forEach(b => b.classList.remove('active'));
        pageViews.forEach(p => p.classList.remove('active-page'));

        this.classList.add('active');

        const targetId = this.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active-page');

        // 如果切換到設定頁面，觸發動態渲染
        if (targetId === 'settings-page') {
            renderSettingsPage();
        }
    });
});

// 2. 個人化金庫命名功能
const setNameBtn = document.getElementById('set-name-btn');
const userNameInput = document.getElementById('user-name-input');
const vaultTitle = document.getElementById('vault-title');

// 3. 抓取表單、顯示容器與預算元素
const addBtn = document.getElementById('add-btn');
const expenseDateInput = document.getElementById('expense-date');
const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategorySelect = document.getElementById('expense-category');
const calendarView = document.getElementById('calendar-view');

const setBudgetBtn = document.getElementById('set-budget-btn');
const weeklyBudgetInput = document.getElementById('weekly-budget');
const monthlyBudgetInput = document.getElementById('monthly-budget');

// 4. 從 localStorage 讀取資料與預算設定
let expenses = JSON.parse(localStorage.getItem('my_expenses')) || [];
let budgets = JSON.parse(localStorage.getItem('my_budgets')) || { weekly: 0, monthly: 0 };

// 初始化預算輸入框的值（如果之前有存過）
if (weeklyBudgetInput) weeklyBudgetInput.value = budgets.weekly || '';
if (monthlyBudgetInput) monthlyBudgetInput.value = budgets.monthly || '';

// 5. 監聽「儲存預算設定」按鈕
if (setBudgetBtn) {
    setBudgetBtn.addEventListener('click', function() {
        const weeklyVal = Number(weeklyBudgetInput.value) || 0;
        const monthlyVal = Number(monthlyBudgetInput.value) || 0;

        budgets = {
            weekly: weeklyVal,
            monthly: monthlyVal
        };

        // 存入 localStorage
        localStorage.setItem('my_budgets', JSON.stringify(budgets));
        
        // 重新渲染畫面以更新預算顯示
        renderExpenses();
        
        alert("預算設定已成功儲存！");
    });
}

// 6. 定義一個「渲染畫面與計算總額、超支檢查」的函式
function renderExpenses() {
    if (!calendarView) return;
    calendarView.innerHTML = '';

    const weekLimitInit = budgets.weekly > 0 ? budgets.weekly : '--';
    const monthLimitInit = budgets.monthly > 0 ? budgets.monthly : '--';

    if (expenses.length === 0) {
        calendarView.innerHTML = '<p style="color: #888; text-align: center; margin: 20px 0;">目前還沒有記帳紀錄喔！趕快在右側新增一筆吧～</p>';
        const todayTotalEl = document.getElementById('today-total');
        const weekTotalEl = document.getElementById('week-total');
        const monthTotalEl = document.getElementById('month-total');

        if (todayTotalEl) todayTotalEl.textContent = `$ 0`;
        if (weekTotalEl) weekTotalEl.textContent = `$ 0 / $ ${weekLimitInit}`;
        if (monthTotalEl) monthTotalEl.textContent = `$ 0 / $ ${monthLimitInit}`;
        
        const weekCardCheck = document.getElementById('week-card');
        if (weekCardCheck) weekCardCheck.classList.remove('warning');
        
        const monthCardCheck = document.getElementById('month-card');
        if (monthCardCheck) monthCardCheck.classList.remove('warning');
        return;
    }

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const currentYearMonth = todayStr.slice(0, 7);

    // 計算本週起始日與結束日（本地時間）
    const now = new Date();
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    expenses.forEach(function(item, index) {
        const amountNum = Number(item.amount) || 0;
        const [y, m, d] = item.date.split('-').map(Number);
        const itemDate = new Date(y, m - 1, d);

        if (item.date === todayStr) {
            todayTotal += amountNum;
        }

        if (itemDate >= monday && itemDate <= sunday) {
            weekTotal += amountNum;
        }

        if (item.date.startsWith(currentYearMonth)) {
            monthTotal += amountNum;
        }

        let categoryName = '';
        let badgeColor = '';

        switch(item.category) {
            case 'food':
                categoryName = '吃的喝的';
                badgeColor = '#efd1c5';
                break;
            case 'transport':
                categoryName = '交通';
                badgeColor = '#c6d5e8';
                break;
            case 'entertainment':
                categoryName = '娛樂';
                badgeColor = '#dac6e8';
                break;
            case 'clothes':
                categoryName = '買買買';
                badgeColor = '#efe4b7';
                break;
            default:
                categoryName = '其他';
                badgeColor = '#d4d8dd';
        }

        const newItem = document.createElement('div');
        newItem.classList.add('day-item');
        newItem.style.borderLeft = `4px solid ${badgeColor}`;

        newItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <strong>${item.date}</strong>
                        <span style="background-color: ${badgeColor}; color: #333; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${categoryName}</span>
                    </div>
                    <div style="font-size: 14px; color: #555; margin-top: 5px;">
                        • ${item.name}: $${item.amount}
                    </div>
                </div>
                <button class="delete-btn" data-index="${index}" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">刪除</button>
            </div>
        `;

        calendarView.appendChild(newItem);
    });

    // 更新今日支出
    const todayTotalEl = document.getElementById('today-total');
    if (todayTotalEl) todayTotalEl.textContent = `$ ${todayTotal}`;

    // 更新本週已花費 / 預算與超支檢查
    const weekLimit = budgets.weekly > 0 ? budgets.weekly : '--';
    const weekTotalEl = document.getElementById('week-total');
    if (weekTotalEl) weekTotalEl.textContent = `$ ${weekTotal} / $ ${weekLimit}`;
    
    const weekCard = document.getElementById('week-card');
    if (weekCard) {
        if (budgets.weekly > 0 && weekTotal > budgets.weekly) {
            weekCard.classList.add('warning');
        } else {
            weekCard.classList.remove('warning');
        }
    }

    // 更新本月已花費 / 預算與超支檢查
    const monthLimit = budgets.monthly > 0 ? budgets.monthly : '--';
    const monthTotalEl = document.getElementById('month-total');
    if (monthTotalEl) monthTotalEl.textContent = `$ ${monthTotal} / $ ${monthLimit}`;

    const monthCard = document.getElementById('month-card');
    if (monthCard) {
        if (budgets.monthly > 0 && monthTotal > budgets.monthly) {
            monthCard.classList.add('warning');
        } else {
            monthCard.classList.remove('warning');
        }
    }

    // 刪除按鈕事件綁定
    const deleteButtons = calendarView.querySelectorAll('.delete-btn');
    deleteButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const index = btn.getAttribute('data-index');
            expenses.splice(index, 1);
            localStorage.setItem('my_expenses', JSON.stringify(expenses));
            renderExpenses();
            renderCalendar();
            renderChart();
        });
    });
}

// 7. 監聽「新增支出」按鈕
if (addBtn) {
    addBtn.addEventListener('click', function() {
        const date = expenseDateInput.value;
        const name = expenseNameInput.value.trim();
        const amount = expenseAmountInput.value;
        const category = expenseCategorySelect.value;

        if (!date || !name || !amount) {
            alert("請把日期、消費名稱與金額都填寫完整喔！");
            return;
        }

        const newExpense = {
            date: date,
            name: name,
            amount: amount,
            category: category
        };

        expenses.push(newExpense);
        localStorage.setItem('my_expenses', JSON.stringify(expenses));
        
        renderExpenses();
        renderCalendar();
        renderChart();

        expenseNameInput.value = '';
        expenseAmountInput.value = '';
        
        alert("成功新增一筆消費紀錄！");
    });
}

// 9. 月曆檢視功能邏輯
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0 ~ 11

const calendarMonthTitle = document.getElementById('calendar-month-title');
const calendarGrid = document.getElementById('calendar-grid');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');

function renderCalendar() {
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';
    
    if (calendarMonthTitle) {
        calendarMonthTitle.textContent = `${currentYear}年 ${currentMonth + 1}月`;
    }

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-cell', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.classList.add('calendar-cell');

        const mm = String(currentMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const dateStr = `${currentYear}-${mm}-${dd}`;

        cell.innerHTML = `
            <div class="date-num">${day}</div>
            <div style="font-size: 11px; color: #666; display: flex; flex-direction: column; gap: 2px; margin-top: 4px;" id="cell-data-${dateStr}"></div>
        `;

        calendarGrid.appendChild(cell);
    }

    expenses.forEach(item => {
        const cellContainer = document.getElementById(`cell-data-${item.date}`);
        if (cellContainer) {
            const itemTag = document.createElement('div');
            itemTag.style.backgroundColor = '#e8f0fe';
            itemTag.style.color = '#5582c2';
            itemTag.style.padding = '1px 4px';
            itemTag.style.borderRadius = '3px';
            itemTag.style.fontSize = '10px';
            itemTag.style.overflow = 'hidden';
            itemTag.style.textOverflow = 'ellipsis';
            itemTag.style.whiteSpace = 'nowrap';
            itemTag.textContent = `${item.name} $${item.amount}`;
            
            cellContainer.appendChild(itemTag);
        }
    });
}

if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
}

// 10. Chart.js 消費比例圓餅圖與百分比清單邏輯
let expenseChart = null;

function renderChart() {
    const canvasCtx = document.getElementById('expense-chart');
    if (!canvasCtx) return;
    const ctx = canvasCtx.getContext('2d');

    let categoryTotals = {
        food: 0,
        transport: 0,
        entertainment: 0,
        clothes: 0,
        fixed: 0,
        other: 0
    };

    let totalExpenseSum = 0;

    expenses.forEach(item => {
        const amount = Number(item.amount) || 0;
        totalExpenseSum += amount;
        if (categoryTotals.hasOwnProperty(item.category)) {
            categoryTotals[item.category] += amount;
        } else {
            categoryTotals.other += amount;
        }
    });

    const statsTotalText = document.getElementById('stats-total-text');
    if (statsTotalText) {
        statsTotalText.textContent = `總支出：$ ${totalExpenseSum}`;
    }

    const categoriesInfo = [
        { key: 'food', name: '吃的喝的', color: '#efd1c5' },
        { key: 'transport', name: '交通', color: '#c6d5e8' },
        { key: 'entertainment', name: '娛樂', color: '#dac6e8' },
        { key: 'clothes', name: '買買買', color: '#efe4b7' },
        { key: 'other', name: '其他', color: '#d4d8dd' }
    ];

    const statsListContainer = document.getElementById('category-stats-list');
    if (statsListContainer) {
        statsListContainer.innerHTML = '';

        categoriesInfo.forEach(cat => {
            const amount = categoryTotals[cat.key];
            const percentage = totalExpenseSum > 0 ? ((amount / totalExpenseSum) * 100).toFixed(1) : 0;

            const itemDiv = document.createElement('div');
            itemDiv.style.display = 'flex';
            itemDiv.style.justifyContent = 'space-between';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.padding = '8px 12px';
            itemDiv.style.backgroundColor = '#f9f9f9';
            itemDiv.style.borderRadius = '6px';
            itemDiv.style.borderLeft = `4px solid ${cat.color}`;

            itemDiv.innerHTML = `
                <span style="font-size: 14px; font-weight: 500; color: #333;">${cat.name}</span>
                <span style="font-size: 14px; color: #555;">$${amount} <strong style="color: #8698b1; margin-left: 8px;">(${percentage}%)</strong></span>
            `;

            statsListContainer.appendChild(itemDiv);
        });
    }

    const chartData = categoriesInfo.map(cat => categoryTotals[cat.key]);
    const chartColors = categoriesInfo.map(cat => cat.color);

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoriesInfo.map(cat => cat.name),
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// 11. 匯出 CSV 報表功能
const exportCsvBtn = document.getElementById('export-csv-btn');
if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', function() {
        if (expenses.length === 0) {
            alert("目前沒有任何記帳資料可以匯出喔！趕快去新增幾筆消費吧～");
            return;
        }

        let csvContent = "\uFEFF日期,消費名稱,金額,類別\n";

        expenses.forEach(item => {
            let catName = item.category;
            switch(item.category) {
                case 'food': catName = '吃的喝的'; break;
                case 'transport': catName = '交通'; break;
                case 'entertainment': catName = '娛樂'; break;
                case 'clothes': catName = '買買買'; break;
                default: catName = '其他';
            }
            csvContent += `${item.date},"${item.name}",${item.amount},${catName}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'my_expense_report.csv');
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        
        alert("成功匯出記帳報表 CSV 檔案！");
    });
}

// 12. 清除全部紀錄與重設功能
const resetAllBtn = document.getElementById('reset-all-btn');
if (resetAllBtn) {
    resetAllBtn.addEventListener('click', function() {
        const isConfirmed = confirm("確定要清空所有記帳紀錄與預算設定嗎？執行後無法復原。");
        
        if (isConfirmed) {
            expenses = [];
            budgets = { weekly: 0, monthly: 0 };

            localStorage.removeItem('my_expenses');
            localStorage.removeItem('my_budgets');

            if (weeklyBudgetInput) weeklyBudgetInput.value = '';
            if (monthlyBudgetInput) monthlyBudgetInput.value = '';

            renderExpenses();
            renderCalendar();
            renderChart();

            alert("已成功清空所有資料，小金庫已重設！");
        }
    });
}

// 13. 密碼登入與安全防護系統
const lockScreen = document.getElementById('lock-screen');
const lockTitle = document.getElementById('lock-title');
const lockDesc = document.getElementById('lock-desc');
const lockPasswordInput = document.getElementById('lock-password-input');
const lockSubmitBtn = document.getElementById('lock-submit-btn');
const lockSystemBtn = document.getElementById('lock-system-btn');

function initAuthSystem() {
    const savedPassword = localStorage.getItem('my_vault_password');
    const isUnlocked = sessionStorage.getItem('vault_unlocked');

    if (!savedPassword) {
        if (lockTitle) lockTitle.textContent = " 初始化您的金庫密碼";
        if (lockDesc) lockDesc.textContent = "這是您第一次使用，請設定一組解鎖密碼：";
        if (lockSubmitBtn) lockSubmitBtn.textContent = "確認並建立密碼";
    } else {
        if (isUnlocked === 'true') {
            if (lockScreen) lockScreen.style.display = 'none';
        } else {
            if (lockScreen) lockScreen.style.display = 'flex';
        }
    }
}

if (lockSubmitBtn) {
    lockSubmitBtn.addEventListener('click', function() {
        const inputVal = lockPasswordInput.value.trim();
        const savedPassword = localStorage.getItem('my_vault_password');

        if (!inputVal) {
            alert("密碼不能為空白！");
            return;
        }

        if (!savedPassword) {
            localStorage.setItem('my_vault_password', inputVal);
            sessionStorage.setItem('vault_unlocked', 'true');
            if (lockScreen) lockScreen.style.display = 'none';
            lockPasswordInput.value = '';
            alert("密碼設定成功！歡迎進入小金庫。");
        } else {
            if (inputVal === savedPassword) {
                sessionStorage.setItem('vault_unlocked', 'true');
                if (lockScreen) lockScreen.style.display = 'none';
                lockPasswordInput.value = '';
            } else {
                alert("密碼錯誤，請重新輸入！");
                lockPasswordInput.value = '';
            }
        }
    });
}

if (lockPasswordInput) {
    lockPasswordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (lockSubmitBtn) lockSubmitBtn.click();
        }
    });
}

if (lockSystemBtn) {
    lockSystemBtn.addEventListener('click', function() {
        sessionStorage.removeItem('vault_unlocked');
        if (lockPasswordInput) lockPasswordInput.value = '';
        if (lockTitle) lockTitle.textContent = "金庫已上鎖";
        if (lockDesc) lockDesc.textContent = "請輸入您的密碼以解鎖您的專屬記帳本";
        if (lockSubmitBtn) lockSubmitBtn.textContent = "解鎖";
        if (lockScreen) lockScreen.style.display = 'flex';
    });
}

function renderSettingsPage() {
    const settingsContainer = document.getElementById('settings-content');
    if (!settingsContainer) return;

    const isUnlocked = sessionStorage.getItem('vault_unlocked');
    const isDark = document.body.classList.contains('dark-mode');

    settingsContainer.innerHTML = `
        <div style="padding: 15px; background: var(--bg-color); border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0;">目前金庫狀態</h4>
            <p style="margin: 0; font-size: 14px; color: ${isUnlocked === 'true' ? '#29292a' : '#c77c74'}; font-weight: bold;">
                ${isUnlocked === 'true' ? '● 目前狀態：已解鎖' : '● 目前狀態：已上鎖'}
            </p>
        </div>

        <button id="settings-logout-btn" style="background-color: #a6544b; color: white; padding: 10px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 20px; width: 100%;">
             立即登出 / 鎖定金庫
        </button>

        <div style="border-top: 1px solid var(--border-color); padding-top: 20px;">
            <h4 style="margin: 0 0 10px 0;">變更解鎖密碼</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; max-width: 400px;">
                <input type="password" id="old-password" placeholder="請輸入舊密碼" style="padding: 8px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); border-radius: 4px;">
                <input type="password" id="new-password" placeholder="請輸入新密碼" style="padding: 8px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); border-radius: 4px;">
                <button id="change-pwd-btn" style="margin-top: 5px; background-color: #4a5568; color: white; padding: 8px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">確認修改密碼</button>
            </div>
        </div>
    `;

    // 確保 DOM 渲染後才綁定按鈕事件
    setTimeout(() => {
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.onclick = function() {
                toggleTheme();
                renderSettingsPage();
            };
        }

        const logoutBtn = document.getElementById('settings-logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = function() {
                sessionStorage.removeItem('vault_unlocked');
                alert("已成功登出金庫！");
                location.reload();
            };
        }
    }, 50);
}
// 📦 當網頁載入時檢查是否已設定過名字
document.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('piggy_bank_name');
    const nameModal = document.getElementById('name-modal');
    
    if (!savedName) {
        // 如果還沒有名字，顯示彈窗
        nameModal.style.display = 'flex';
    } else {
        // 如果有名字，更新畫面的標題
        updateVaultTitle(savedName);
    }

    // 點擊送出名字按鈕
    document.getElementById('modal-submit-btn').addEventListener('click', () => {
        const inputVal = document.getElementById('modal-name-input').value.trim();
        if (inputVal) {
            const finalName = `${inputVal}的小金庫`;
            localStorage.setItem('piggy_bank_name', finalName);
            updateVaultTitle(finalName);
            nameModal.style.display = 'none'; // 關閉彈窗
        } else {
            alert('請輸入有效名字喔！');
        }
    });
});

// 更新畫面上顯示的小金庫標題函式
function updateVaultTitle(titleText) {
    const titleEl = document.getElementById('sidebar-title');
    if (titleEl) {
        titleEl.textContent = titleText;
    }
}
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'change-pwd-btn') {
        const oldPwdInput = document.getElementById('old-password');
        const newPwdInput = document.getElementById('new-password');
        
        if (!oldPwdInput || !newPwdInput) return;

        const oldPwd = oldPwdInput.value.trim();
        const newPwd = newPwdInput.value.trim();
        const savedPassword = localStorage.getItem('my_vault_password');

        if (!oldPwd || !newPwd) {
            alert("舊密碼與新密碼皆不能為空白！");
            return;
        }

        if (oldPwd !== savedPassword) {
            alert("舊密碼輸入錯誤，無法修改！");
            return;
        }

        localStorage.setItem('my_vault_password', newPwd);
        alert("密碼修改成功！下次登入請使用新密碼。");
        oldPwdInput.value = '';
        newPwdInput.value = '';
    }
});
// 14. 網頁載入時初始化執行
window.addEventListener('DOMContentLoaded', function() {
    initAuthSystem();
    renderExpenses();
    renderCalendar();
    renderChart();        // <-- 這裡一定要有呼叫圓餅圖渲染！
    renderFixedList();    // <-- 也要有固定支出清單渲染！
    checkAndApplyFixedExpenses();
});
// ================= 每月固定支出功能 =================
let fixedExpenses = JSON.parse(localStorage.getItem('my_fixed_expenses')) || [];

const fixedNameInput = document.getElementById('fixed-name');
const fixedAmountInput = document.getElementById('fixed-amount');
const fixedCategorySelect = document.getElementById('fixed-category');
const addFixedBtn = document.getElementById('add-fixed-btn');
const fixedListContainer = document.getElementById('fixed-list-container');

// 渲染已儲存的固定支出清單
function renderFixedList() {
    if (!fixedListContainer) return;
    fixedListContainer.innerHTML = '';

    if (fixedExpenses.length === 0) {
        fixedListContainer.innerHTML = '<p style="font-size: 13px; color: #888;">目前沒有設定任何每月固定支出。</p>';
        return;
    }

    fixedExpenses.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '8px 12px';
        div.style.background = '#f8f9fa';
        div.style.marginBottom = '6px';
        div.style.borderRadius = '4px';
        div.style.border = '1px solid #e9ecef';

        div.innerHTML = `
            <span style="font-size: 13px; color: #333;">📌 ${item.name} ($${item.amount})</span>
            <button class="delete-fixed-btn" data-index="${index}" style="background-color: #e74c3c; color: white; border: none; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">刪除</button>
        `;
        fixedListContainer.appendChild(div);
    });

    // 綁定固定支出的刪除事件
    const deleteFixedBtns = fixedListContainer.querySelectorAll('.delete-fixed-btn');
    deleteFixedBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const index = btn.getAttribute('data-index');
            fixedExpenses.splice(index, 1);
            localStorage.setItem('my_fixed_expenses', JSON.stringify(fixedExpenses));
            renderFixedList();
        });
    });
}

// 監聽新增固定支出按鈕
if (addFixedBtn) {
    addFixedBtn.addEventListener('click', function() {
        const name = fixedNameInput.value.trim();
        const amount = fixedAmountInput.value;
        const category = fixedCategorySelect.value;

        if (!name || !amount) {
            alert("請填寫固定支出的名稱與金額！");
            return;
        }

        const newFixed = { name, amount, category };
        fixedExpenses.push(newFixed);
        localStorage.setItem('my_fixed_expenses', JSON.stringify(fixedExpenses));

        fixedNameInput.value = '';
        fixedAmountInput.value = '';
        renderFixedList();
        checkAndApplyFixedExpenses(); // 立即檢查套用
        
        alert("成功新增每月固定支出設定！");
    });
}

// 檢查並自動帶入當月固定支出
function checkAndApplyFixedExpenses() {
    if (fixedExpenses.length === 0) return;

    const now = new Date();
    const currentYearMonth = now.toISOString().slice(0, 7); // 格式: YYYY-MM
    const checkKey = `fixed_applied_${currentYearMonth}`;

    const isApplied = localStorage.getItem(checkKey);
    if (isApplied === 'true') return;

    const applyDate = `${currentYearMonth}-01`;
    let hasNewAdded = false;

    fixedExpenses.forEach(fixed => {
        const exists = expenses.some(e => e.date === applyDate && e.name === `[固定] ${fixed.name}`);
        if (!exists) {
            expenses.push({
                date: applyDate,
                name: `[固定] ${fixed.name}`,
                amount: fixed.amount,
                category: fixed.category
            });
            hasNewAdded = true;
        }
    });

    if (hasNewAdded) {
        localStorage.setItem('my_expenses', JSON.stringify(expenses));
        localStorage.setItem(checkKey, 'true');
        renderExpenses();
        renderCalendar();
        renderChart();
    }
}
// 檢查 localStorage 是否有之前儲存的主題設定
const savedTheme = localStorage.getItem('my_vault_theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}
// 切換色系的主函式
function changeTheme(themeName) {
    if (themeName === 'default') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('user_theme', 'default');
    } else {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('user_theme', themeName);
    }
}
// ==========================================
// 🔐 密碼解鎖 與 👤 名字彈窗聯動邏輯
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const lockScreen = document.getElementById('lock-screen');
    const passwordInput = document.getElementById('lock-password-input');
    const submitBtn = document.getElementById('lock-submit-btn');
    
    const nameModal = document.getElementById('name-modal');
    const modalNameInput = document.getElementById('modal-name-input');
    const modalSubmitBtn = document.getElementById('modal-submit-btn');
    const sidebarTitle = document.getElementById('sidebar-title');

    // 1. 檢查是否已經設定過名字
    const savedName = localStorage.getItem('piggy_bank_name');
    if (savedName && sidebarTitle) {
        sidebarTitle.textContent = savedName;
    }

    // 2. 密碼解鎖按鈕點擊事件
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const val = passwordInput.value.trim();
            if (!val) {
                alert('請輸入密碼！');
                return;
            }

            const savedPwd = localStorage.getItem('piggy_bank_password');
            if (!savedPwd) {
                // 第一次設定密碼
                localStorage.setItem('piggy_bank_password', val);
                alert('密碼設定成功！');
                lockScreen.style.display = 'none';
                
                // 解鎖後，如果還沒填過名字，跳出名字輸入彈窗
                if (!localStorage.getItem('piggy_bank_name')) {
                    nameModal.style.display = 'flex';
                }
            } else {
                // 驗證密碼
                if (val === savedPwd) {
                    lockScreen.style.display = 'none';
                    
                    // 解鎖成功後，如果還沒填過名字，跳出名字輸入彈窗
                    if (!localStorage.getItem('piggy_bank_name')) {
                        nameModal.style.display = 'flex';
                    }
                } else {
                    alert('密碼錯誤！');
                    passwordInput.value = '';
                }
            }
        });

        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitBtn.click();
        });
    }

    // 3. 名字輸入彈窗送出按鈕事件
    if (modalSubmitBtn) {
        modalSubmitBtn.addEventListener('click', () => {
            const nameVal = modalNameInput.value.trim();
            if (!nameVal) {
                alert('請輸入你的名字！');
                return;
            }

            const finalName = `${nameVal}的小金庫`;
            localStorage.setItem('piggy_bank_name', finalName);
            
            if (sidebarTitle) {
                sidebarTitle.textContent = finalName;
            }

            // 關閉名字彈窗
            nameModal.style.display = 'none';
        });

        modalNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') modalSubmitBtn.click();
        });
    }
});

// 網頁載入時，自動套用使用者上一次選擇的色系
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('user_theme');
    if (savedTheme && savedTheme !== 'default') {
        document.documentElement.setAttribute('data-theme', savedTheme);
        const selector = document.getElementById('themeSelector');
        if (selector) {
            selector.value = savedTheme;
        }
    }
});