// ===== TAB FUNCTIONALITY FOR DASHBOARD =====

document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            // Load transactions if switching to second tab
            if (tabName === 'deposit-withdraw-tab') {
                loadTransactions();
            }
        });
    });

    // Load transactions when page loads
    loadTransactions();
});

// Function to load and display transactions
function loadTransactions() {
    const transactionList = document.getElementById('transactionList');
    if (!transactionList) return;

    const transactions = getTransactions();

    if (transactions.length === 0) {
        transactionList.innerHTML = '<p class="no-transactions">No transactions yet</p>';
        return;
    }
    transactionList.innerHTML = transactions.map(txn => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-type">${txn.type || 'Transfer'}</div>
                <div class="transaction-date">${txn.timestamp}</div>
                <div class="transaction-token">Token: ${txn.token || ''}</div>
            </div>
            <div class="transaction-amount">${formatCurrency(txn.amount)}</div>
            <div class="transaction-status ${txn.status ? txn.status.toLowerCase() : 'completed'}">
                ${txn.status || 'Completed'}
            </div>
            ${txn.status !== 'Cancelled' ? `<button class="btn btn-secondary btn-small" onclick="cancelTransactionUI('${txn.id}')">Cancel</button>` : ''}
        </div>
    `).join('');
}

// Cancel transaction from UI
function cancelTransactionUI(transactionId) {
    if (confirm('Are you sure you want to cancel this transaction?')) {
        cancelTransaction(transactionId);
        loadTransactions();
        alert('Transaction cancelled successfully');
    }
}

// Helper function from app.js (fallback)
function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions') || '[]');
}

function formatCurrency(amount) {
    return '₹' + parseInt(amount).toLocaleString('en-IN');
}

function cancelTransaction(transactionId) {
    let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions = transactions.map(t => {
        if (t.id === transactionId) {
            t.status = 'Cancelled';
        }
        return t;
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));
}