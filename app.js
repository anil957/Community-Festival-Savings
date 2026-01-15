/**
 * Festival Velam Fund Manager - Main Application Logic
 * Manages all fund tracking, data persistence, and UI updates
 */

class FundManager {
    /**
     * Constructor - Initialize data structures and constants
     */
    constructor() {
        // Constants
        this.MEMBERS_COUNT = 11;
        this.MONTH_1_CONTRIBUTION = 100;
        this.MONTH_2_PLUS_CONTRIBUTION = 500;

        // Data storage keys for localStorage
        this.STORAGE_KEYS = {
            CONTRIBUTIONS: 'velam_contributions',
            SHEEP_EXPENSES: 'velam_sheep_expenses',
            MONEY_TAKEN: 'velam_money_taken'
        };

        // Initialize data from localStorage
        this.loadData();
    }

    /**
     * Load all data from localStorage
     */
    loadData() {
        this.contributions = JSON.parse(
            localStorage.getItem(this.STORAGE_KEYS.CONTRIBUTIONS)
        ) || [];

        this.sheepExpenses = JSON.parse(
            localStorage.getItem(this.STORAGE_KEYS.SHEEP_EXPENSES)
        ) || [];

        this.moneyTaken = JSON.parse(
            localStorage.getItem(this.STORAGE_KEYS.MONEY_TAKEN)
        ) || {};
    }

    /**
     * Save all data to localStorage
     */
    saveData() {
        localStorage.setItem(
            this.STORAGE_KEYS.CONTRIBUTIONS,
            JSON.stringify(this.contributions)
        );

        localStorage.setItem(
            this.STORAGE_KEYS.SHEEP_EXPENSES,
            JSON.stringify(this.sheepExpenses)
        );

        localStorage.setItem(
            this.STORAGE_KEYS.MONEY_TAKEN,
            JSON.stringify(this.moneyTaken)
        );
    }

    /**
     * Add a monthly contribution
     * @param {string} monthName - Name of the month
     * @param {number} collectedAmount - Total amount collected
     * @param {number} interestEarned - Interest earned in the month
     */
    addContribution(monthName, collectedAmount, interestEarned) {
        const contribution = {
            id: Date.now(),
            monthName,
            collectedAmount: parseFloat(collectedAmount),
            interestEarned: parseFloat(interestEarned),
            timestamp: new Date().toISOString()
        };

        this.contributions.push(contribution);
        this.saveData();
        return contribution;
    }

    /**
     * Delete a contribution by ID
     * @param {number} id - Contribution ID
     */
    deleteContribution(id) {
        this.contributions = this.contributions.filter(c => c.id !== id);
        this.saveData();
    }

    /**
     * Add a sheep expense
     * @param {string} festivalName - Festival/Event name
     * @param {number} amount - Amount spent
     * @param {number} sheepCount - Number of sheep
     */
    addSheepExpense(festivalName, amount, sheepCount) {
        const expense = {
            id: Date.now(),
            festivalName,
            amount: parseFloat(amount),
            sheepCount: parseInt(sheepCount),
            timestamp: new Date().toISOString()
        };

        this.sheepExpenses.push(expense);
        this.saveData();
        return expense;
    }

    /**
     * Delete a sheep expense by ID
     * @param {number} id - Expense ID
     */
    deleteSheepExpense(id) {
        this.sheepExpenses = this.sheepExpenses.filter(e => e.id !== id);
        this.saveData();
    }

    /**
     * Record money taken by a person
     * @param {string} personName - Name of the person
     * @param {number} amount - Amount taken
     */
    recordMoneyTaken(personName, amount) {
        if (!this.moneyTaken[personName]) {
            this.moneyTaken[personName] = {
                count: 0,
                transactions: []
            };
        }

        this.moneyTaken[personName].count += 1;
        this.moneyTaken[personName].transactions.push({
            amount: parseFloat(amount),
            timestamp: new Date().toISOString()
        });

        this.saveData();
    }

    /**
     * Delete a money taken record for a person
     * @param {string} personName - Name of the person
     */
    removeMoneyTaken(personName) {
        delete this.moneyTaken[personName];
        this.saveData();
    }

    /**
     * Calculate total fund collected
     * @returns {number} Total fund amount
     */
    calculateTotalFund() {
        return this.contributions.reduce((sum, c) => sum + c.collectedAmount, 0);
    }

    /**
     * Calculate total interest earned
     * @returns {number} Total interest amount
     */
    calculateTotalInterest() {
        return this.contributions.reduce((sum, c) => sum + c.interestEarned, 0);
    }

    /**
     * Calculate total sheep expense
     * @returns {number} Total sheep expense amount
     */
    calculateTotalSheepExpense() {
        return this.sheepExpenses.reduce((sum, e) => sum + e.amount, 0);
    }

    /**
     * Get the person who took money the most times
     * @returns {string} Person name and count
     */
    getTopBorrower() {
        if (Object.keys(this.moneyTaken).length === 0) {
            return '-';
        }

        let topPerson = '';
        let maxCount = 0;

        for (const [person, data] of Object.entries(this.moneyTaken)) {
            if (data.count > maxCount) {
                maxCount = data.count;
                topPerson = person;
            }
        }

        return maxCount > 0 ? `${topPerson} (${maxCount}x)` : '-';
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        this.attachEventListeners();
        this.updateAllUI();
        this.initializeChart();
    }

