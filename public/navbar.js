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

async function showUserProfile(navContainer, userData) {
    // Remove existing user profile or login button
    const existingLogin = navContainer.querySelector('.nav-login');
    const existingUser = navContainer.querySelector('.nav-user');
    
    if (existingLogin) existingLogin.remove();
    if (existingUser) existingUser.remove();
    
    // Fetch user profile picture
    let profilePicture = '/uploads/default-avatar.svg';
    try {
        const response = await fetch('/api/user-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: userData.id })
        });
        
        const data = await response.json();
        if (data.success && data.user.profilePicture) {
            profilePicture = data.user.profilePicture;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
    
    // Create user profile section
    const userSection = document.createElement('div');
    userSection.className = 'nav-user';
    
    // Use profile picture if available, otherwise fall back to initials
    const avatarHtml = profilePicture && profilePicture !== '/uploads/default-avatar.svg' 
        ? `<img src="${profilePicture}" alt="${userData.username}" class="user-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="user-avatar" style="display: none;">${userData.username.charAt(0).toUpperCase()}</div>`
        : `<div class="user-avatar">${userData.username.charAt(0).toUpperCase()}</div>`;
    
    userSection.innerHTML = `
        ${avatarHtml}
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
