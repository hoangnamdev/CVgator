// Upload page functionality
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupFileUpload();
    setupFormSubmission();
});

function checkAuthentication() {
    const user = sessionStorage.getItem('user');
    if (!user) {
        alert('You need to login in order to upload your CV!');
        window.location.href = '/';
        return;
    }
}

function setupFileUpload() {
    const attachBtn = document.getElementById('attachBtn');
    const cvFile = document.getElementById('cvFile');
    const disclaimerText = document.getElementById('disclaimerText');
    const fileError = document.getElementById('fileError');

    // Trigger file selection when button is clicked
    attachBtn.addEventListener('click', function() {
        cvFile.click();
    });

    // Handle file selection
    cvFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (file) {
            // Check if file is PDF
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                // Valid PDF file
                disclaimerText.textContent = file.name;
                fileError.style.display = 'none';
                
                // Update button text to show file is selected
                attachBtn.innerHTML = `📎 ${file.name}`;
                attachBtn.style.background = '#e8f5e8';
                attachBtn.style.color = '#2d5a2d';
                attachBtn.style.borderColor = '#2d5a2d';
            } else {
                // Invalid file type
                fileError.style.display = 'block';
                disclaimerText.textContent = 'DISCLAIMER: CVs must be in .pdf format.';
                
                // Reset button
                attachBtn.innerHTML = '📎 Attach CV';
                attachBtn.style.background = '#f8f9fa';
                attachBtn.style.color = '#667eea';
                attachBtn.style.borderColor = '#667eea';
                
                // Clear the file input
                cvFile.value = '';
            }
        } else {
            // No file selected
            disclaimerText.textContent = 'DISCLAIMER: CVs must be in .pdf format.';
            fileError.style.display = 'none';
            
            // Reset button
            attachBtn.innerHTML = '📎 Attach CV';
            attachBtn.style.background = '#f8f9fa';
            attachBtn.style.color = '#667eea';
            attachBtn.style.borderColor = '#667eea';
        }
    });
}

function setupFormSubmission() {
    const uploadForm = document.getElementById('uploadForm');
    
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData();
        const title = document.getElementById('postTitle').value.trim();
        const hashtags = document.getElementById('hashtags').value.trim();
        const context = document.getElementById('context').value.trim();
        const cvFile = document.getElementById('cvFile').files[0];
        
        // Validate all fields
        if (!title) {
            alert('Please enter a post title.');
            return;
        }
        
        if (!hashtags) {
            alert('Please enter at least one hashtag.');
            return;
        }
        
        if (!context) {
            alert('Please provide context and description.');
            return;
        }
        
        if (!cvFile) {
            alert('Please attach a CV file.');
            return;
        }
        
        // Validate PDF file
        if (cvFile.type !== 'application/pdf' && !cvFile.name.toLowerCase().endsWith('.pdf')) {
            alert('Please upload a valid PDF file.');
            return;
        }
        
        // Check if user is logged in
        const user = sessionStorage.getItem('user');
        if (!user) {
            alert('Please log in to upload a CV.');
            return;
        }
        
        // Prepare form data
        const userData = JSON.parse(user);
        formData.append('title', title);
        formData.append('hashtags', hashtags);
        formData.append('context', context);
        formData.append('cvFile', cvFile);
        formData.append('authorName', userData.username);
        
        try {
            const response = await fetch('/api/upload-cv', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('CV uploaded successfully!');
                window.location.href = '/submissions';
            } else {
                alert(data.message || 'Failed to upload CV. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('An error occurred during upload. Please try again.');
        }
    });
}

// Helper function to format hashtags
function formatHashtags(hashtagsString) {
    return hashtagsString
        .split(' ')
        .filter(tag => tag.trim())
        .map(tag => '#' + tag.trim().replace('#', ''));
}