    /**
     * Attach event listeners to forms
     */
    attachEventListeners() {
        // Contribution form
        document.getElementById('contributionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddContribution();
        });

        // Sheep expense form
        document.getElementById('sheepExpenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddSheepExpense();
        });

        // Money taken form
        document.getElementById('moneyTakenForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRecordMoneyTaken();
        });

        // Toggle table view
        document.getElementById('toggleTableBtn').addEventListener('click', () => {
            this.toggleTableView();
        });
    }

    /**
     * Handle adding contribution
     */
    handleAddContribution() {
        const monthName = document.getElementById('monthName').value;
        const collectedAmount = document.getElementById('collectedAmount').value;
        const interestEarned = document.getElementById('interestEarned').value;

        // Validation
        if (!monthName || !collectedAmount || !interestEarned) {
            this.showAlert('Please fill all fields', 'error');
            return;
        }

        if (collectedAmount <= 0 || interestEarned < 0) {
            this.showAlert('Please enter valid amounts', 'error');
            return;
        }

        // Add contribution
        this.addContribution(monthName, collectedAmount, interestEarned);

        // Clear form
        document.getElementById('contributionForm').reset();

        // Update UI
        this.updateAllUI();
        this.updateChart();

        this.showAlert('Contribution added successfully!', 'success');
    }

    /**
     * Handle adding sheep expense
     */
    handleAddSheepExpense() {
        const festivalName = document.getElementById('festivalName').value;
        const sheepExpenseAmount = document.getElementById('sheepExpenseAmount').value;
        const sheepCount = document.getElementById('sheepCount').value;

        // Validation
        if (!festivalName || !sheepExpenseAmount || !sheepCount) {
            this.showAlert('Please fill all fields', 'error');
            return;
        }

        if (sheepExpenseAmount <= 0 || sheepCount <= 0) {
            this.showAlert('Please enter valid values', 'error');
            return;
        }

        // Add expense
        this.addSheepExpense(festivalName, sheepExpenseAmount, sheepCount);

        // Clear form
        document.getElementById('sheepExpenseForm').reset();

        // Update UI
        this.updateAllUI();

        this.showAlert('Sheep expense recorded successfully!', 'success');
    }

    /**
     * Handle recording money taken
     */
    handleRecordMoneyTaken() {
        const personName = document.getElementById('personName').value;
        const amountTaken = document.getElementById('amountTaken').value;

        // Validation
        if (!personName || !amountTaken) {
            this.showAlert('Please fill all fields', 'error');
            return;
        }

        if (amountTaken <= 0) {
            this.showAlert('Please enter a valid amount', 'error');
            return;
        }

        // Record transaction
        this.recordMoneyTaken(personName, amountTaken);

        // Clear form
        document.getElementById('moneyTakenForm').reset();

        // Update UI
        this.updateAllUI();

        this.showAlert('Money taken recorded successfully!', 'success');
    }

    /**
     * Update all UI elements
     */
    updateAllUI() {
        this.updateSummaryCards();
        this.updateContributionTable();
        this.updateMoneyTakenTable();
        this.updateSheepExpenseTable();
    }

    /**
     * Update summary cards
     */
    updateSummaryCards() {
        const totalFund = this.calculateTotalFund();
        const totalInterest = this.calculateTotalInterest();
        const totalSheep = this.calculateTotalSheepExpense();
        const topBorrower = this.getTopBorrower();

        document.getElementById('totalFund').textContent = `₹${totalFund.toLocaleString()}`;
        document.getElementById('totalInterest').textContent = `₹${totalInterest.toLocaleString()}`;
        document.getElementById('totalSheep').textContent = `₹${totalSheep.toLocaleString()}`;
        document.getElementById('topBorrower').textContent = topBorrower;
    }

    /**
     * Update contribution table
     */
    updateContributionTable() {
        const tableBody = document.getElementById('tableBody');

        if (this.contributions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="empty-message">No data available</td></tr>';
            return;
        }

        tableBody.innerHTML = this.contributions.map(contribution => `
            <tr>
                <td>${this.escapeHtml(contribution.monthName)}</td>
                <td>₹${contribution.collectedAmount.toLocaleString()}</td>
                <td>₹${contribution.interestEarned.toLocaleString()}</td>
                <td>
                    <button class="btn btn-danger" onclick="window.fundManager.deleteContributionAndRefresh(${contribution.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Delete contribution and refresh UI
     * @param {number} id - Contribution ID
     */
    deleteContributionAndRefresh(id) {
        if (confirm('Are you sure you want to delete this contribution?')) {
            this.deleteContribution(id);
            this.updateAllUI();
            this.updateChart();
            this.showAlert('Contribution deleted successfully!', 'success');
        }
    }

    /**
     * Update money taken table
     */
    updateMoneyTakenTable() {
        const tableBody = document.getElementById('moneyTakenTableBody');

        if (Object.keys(this.moneyTaken).length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" class="empty-message">No records available</td></tr>';
            return;
        }

        tableBody.innerHTML = Object.entries(this.moneyTaken).map(([person, data]) => `
            <tr>
                <td>${this.escapeHtml(person)}</td>
                <td>${data.count}</td>
                <td>
                    <button class="btn btn-danger" onclick="window.fundManager.removeMoneyTakenAndRefresh('${this.escapeHtml(person)}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Remove money taken and refresh UI
     * @param {string} personName - Name of the person
     */
    removeMoneyTakenAndRefresh(personName) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.removeMoneyTaken(personName);
            this.updateAllUI();
            this.showAlert('Record deleted successfully!', 'success');
        }
    }

    /**
     * Update sheep expense table
     */
    updateSheepExpenseTable() {
        const tableBody = document.getElementById('sheepExpenseTableBody');

        if (this.sheepExpenses.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="empty-message">No expenses recorded</td></tr>';
            return;
        }

        tableBody.innerHTML = this.sheepExpenses.map(expense => `
            <tr>
                <td>${this.escapeHtml(expense.festivalName)}</td>
                <td>₹${expense.amount.toLocaleString()}</td>
                <td>${expense.sheepCount}</td>
                <td>
                    <button class="btn btn-danger" onclick="window.fundManager.deleteSheepExpenseAndRefresh(${expense.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Delete sheep expense and refresh UI
     * @param {number} id - Expense ID
     */
    deleteSheepExpenseAndRefresh(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.deleteSheepExpense(id);
            this.updateAllUI();
            this.showAlert('Expense deleted successfully!', 'success');
        }
    }

    /**
     * Toggle between chart and table view
     */
    toggleTableView() {
        const tableSection = document.getElementById('tableSection');
        const toggleBtn = document.getElementById('toggleTableBtn');

        if (tableSection.style.display === 'none') {
            tableSection.style.display = 'block';
            toggleBtn.textContent = 'View as Chart';
        } else {
            tableSection.style.display = 'none';
            toggleBtn.textContent = 'View as Table';
        }
    }

    /**
     * Initialize the chart
     */
    initializeChart() {
        const canvas = document.getElementById('contributionChart');
        if (!canvas) return;

        this.chartContext = canvas.getContext('2d');
        this.updateChart();
    }

    /**
     * Update the chart with current data
     */
    updateChart() {
        const canvas = document.getElementById('contributionChart');
        if (!canvas || this.contributions.length === 0) return;

        const ctx = this.chartContext;
        const months = this.contributions.map(c => c.monthName);
        const amounts = this.contributions.map(c => c.collectedAmount);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Chart dimensions
        const padding = 60;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;

        // Find max value for scaling
        const maxValue = Math.max(...amounts);
        const scale = chartHeight / (maxValue * 1.1);

        // Draw grid and axes
        this.drawChartAxes(ctx, padding, chartWidth, chartHeight);

        // Draw bars
        this.drawChartBars(ctx, months, amounts, padding, chartWidth, chartHeight, scale, maxValue);

        // Draw labels
        this.drawChartLabels(ctx, months, amounts, padding, chartWidth, chartHeight, scale, maxValue);
    }

    /**
     * Draw chart axes
     */
    drawChartAxes(ctx, padding, chartWidth, chartHeight) {
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.stroke();

        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();
    }

    /**
     * Draw chart bars
     */
    drawChartBars(ctx, months, amounts, padding, chartWidth, chartHeight, scale, maxValue) {
        const barWidth = chartWidth / (months.length * 1.5);
        const spacing = chartWidth / months.length;

        amounts.forEach((amount, index) => {
            const barHeight = amount * scale;
            const x = padding + index * spacing + spacing / 2 - barWidth / 2;
            const y = padding + chartHeight - barHeight;

            // Draw bar
            ctx.fillStyle = '#667eea';
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw hover effect (optional)
            ctx.strokeStyle = '#5568d3';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);
        });
    }

    /**
     * Draw chart labels
     */
    drawChartLabels(ctx, months, amounts, padding, chartWidth, chartHeight, scale, maxValue) {
        const spacing = chartWidth / months.length;

        // X-axis labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        months.forEach((month, index) => {
            const x = padding + index * spacing + spacing / 2;
            const y = padding + chartHeight + 20;
            ctx.fillText(month.substring(0, 3), x, y);
        });

        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxValue / 5) * i);
            const y = padding + chartHeight - (chartHeight / 5) * i;
            ctx.fillText(`₹${value}`, padding - 10, y + 5);
        }
    }

    /**
     * Show alert message
     * @param {string} message - Message to show
     * @param {string} type - Type of alert (success, error)
     */
    showAlert(message, type) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `${type}-message`;
        alertDiv.textContent = message;

        // Insert after summary section
        const summarySection = document.querySelector('.summary-section');
        if (summarySection) {
            summarySection.appendChild(alertDiv);

            // Remove after 3 seconds
            setTimeout(() => {
                alertDiv.remove();
            }, 3000);
        }
    }

    /**
     * Escape HTML special characters for safety
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
