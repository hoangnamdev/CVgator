// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    updateNavigationState();
    setupDropdownMenu();
});

function updateNavigationState() {
    const user = sessionStorage.getItem('user');
    const navContainer = document.querySelector('.nav-container');
    
    if (user) {
        // User is logged in - show user profile
        const userData = JSON.parse(user);
        showUserProfile(navContainer, userData);
    } else {
        // User is not logged in - show login button
        showLoginButton(navContainer);
    }
}

function showLoginButton(navContainer) {
    // Remove existing user profile or login button
    const existingLogin = navContainer.querySelector('.nav-login');
    const existingUser = navContainer.querySelector('.nav-user');
    
    if (existingLogin) existingLogin.remove();
    if (existingUser) existingUser.remove();
    
    // Add login button
    const loginButton = document.createElement('a');
    loginButton.href = '/';
    loginButton.className = 'nav-login';
    loginButton.textContent = 'Login';
    
    navContainer.appendChild(loginButton);
}

function showUserProfile(navContainer, userData) {
    // Remove existing user profile or login button
    const existingLogin = navContainer.querySelector('.nav-login');
    const existingUser = navContainer.querySelector('.nav-user');
    
    if (existingLogin) existingLogin.remove();
    if (existingUser) existingUser.remove();
    
    // Create user profile section
    const userSection = document.createElement('div');
    userSection.className = 'nav-user';
    userSection.innerHTML = `
        <div class="user-avatar">${userData.username.charAt(0).toUpperCase()}</div>
        <span class="user-name">${userData.username}</span>
        <div class="user-dropdown">
            <a href="/profile" class="dropdown-item">Profile</a>
            <a href="#" class="dropdown-item logout" id="logoutBtn">Logout</a>
        </div>
    `;
    
    navContainer.appendChild(userSection);
}

function setupDropdownMenu() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.querySelector('.user-dropdown');
        const userSection = document.querySelector('.nav-user');
        
        if (dropdown && userSection && !userSection.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Toggle dropdown when clicking on user section
    document.addEventListener('click', function(e) {
        const userSection = document.querySelector('.nav-user');
        const dropdown = document.querySelector('.user-dropdown');
        
        if (userSection && dropdown && userSection.contains(e.target) && !e.target.classList.contains('dropdown-item')) {
            dropdown.classList.toggle('show');
        }
    });
    
    // Handle logout
    document.addEventListener('click', function(e) {
        if (e.target.id === 'logoutBtn') {
            e.preventDefault();
            logout();
        }
    });
}

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = '/';
}

// Export functions for use in other scripts
window.navbar = {
    updateNavigationState,
    showLoginButton,
    showUserProfile,
    logout
};
