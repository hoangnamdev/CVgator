// Registration form handling
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Client-side validation
    if (!email || !username || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!validateEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    if (!validateUsername(username)) {
        alert('Username must be 3-20 characters long and contain only letters and numbers');
        return;
    }
    
    if (!validatePassword(password)) {
        alert('Password must be at least 6 characters long and contain only letters and numbers');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Registration successful! You can now login.');
            // Update navigation state
            if (window.navbar) {
                window.navbar.updateNavigationState();
            }
            window.location.href = '/';
        } else {
            alert(data.message || 'Registration failed. Please try again.');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration. Please try again.');
    }
});

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    return usernameRegex.test(username) && username.length >= 3 && username.length <= 20;
}

function validatePassword(password) {
    const passwordRegex = /^[a-zA-Z0-9]+$/;
    return passwordRegex.test(password) && password.length >= 6;
}
