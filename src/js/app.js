// ===== GLOBAL APPLICATION FUNCTIONS =====

// Initialize current date
function initializeDate() {
    const dateInput = document.getElementById('currentDate');
    if (dateInput) {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateInput.value = today.toLocaleDateString('en-US', options);
    }
}

// Get current username from localStorage
function getCurrentUsername() {
    return localStorage.getItem('currentUsername') || '';
}

// Set current username in localStorage
function setCurrentUsername(username) {
    localStorage.setItem('currentUsername', username);
}

// Format amount to INR currency
function formatCurrency(amount) {
    return '₹' + parseInt(amount).toLocaleString('en-IN');
}

// Convert number to words (Indian Rupees format)
function numberToWords(num) {
    if (num === 0) return 'Zero Rupees Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const scales = ['', 'Thousand', 'Lakh', 'Crore', 'Arab', 'Kharab'];

    function convertGroup(n) {
        let words = '';
        
        if (n >= 100) {
            words += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        
        if (n >= 20) {
            words += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        } else if (n >= 10) {
            words += teens[n - 10] + ' ';
            n = 0;
        }
        
        if (n > 0) {
            words += ones[n] + ' ';
        }
        
        return words.trim();
    }

    let words = '';
    let groupIndex = 0;
    
    // Handle in groups of 2 digits for British system (except first group which is 3 digits)
    let groups = [];
    if (num >= 1000) {
        // Get the last 3 digits
        groups.push(num % 1000);
        num = Math.floor(num / 1000);
        
        // Get remaining groups of 2 digits
        while (num > 0) {
            groups.push(num % 100);
            num = Math.floor(num / 100);
        }
    } else {
        groups.push(num);
    }

    // Process groups in reverse order
    for (let i = groups.length - 1; i >= 0; i--) {
        if (groups[i] !== 0) {
            let groupWords = convertGroup(groups[i]);
            
            if (i > 0 && scales[i]) {
                groupWords += ' ' + scales[i];
            }
            
            if (words.length > 0) {
                words += ' ' + groupWords;
            } else {
                words = groupWords;
            }
        }
    }

    return (words.trim() || 'Zero') + ' Rupees Only';
}

// Generate token number
// Generate token number between 101 and 999 (sequential)
function generateTokenNumber() {
    let counter = parseInt(localStorage.getItem('tokenCounter') || '100', 10);
    counter++;
    if (counter > 999) counter = 101;
    localStorage.setItem('tokenCounter', counter.toString());
    return counter.toString();
}

// Save transaction to localStorage
function saveTransaction(transaction) {
    let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    // If transaction already has a token, use it; otherwise generate
    const token = transaction.token || generateTokenNumber();
    transaction.token = token;
    transaction.id = token + '-' + Date.now();
    transaction.timestamp = new Date().toLocaleString();
    // Default status for customer-submitted txns is Pending for cashier processing
    transaction.status = transaction.status || 'Pending';
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    return transaction.id;
}

// Get all transactions
function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions') || '[]');
}

// Load username on page load
function loadUsernameOnPage() {
    const username = getCurrentUsername();
    const welcomeElement = document.getElementById('welcomeUsername');
    const nameInput = document.getElementById('name');
    
    if (welcomeElement) {
        welcomeElement.textContent = username;
    }
    
    if (nameInput) {
        nameInput.value = username;
    }
}

// Cancel transaction
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDate();
    loadUsernameOnPage();
});