// Check if user is already logged in and redirect to submissions page
document.addEventListener('DOMContentLoaded', function() {
    const user = sessionStorage.getItem('user');
    if (user) {
        // User is already logged in, redirect to submissions page
        window.location.href = '/submissions';
        return;
    }
});

// Login form handling
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Client-side validation
    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user data in sessionStorage for later use
            sessionStorage.setItem('user', JSON.stringify(data.user));
            alert('Login successful!');
            // Update navigation state
            if (window.navbar) {
                window.navbar.updateNavigationState();
            }
            // Redirect to submissions page
            window.location.href = '/submissions';
        } else {
            alert(data.message || 'Login failed. Please check your credentials.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
});

// Form validation helpers
function validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    return usernameRegex.test(username) && username.length >= 3 && username.length <= 20;
}

function validatePassword(password) {
    const passwordRegex = /^[a-zA-Z0-9]+$/;
    return passwordRegex.test(password) && password.length >= 6;
}
