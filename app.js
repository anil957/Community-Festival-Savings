/**
 * Festival Velam Fund Manager - Complete Application
 * Pure Vanilla JavaScript - No frameworks
 */

class FundManager {
    constructor() {
        this.TOTAL_MEMBERS = 11;
        this.DEFAULT_CONTRIBUTION = 500;
        this.FIRST_MONTH_CONTRIBUTION = 100;

        this.STORAGE = {
            CONTRIBUTIONS: 'velam_contributions',
            LOANS: 'velam_loans',
            EXPENSES: 'velam_expenses'
        };

        this.contributions = [];
        this.loans = [];
        this.expenses = [];

        this.loadFromStorage();
        console.log('FundManager initialized');
    }

    loadFromStorage() {
        const contrib = localStorage.getItem(this.STORAGE.CONTRIBUTIONS);
        const lns = localStorage.getItem(this.STORAGE.LOANS);
        const exp = localStorage.getItem(this.STORAGE.EXPENSES);

        this.contributions = contrib ? JSON.parse(contrib) : [];
        this.loans = lns ? JSON.parse(lns) : [];
        this.expenses = exp ? JSON.parse(exp) : [];
    }

    saveToStorage() {
        localStorage.setItem(this.STORAGE.CONTRIBUTIONS, JSON.stringify(this.contributions));
        localStorage.setItem(this.STORAGE.LOANS, JSON.stringify(this.loans));
        localStorage.setItem(this.STORAGE.EXPENSES, JSON.stringify(this.expenses));
    }

    addContribution(date, personName, amount) {
        const entry = {
            id: Date.now(),
            date,
            personName,
            amount: parseFloat(amount),
            month: date.substring(0, 7)
        };
        this.contributions.push(entry);
        this.saveToStorage();
        return entry;
    }

    addLoan(date, personName, principal, interest) {
        const entry = {
            id: Date.now(),
            date,
            personName,
            principal: parseFloat(principal),
            interest: parseFloat(interest),
            status: 'ACTIVE',
            returnedDate: null
        };
        this.loans.push(entry);
        this.saveToStorage();
        return entry;
    }

    markLoanReturned(loanId) {
        const loan = this.loans.find(l => l.id === loanId);
        if (loan) {
            loan.status = 'RETURNED';
            loan.returnedDate = new Date().toISOString().split('T')[0];
            this.saveToStorage();
        }
    }

    addExpense(date, type, description, amount) {
        const entry = {
            id: Date.now(),
            date,
            type,
            description,
            amount: parseFloat(amount),
            month: date.substring(0, 7)
        };
        this.expenses.push(entry);
        this.saveToStorage();
        return entry;
    }

    deleteEntry(type, id) {
        if (type === 'contribution') {
            this.contributions = this.contributions.filter(c => c.id !== id);
        } else if (type === 'loan') {
            this.loans = this.loans.filter(l => l.id !== id);
        } else if (type === 'expense') {
            this.expenses = this.expenses.filter(e => e.id !== id);
        }
        this.saveToStorage();
    }

    updateEntry(type, id, updates) {
        let entry;
        if (type === 'contribution') {
            entry = this.contributions.find(c => c.id === id);
        } else if (type === 'loan') {
            entry = this.loans.find(l => l.id === id);
        } else if (type === 'expense') {
            entry = this.expenses.find(e => e.id === id);
        }

        if (entry) {
            Object.assign(entry, updates);
            this.saveToStorage();
        }
    }

    getTotalContributions() {
        return this.contributions.reduce((sum, c) => sum + c.amount, 0);
    }

    getTotalInterest() {
        return this.loans.reduce((sum, l) => sum + l.interest, 0);
    }

    getTotalLoansGiven() {
        return this.loans.reduce((sum, l) => sum + l.principal, 0);
    }

    getTotalLoansReturned() {
        return this.loans
            .filter(l => l.status === 'RETURNED')
            .reduce((sum, l) => sum + l.principal, 0);
    }

    getTotalExpenses() {
        return this.expenses.reduce((sum, e) => sum + e.amount, 0);
    }

    getAvailableBalance() {
        return (
            this.getTotalContributions() +
            this.getTotalInterest() +
            this.getTotalLoansReturned() -
            this.getTotalLoansGiven() -
            this.getTotalExpenses()
        );
    }

