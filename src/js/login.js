// ===== LOGIN FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const roleEl = document.getElementById('role');
            const role = roleEl ? roleEl.value : 'customer';
            
            // Validation
            if (!username || !password) {
                alert('Please enter both username and password');
                return;
            }
            
            if (username.length < 3) {
                alert('Username must be at least 3 characters long');
                return;
            }
            
            // For this app both username and password should be the same "yourname"
            if (username !== password) {
                alert('Username and Password must match and be your name');
                return;
            }
            
            // Store username and redirect based on role
            setCurrentUsername(username);
            alert('Login successful! Welcome ' + username);
            if (role === 'cashier') {
                window.location.href = 'cashier.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }
});

// Helper function to set username
function setCurrentUsername(username) {
    localStorage.setItem('currentUsername', username);
}