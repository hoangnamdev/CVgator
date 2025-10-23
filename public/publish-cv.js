// Publish CV page functionality
let userPosts = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserPosts();
    setupFormSubmission();
});

function checkAuthentication() {
    const user = sessionStorage.getItem('user');
    if (!user) {
        alert('You need to login in order to publish your CV!');
        window.location.href = '/';
        return;
    }
}

async function loadUserPosts() {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) {
            console.error('No user found in session');
            return;
        }

        const response = await fetch('/api/user-posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: user.id })
        });
        
        const data = await response.json();
        
        if (data.success) {
            userPosts = data.posts;
            populateCVSelect();
        } else {
            console.error('Error loading user posts:', data.message);
        }
    } catch (error) {
        console.error('Error fetching user posts:', error);
    }
}

function populateCVSelect() {
    const cvSelect = document.getElementById('cvSelect');
    
    if (userPosts.length === 0) {
        cvSelect.innerHTML = '<option value="">Upload your CV for review in the "Submissions" tab before attempting to publish!</option>';
        cvSelect.disabled = true;
        return;
    }
    
    cvSelect.innerHTML = '<option value="">Select CV</option>';
    
    userPosts.forEach(post => {
        const option = document.createElement('option');
        option.value = post._id;
        option.textContent = post.title;
        cvSelect.appendChild(option);
    });
}

function setupFormSubmission() {
    const form = document.getElementById('publishCvForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Prevent double submission
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;
        
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) {
            alert('You need to login in order to publish your CV!');
            window.location.href = '/';
            return;
        }
        
        const formData = new FormData(form);
        const data = {
            fullName: formData.get('fullName'),
            cvSelect: formData.get('cvSelect'),
            contactInfo: formData.get('contactInfo'),
            userId: user.id
        };
        
        console.log('Publishing CV with data:', data);
        
        // Disable button to prevent double submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publishing...';
        
        try {
            const response = await fetch('/api/publish-cv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            console.log('Publish CV response:', result);
            
            if (result.success) {
                alert('CV published successfully!');
                console.log('Redirecting to recruit page...');
                window.location.href = '/recruit';
            } else {
                alert('Error: ' + result.message);
                // Re-enable button on error
                submitBtn.disabled = false;
                submitBtn.textContent = 'Publish CV';
            }
        } catch (error) {
            console.error('Error publishing CV:', error);
            alert('An error occurred while publishing your CV. Please try again.');
            // Re-enable button on error
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publish CV';
        }
    });
}