    getTopBorrowers(limit = 5) {
        const borrowers = {};
        this.loans.forEach(loan => {
            borrowers[loan.personName] = (borrowers[loan.personName] || 0) + 1;
        });

        return Object.entries(borrowers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }

    getMonthlySummary() {
        const summary = {};

        this.contributions.forEach(c => {
            if (!summary[c.month]) {
                summary[c.month] = {
                    month: c.month,
                    contributions: 0,
                    loansGiven: 0,
                    loansReturned: 0,
                    interest: 0,
                    expenses: 0
                };
            }
            summary[c.month].contributions += c.amount;
        });

        this.loans.forEach(l => {
            const month = l.date.substring(0, 7);
            if (!summary[month]) {
                summary[month] = {
                    month,
                    contributions: 0,
                    loansGiven: 0,
                    loansReturned: 0,
                    interest: 0,
                    expenses: 0
                };
            }
            summary[month].loansGiven += l.principal;
            summary[month].interest += l.interest;

            if (l.status === 'RETURNED' && l.returnedDate) {
                const returnMonth = l.returnedDate.substring(0, 7);
                if (!summary[returnMonth]) {
                    summary[returnMonth] = {
                        month: returnMonth,
                        contributions: 0,
                        loansGiven: 0,
                        loansReturned: 0,
                        interest: 0,
                        expenses: 0
                    };
                }
                summary[returnMonth].loansReturned += l.principal;
            }
        });

        this.expenses.forEach(e => {
            if (!summary[e.month]) {
                summary[e.month] = {
                    month: e.month,
                    contributions: 0,
                    loansGiven: 0,
                    loansReturned: 0,
                    interest: 0,
                    expenses: 0
                };
            }
            summary[e.month].expenses += e.amount;
        });

        return Object.values(summary).sort((a, b) => a.month.localeCompare(b.month));
    }

    init() {
        console.log('Initializing FundManager');
        this.setupTabNavigation();
        this.setupFormHandlers();
        this.setupModalHandlers();
        this.updateDashboard();
        this.renderAllLists();
        console.log('FundManager initialization complete');
    }

    setupTabNavigation() {
        console.log('Setting up tab navigation');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        console.log('Found tab buttons:', tabBtns.length);
        console.log('Found tab contents:', tabContents.length);

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = btn.getAttribute('data-tab');
                console.log('Tab clicked:', tabName);

                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');

                const tabContent = document.getElementById(`${tabName}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                    console.log('Tab activated successfully:', tabName);
                } else {
                    console.error('Tab content not found:', `${tabName}-tab`);
                }
            });
        });
    }

    setupFormHandlers() {
        console.log('Setting up form handlers');
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'ROLE_READONLY') {
            console.log('Read-only user, skipping form handlers');
            return;
        }

        const contForm = document.getElementById('contributionForm');
        if (contForm) {
            contForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const date = document.getElementById('contDate').value;
                const person = document.getElementById('personName').value;
                const amount = document.getElementById('contributionAmount').value;

                if (date && person && amount) {
                    this.addContribution(date, person, amount);
                    contForm.reset();
                    this.updateDashboard();
                    this.renderContributionsList();
                    alert('✅ Contribution added!');
                }
            });
        }

        const loanForm = document.getElementById('loanForm');
        if (loanForm) {
            loanForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const date = document.getElementById('loanDate').value;
                const person = document.getElementById('loanPersonName').value;
                const principal = document.getElementById('principalAmount').value;
                const interest = document.getElementById('interestAmount').value;

                if (date && person && principal && interest) {
                    this.addLoan(date, person, principal, interest);
                    loanForm.reset();
                    this.updateDashboard();
                    this.renderLoansList();
                    alert('✅ Loan added!');
                }
            });
        }

        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const date = document.getElementById('expenseDate').value;
                const type = document.getElementById('expenseType').value;
                const desc = document.getElementById('expenseDescription').value;
                const amount = document.getElementById('expenseAmount').value;

                if (date && type && desc && amount) {
                    this.addExpense(date, type, desc, amount);
                    expenseForm.reset();
                    this.updateDashboard();
                    this.renderExpensesList();
                    alert('✅ Expense added!');
                }
            });
        }
    }

    setupModalHandlers() {
        const modal = document.getElementById('editModal');
        if (!modal) return;

        const closeBtn = document.querySelector('.modal-close');
        const cancelBtn = document.getElementById('modalCancelBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    updateDashboard() {
        const els = {
            totalContributions: document.getElementById('totalContributions'),
            totalInterest: document.getElementById('totalInterest'),
            totalLoansGiven: document.getElementById('totalLoansGiven'),
            totalLoansReturned: document.getElementById('totalLoansReturned'),
            totalExpenses: document.getElementById('totalExpenses'),
            availableBalance: document.getElementById('availableBalance')
        };

        if (els.totalContributions) els.totalContributions.textContent = `₹${this.getTotalContributions()}`;
        if (els.totalInterest) els.totalInterest.textContent = `₹${this.getTotalInterest()}`;
        if (els.totalLoansGiven) els.totalLoansGiven.textContent = `₹${this.getTotalLoansGiven()}`;
        if (els.totalLoansReturned) els.totalLoansReturned.textContent = `₹${this.getTotalLoansReturned()}`;
        if (els.totalExpenses) els.totalExpenses.textContent = `₹${this.getTotalExpenses()}`;
        if (els.availableBalance) els.availableBalance.textContent = `₹${this.getAvailableBalance()}`;
    }

    renderContributionsList() {
        const tbody = document.getElementById('contributionsList');
        if (!tbody) return;

        const userRole = localStorage.getItem('userRole');

        if (this.contributions.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No contributions yet</td></tr>';
            return;
        }

        tbody.innerHTML = this.contributions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(c => {
                const actionCol = userRole === 'ROLE_ADMIN' 
                    ? `<td class="admin-col">
                        <div class="action-buttons">
                            <button class="btn btn-edit btn-sm" onclick="window.fundManager.showEditModal('contribution', ${c.id})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="if(confirm('Delete?')) { window.fundManager.deleteEntry('contribution', ${c.id}); window.fundManager.updateDashboard(); window.fundManager.renderContributionsList(); }">Delete</button>
                        </div>
                    </td>`
                    : '<td class="admin-col"></td>';

                return `
                    <tr>
                        <td>${c.date}</td>
                        <td>${c.personName}</td>
                        <td>₹${c.amount}</td>
                        <td>${c.month}</td>
                        ${actionCol}
                    </tr>
                `;
            })
            .join('');
    }

    renderLoansList() {
        const tbody = document.getElementById('loansList');
        if (!tbody) return;

        const userRole = localStorage.getItem('userRole');

        if (this.loans.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No loans yet</td></tr>';
            return;
        }

        tbody.innerHTML = this.loans
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(l => {
                const statusBadge = l.status === 'ACTIVE' 
                    ? '<span style="background: #f39c12; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Active</span>'
                    : '<span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Returned</span>';

                const returnBtn = userRole === 'ROLE_ADMIN' && l.status === 'ACTIVE' 
                    ? `<button class="btn btn-return btn-sm" onclick="window.fundManager.markLoanReturned(${l.id}); window.fundManager.updateDashboard(); window.fundManager.renderLoansList();">Return</button>`
                    : '';

                const actionCol = userRole === 'ROLE_ADMIN' 
                    ? `<td class="admin-col">
                        <div class="action-buttons">
                            ${returnBtn}
                            <button class="btn btn-edit btn-sm" onclick="window.fundManager.showEditModal('loan', ${l.id})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="if(confirm('Delete?')) { window.fundManager.deleteEntry('loan', ${l.id}); window.fundManager.updateDashboard(); window.fundManager.renderLoansList(); }">Delete</button>
                        </div>
                    </td>`
                    : '<td class="admin-col"></td>';

                return `
                    <tr>
                        <td>${l.date}</td>
                        <td>${l.personName}</td>
                        <td>₹${l.principal}</td>
                        <td>₹${l.interest}</td>
                        <td>${statusBadge}</td>
                        ${actionCol}
                    </tr>
                `;
            })
            .join('');

        this.renderTopBorrowers();
    }

    renderExpensesList() {
        const tbody = document.getElementById('expensesList');
        if (!tbody) return;

        const userRole = localStorage.getItem('userRole');

        if (this.expenses.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No expenses yet</td></tr>';
            return;
        }

        tbody.innerHTML = this.expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(e => {
                const actionCol = userRole === 'ROLE_ADMIN' 
                    ? `<td class="admin-col">
                        <div class="action-buttons">
                            <button class="btn btn-edit btn-sm" onclick="window.fundManager.showEditModal('expense', ${e.id})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="if(confirm('Delete?')) { window.fundManager.deleteEntry('expense', ${e.id}); window.fundManager.updateDashboard(); window.fundManager.renderExpensesList(); }">Delete</button>
                        </div>
                    </td>`
                    : '<td class="admin-col"></td>';

                return `
                    <tr>
                        <td>${e.date}</td>
                        <td>${e.type}</td>
                        <td>${e.description}</td>
                        <td>₹${e.amount}</td>
                        ${actionCol}
                    </tr>
                `;
            })
            .join('');
    }

    renderTopBorrowers() {
        const list = document.getElementById('topBorrowersList');
        if (!list) return;

        const topBorrowers = this.getTopBorrowers(5);

        if (topBorrowers.length === 0) {
            list.innerHTML = '<li>No borrowers yet</li>';
            return;
        }

        list.innerHTML = topBorrowers
            .map((b, i) => `<li>${i + 1}. ${b.name} - <strong>${b.count}</strong> times</li>`)
            .join('');
    }

    renderAllLists() {
        this.renderContributionsList();
        this.renderLoansList();
        this.renderExpensesList();
        this.renderMonthlyReport();
        this.drawChart();
    }

    renderMonthlyReport() {
        const tbody = document.getElementById('monthlyReportList');
        if (!tbody) return;

        const summary = this.getMonthlySummary();

        if (summary.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No data available</td></tr>';
            return;
        }

        tbody.innerHTML = summary
            .map(s => `
                <tr>
                    <td>${s.month}</td>
                    <td>₹${s.contributions}</td>
                    <td>₹${s.loansGiven}</td>
                    <td>₹${s.loansReturned}</td>
                    <td>₹${s.interest}</td>
                    <td>₹${s.expenses}</td>
                </tr>
            `)
            .join('');
    }

    drawChart() {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const summary = this.getMonthlySummary();

        if (summary.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '14px Arial';
            ctx.fillText('No data to display', 50, 100);
            return;
        }

        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        const barWidth = chartWidth / (summary.length * 1.5);
        const maxValue = Math.max(...summary.map(s => s.contributions + s.loansReturned + s.interest), 1);
        const scale = chartHeight / maxValue;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        summary.forEach((s, i) => {
            const total = s.contributions + s.loansReturned + s.interest;
            const x = padding + (i * (barWidth + 20));
            const barHeight = total * scale;
            const y = canvas.height - padding - barHeight;

            ctx.fillStyle = '#3498db';
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(s.month, x + barWidth / 2, canvas.height - padding + 20);

            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(`₹${total}`, x + barWidth / 2, y + 15);
        });
    }

    showEditModal(type, id) {
        const modal = document.getElementById('editModal');
        if (!modal) return;

        const title = document.getElementById('modalTitle');
        const fields = document.getElementById('editFormFields');

        let entry;
        if (type === 'contribution') {
            entry = this.contributions.find(c => c.id === id);
            if (title) title.textContent = 'Edit Contribution';
        } else if (type === 'loan') {
            entry = this.loans.find(l => l.id === id);
            if (title) title.textContent = 'Edit Loan';
        } else if (type === 'expense') {
            entry = this.expenses.find(e => e.id === id);
            if (title) title.textContent = 'Edit Expense';
        }

        if (!entry) return;

        if (type === 'contribution') {
            fields.innerHTML = `
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="editDate" value="${entry.date}">
                </div>
                <div class="form-group">
                    <label>Person Name</label>
                    <input type="text" id="editPerson" value="${entry.personName}">
                </div>
                <div class="form-group">
                    <label>Amount (₹)</label>
                    <input type="number" id="editAmount" value="${entry.amount}">
                </div>
            `;
        } else if (type === 'loan') {
            fields.innerHTML = `
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="editDate" value="${entry.date}">
                </div>
                <div class="form-group">
                    <label>Person Name</label>
                    <input type="text" id="editPerson" value="${entry.personName}">
                </div>
                <div class="form-group">
                    <label>Principal (₹)</label>
                    <input type="number" id="editPrincipal" value="${entry.principal}">
                </div>
                <div class="form-group">
                    <label>Interest (₹)</label>
                    <input type="number" id="editInterest" value="${entry.interest}">
                </div>
            `;
        } else if (type === 'expense') {
            fields.innerHTML = `
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="editDate" value="${entry.date}">
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select id="editType">
                        <option value="Sheep Purchase" ${entry.type === 'Sheep Purchase' ? 'selected' : ''}>🐑 Sheep Purchase</option>
                        <option value="Miscellaneous" ${entry.type === 'Miscellaneous' ? 'selected' : ''}>📦 Miscellaneous</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="editDesc" value="${entry.description}">
                </div>
                <div class="form-group">
                    <label>Amount (₹)</label>
                    <input type="number" id="editAmount" value="${entry.amount}">
                </div>
            `;
        }

        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.onsubmit = (e) => {
                e.preventDefault();

                if (type === 'contribution') {
                    this.updateEntry('contribution', id, {
                        date: document.getElementById('editDate').value,
                        personName: document.getElementById('editPerson').value,
                        amount: parseFloat(document.getElementById('editAmount').value)
                    });
                } else if (type === 'loan') {
                    this.updateEntry('loan', id, {
                        date: document.getElementById('editDate').value,
                        personName: document.getElementById('editPerson').value,
                        principal: parseFloat(document.getElementById('editPrincipal').value),
                        interest: parseFloat(document.getElementById('editInterest').value)
                    });
                } else if (type === 'expense') {
                    this.updateEntry('expense', id, {
                        date: document.getElementById('editDate').value,
                        type: document.getElementById('editType').value,
                        description: document.getElementById('editDesc').value,
                        amount: parseFloat(document.getElementById('editAmount').value)
                    });
                }

                modal.style.display = 'none';
                this.updateDashboard();
                this.renderAllLists();
                alert('✅ Updated!');
            };
        }

        modal.style.display = 'flex';
    }

}

console.log('FundManager class loaded');
