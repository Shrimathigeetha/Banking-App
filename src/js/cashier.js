document.addEventListener('DOMContentLoaded', function() {
    const openQueueBtn = document.getElementById('openQueueBtn');
    const queueSection = document.getElementById('queueSection');
    const tabButtons = document.querySelectorAll('.tabs .tab-button');
    if (openQueueBtn) {
        openQueueBtn.addEventListener('click', function() {
            // Open the queue as a fresh page in a new tab so the button remains visible on the original page
            const url = window.location.pathname + '?queue=1';
            window.open(url, '_blank');
        });
    }
    // If page loaded with ?queue=1, show the queue immediately (fresh page behavior)
    const params = new URLSearchParams(window.location.search);
    if (params.get('queue') === '1') {
        queueSection.style.display = 'block';
        loadPendingTokens();
        loadAudit();
    }
    // Simple tab handling for Tokens / Audit
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            // remove active from all tab buttons in this page
            document.querySelectorAll('.tabs .tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#queueSection > .tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const target = document.getElementById(tabName);
            if (target) target.classList.add('active');

            if (tabName === 'tokens-tab') loadPendingTokens();
            if (tabName === 'audit-tab') loadAudit();
        });
    });

    // Modal buttons
    const authorizeBtn = document.getElementById('authorizeBtn');
    const closeProcBtn = document.getElementById('closeProcBtn');
    const sendSmsBtn = document.getElementById('sendSmsBtn');
    const sendEmailBtn = document.getElementById('sendEmailBtn');

    if (closeProcBtn) closeProcBtn.addEventListener('click', () => document.getElementById('processModal').style.display = 'none');
    if (sendSmsBtn) sendSmsBtn.addEventListener('click', () => alert('SMS sent (placeholder)'));
    if (sendEmailBtn) sendEmailBtn.addEventListener('click', () => alert('Email sent (placeholder)'));

    if (authorizeBtn) authorizeBtn.addEventListener('click', function() {
        const currentId = this.getAttribute('data-current-id');
        if (!currentId) return;
        markTransactionCompleted(currentId);
        document.getElementById('processModal').style.display = 'none';
        loadPendingTokens();
        loadAudit();
        alert('Transaction authorised and closed');
    });
});

function loadPendingTokens() {
    const tokensList = document.getElementById('tokensList');
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const pending = transactions.filter(t => t.status === 'Pending');

    if (!tokensList) return;
    if (pending.length === 0) {
        tokensList.innerHTML = '<p>No pending tokens</p>';
        return;
    }

    tokensList.innerHTML = pending.map(t => `
        <div class="token-item">
            <div><strong>Token:</strong> <a href="#" onclick="openProcess('${t.id}');return false;">${t.token}</a></div>
            <div><strong>Type:</strong> ${t.type}</div>
            <div><strong>Amount:</strong> ₹${parseInt(t.amount).toLocaleString('en-IN')}</div>
            <div style="margin-top:8px;"><button class="btn btn-primary" onclick="openProcess('${t.id}')">Open</button></div>
        </div>
    `).join('');
}

function openProcess(id) {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const procDetails = document.getElementById('procDetails');
    const procTitle = document.getElementById('procTitle');
    const authorizeBtn = document.getElementById('authorizeBtn');

    procTitle.textContent = `Process Token ${tx.token}`;
    procDetails.innerHTML = `
        <p><strong>Name:</strong> ${tx.name || ''}</p>
        <p><strong>Account:</strong> ${tx.account || ''}</p>
        <p><strong>IFSC:</strong> ${tx.ifsc || ''}</p>
        <p><strong>Branch:</strong> ${tx.branch || ''}</p>
        <p><strong>Mobile:</strong> ${tx.mobile || ''}</p>
        <p><strong>Email:</strong> ${tx.email || ''}</p>
        <p><strong>Type:</strong> ${tx.type}</p>
        <p><strong>Amount:</strong> ₹${parseInt(tx.amount).toLocaleString('en-IN')}</p>
        <p><strong>Amount (words):</strong> ${tx.amountInWords || ''}</p>
    `;

    authorizeBtn.setAttribute('data-current-id', id);
    document.getElementById('processModal').style.display = 'flex';
}

