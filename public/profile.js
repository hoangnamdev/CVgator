// Profile page functionality
let originalUsername = '';
let originalProfilePicture = '';
let hasChanges = false;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserProfile();
    loadPublishedCV();
    loadUserPosts();
    setupEventListeners();
});

function checkAuthentication() {
    const user = sessionStorage.getItem('user');
    if (!user) {
        alert('You need to login to access your profile!');
        window.location.href = '/';
        return;
    }
}

async function loadUserProfile() {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const response = await fetch('/api/user-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: user.id })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const userData = data.user;
            originalUsername = userData.username;
            originalProfilePicture = userData.profilePicture || '/uploads/default-avatar.png';
            
            document.getElementById('username').value = userData.username;
            document.getElementById('profilePicture').src = userData.profilePicture || '/uploads/default-avatar.png';
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function loadPublishedCV() {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const response = await fetch('/api/user-recruit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: user.id })
        });
        
        const data = await response.json();
        const content = document.getElementById('publishedCvContent');
        
        if (data.success && data.recruit) {
            const recruit = data.recruit;
            content.innerHTML = `
                <div class="published-cv-item">
                    <div class="cv-info">
                        <h3>${recruit.name}</h3>
                        <p>Published on ${new Date(recruit.publishedAt).toLocaleDateString()}</p>
                    </div>
                    <button class="delete-btn" onclick="deletePublishedCV('${recruit._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="no-content">
                    <p>You haven't published any CV yet.</p>
                    <a href="/publish-cv" class="publish-link">Publish your CV</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading published CV:', error);
    }
}

async function loadUserPosts() {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const response = await fetch('/api/user-posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: user.id })
        });
        
        const data = await response.json();
        const content = document.getElementById('postsContent');
        
        if (data.success && data.posts.length > 0) {
            const postsHtml = data.posts.map(post => `
                <div class="post-item">
                    <div class="post-info">
                        <h3>${post.title}</h3>
                        <p>Uploaded on ${new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button class="delete-btn" onclick="deletePost('${post._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `).join('');
            
            content.innerHTML = postsHtml;
        } else {
            content.innerHTML = `
                <div class="no-content">
                    <p>You haven't uploaded any CVs yet.</p>
                    <a href="/upload" class="upload-link">Upload your first CV</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading user posts:', error);
    }
}

function setupEventListeners() {
    // Username change detection
    const usernameInput = document.getElementById('username');
    usernameInput.addEventListener('input', checkForChanges);
    
    // Profile picture change
    const changePictureBtn = document.getElementById('changePictureBtn');
    const profilePictureInput = document.getElementById('profilePictureInput');
    
    changePictureBtn.addEventListener('click', () => {
        profilePictureInput.click();
    });
    
    profilePictureInput.addEventListener('change', handleProfilePictureChange);
    
    // Save button
    const saveBtn = document.getElementById('saveProfileBtn');
    saveBtn.addEventListener('click', saveProfile);
    
    // Delete account button
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    deleteAccountBtn.addEventListener('click', deleteAccount);
}

function checkForChanges() {
    const usernameInput = document.getElementById('username');
    const currentUsername = usernameInput.value;
    const currentProfilePicture = document.getElementById('profilePicture').src;
    
    hasChanges = (currentUsername !== originalUsername) || 
                 (currentProfilePicture !== originalProfilePicture);
    
    const saveBtn = document.getElementById('saveProfileBtn');
    if (hasChanges) {
        saveBtn.classList.remove('disabled');
    } else {
        saveBtn.classList.add('disabled');
    }
}

function handleProfilePictureChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (3MB limit)
    if (file.size > 3 * 1024 * 1024) {
        alert('Image size must be less than 3MB. Please choose a smaller image.');
        return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
        return;
    }
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('profilePicture').src = e.target.result;
        checkForChanges();
    };
    reader.readAsDataURL(file);
}

async function saveProfile() {
    if (!hasChanges) return;
    
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const username = document.getElementById('username').value.trim();
        const profilePictureInput = document.getElementById('profilePictureInput');
        
        if (!username) {
            alert('Username cannot be empty.');
            return;
        }
        
        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('username', username);
        
        if (profilePictureInput.files[0]) {
            formData.append('profilePicture', profilePictureInput.files[0]);
        }
        
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Profile updated successfully!');
            
            // Update session storage
            const updatedUser = { ...user, username: username };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update original values
            originalUsername = username;
            originalProfilePicture = document.getElementById('profilePicture').src;
            hasChanges = false;
            
            // Update save button
            document.getElementById('saveProfileBtn').classList.add('disabled');
            
            // Reload navbar to update username display
            if (window.loadNavbar) {
                window.loadNavbar();
            }
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('An error occurred while saving your profile. Please try again.');
    }
}

async function deletePublishedCV(recruitId) {
    if (!confirm('Are you sure you want to delete your published CV? This will remove it from the hiring pool.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete-recruit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recruitId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Published CV deleted successfully!');
            loadPublishedCV(); // Reload the published CV section
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting published CV:', error);
        alert('An error occurred while deleting your published CV. Please try again.');
    }
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this CV post? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ postId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('CV post deleted successfully!');
            loadUserPosts(); // Reload the posts section
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('An error occurred while deleting the CV post. Please try again.');
    }
}

function deleteAccount() {
    const password = prompt(`CAUTION: You are attempting to delete your user account. This will delete all of your submissions and remove your published CV from the hiring pool. Please confirm your action by entering your password.`);
    
    if (password === null) return; // User cancelled
    
    if (!password) {
        alert('Password is required.');
        return;
    }
    
    // Confirm deletion
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data.')) {
        return;
    }
    
    deleteUserAccount(password);
}

async function deleteUserAccount(password) {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const response = await fetch('/api/delete-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                userId: user.id, 
                password: password 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Account deleted successfully. You will now be logged out.');
            
            // Clear session storage
            sessionStorage.removeItem('user');
            
            // Redirect to login page
            window.location.href = '/';
        } else {
            if (data.message === 'Incorrect password') {
                alert('Incorrect password');
            } else {
                alert('Error: ' + data.message);
            }
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('An error occurred while deleting your account. Please try again.');
    }
}
