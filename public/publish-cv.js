// Publish CV page functionality
let userPosts = [];

document.addEventListener('DOMContentLoaded', function() {
    loadUserPosts();
    setupFormSubmission();
});

async function loadUserPosts() {
    try {
        const response = await fetch('/api/user-posts');
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
        
        const formData = new FormData(form);
        const data = {
            fullName: formData.get('fullName'),
            cvSelect: formData.get('cvSelect'),
            contactInfo: formData.get('contactInfo')
        };
        
        try {
            const response = await fetch('/api/publish-cv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('CV published successfully!');
                window.location.href = '/recruit';
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error publishing CV:', error);
            alert('An error occurred while publishing your CV. Please try again.');
        }
    });
}