function markTransactionCompleted(transactionId) {
    let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions = transactions.map(t => {
        if (t.id === transactionId) t.status = 'Completed';
        return t;
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadAudit() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

    // Determine selected date from date picker if present, else today
    const dateInput = document.getElementById('auditDate');
    let selectedDate = '';
    if (dateInput && dateInput.value) {
        selectedDate = dateInput.value; // yyyy-mm-dd
    } else {
        const d = new Date();
        selectedDate = d.toISOString().slice(0,10);
    }

    // Filter transactions for selected date (use transaction.date if available)
    const todays = transactions.filter(t => t.date === selectedDate || (t.timestamp && t.timestamp.includes(new Date(selectedDate).toLocaleDateString())));

    const depositTx = todays.filter(t => t.type && t.type.toLowerCase().includes('deposit'));
    const withdrawTx = todays.filter(t => t.type && t.type.toLowerCase().includes('withdraw'));

    const totalDeposits = depositTx.length;
    const totalWithdrawals = withdrawTx.length;

    const sumDeposited = depositTx.reduce((s, x) => s + (parseInt(x.amount) || 0), 0);
    const sumWithdrawn = withdrawTx.reduce((s, x) => s + (parseInt(x.amount) || 0), 0);

    const remaining = sumDeposited - sumWithdrawn;

    // Denominations to report (include common INR notes)
    const denoms = [1,2,5,10,20,50,100,200,500,2000];
    const depositNotes = {};
    const withdrawNotes = {};
    denoms.forEach(d => { depositNotes[d]=0; withdrawNotes[d]=0; });

    depositTx.forEach(tx => {
        if (tx.notesCounts) {
            Object.keys(tx.notesCounts).forEach(k => {
                const denom = parseInt(k);
                depositNotes[denom] = (depositNotes[denom] || 0) + (parseInt(tx.notesCounts[k]) || 0);
            });
        }
    });

    withdrawTx.forEach(tx => {
        if (tx.notesCounts) {
            Object.keys(tx.notesCounts).forEach(k => {
                const denom = parseInt(k);
                withdrawNotes[denom] = (withdrawNotes[denom] || 0) + (parseInt(tx.notesCounts[k]) || 0);
            });
        }
    });

    // Build report HTML with date picker and two-column notes table (show counts + calculated value)
    const depositLines = denoms.map(d => {
        const cnt = depositNotes[d] || 0;
        const val = (cnt * d).toLocaleString('en-IN');
        return `<div><strong>₹${d}:</strong> ${cnt} notes — ₹${val}</div>`;
    }).join('');
    const withdrawLines = denoms.map(d => {
        const cnt = withdrawNotes[d] || 0;
        const val = (cnt * d).toLocaleString('en-IN');
        return `<div><strong>₹${d}:</strong> ${cnt} notes — ₹${val}</div>`;
    }).join('');

    const report = `
        <div style="margin-bottom:12px;"><label><strong>Date:</strong> <input type="date" id="auditDate" value="${selectedDate}"></label></div>
        <p><strong>Total no of deposits:</strong> ${totalDeposits}</p>
        <p><strong>Total no of withdrawals:</strong> ${totalWithdrawals}</p>
        <p><strong>Total Amount Deposited:</strong> ₹${sumDeposited.toLocaleString('en-IN')}</p>
        <p><strong>Total Amount Withdrawn:</strong> ₹${sumWithdrawn.toLocaleString('en-IN')}</p>
        <p><strong>Remaining amount:</strong> ₹${remaining.toLocaleString('en-IN')}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:15px;">
            <div>
                <h3>Deposit - No of Notes (count — value)</h3>
                ${depositLines}
            </div>
            <div>
                <h3>Withdraw - No of Notes (count — value)</h3>
                ${withdrawLines}
            </div>
        </div>
    `;

    const auditReport = document.getElementById('auditReport');
    if (auditReport) {
        auditReport.innerHTML = report;
        // Attach listener to date picker to reload audit on change
        const dp = document.getElementById('auditDate');
        if (dp) dp.addEventListener('change', loadAudit);
    }
}
