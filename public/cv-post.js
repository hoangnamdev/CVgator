// CV Post page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadCVPost();
    loadComments();
});

async function loadCVPost() {
    const postId = sessionStorage.getItem('currentPostId');
    if (!postId) {
        // If no post ID, redirect back to submissions
        window.location.href = '/submissions';
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}`);
        const data = await response.json();
        
        if (data.success) {
            const post = data.post;
            displayCVPost(post);
        } else {
            console.error('Error loading post:', data.message);
            alert('Failed to load CV post');
            window.location.href = '/submissions';
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        alert('Failed to load CV post');
        window.location.href = '/submissions';
    }
}

function displayCVPost(post) {
    // Update title and meta information
    document.getElementById('cvTitle').textContent = post.title;
    document.getElementById('cvAuthor').textContent = post.name;
    
    // Format date from DDMMYY to readable format
    const formattedDate = formatDate(post.date);
    document.getElementById('cvDate').textContent = formattedDate;
    
    // Update context section
    const contextSection = document.getElementById('contextSection');
    if (post.text && post.text.trim()) {
        contextSection.innerHTML = `
            <h3>Context & Additional Information</h3>
            <p>${post.text}</p>
        `;
    } else {
        contextSection.innerHTML = `
            <h3>Context & Additional Information</h3>
            <p><em>No additional context provided by the author.</em></p>
        `;
    }
    
    // Update CV link or show placeholder
    const cvLink = document.getElementById('cvLink');
    const cvDocumentContent = document.getElementById('cvDocumentContent');
    
    if (post.link && post.link !== 'Placeholder') {
        cvLink.href = post.link;
        cvLink.textContent = 'View CV';
        cvLink.style.display = 'inline-block';
        cvLink.target = '_blank'; // Open in new tab
        
        // Update the CV view section with proper link
        cvDocumentContent.innerHTML = `
            <div class="cv-icon">📄</div>
            <h3>CV Document</h3>
            <p>Click the button below to view the full CV</p>
            <a href="${post.link}" id="cvLink" class="view-cv-btn" target="_blank" download="CV.pdf">View CV</a>
        `;
    } else {
        cvDocumentContent.innerHTML = `
            <div class="cv-icon">📄</div>
            <h3>CV Document</h3>
            <p>This is a placeholder CV document. The actual CV will be available once uploaded.</p>
            <em style="color: #999; font-style: italic;">No CV available</em>
        `;
    }
}

function formatDate(dateString) {
    // Convert DDMMYY format to readable format
    if (dateString && dateString.length === 6) {
        const day = dateString.substring(0, 2);
        const month = dateString.substring(2, 4);
        const year = '20' + dateString.substring(4, 6);
        return `${day}/${month}/${year}`;
    }
    return dateString || 'Unknown date';
}

async function loadComments() {
    const postId = sessionStorage.getItem('currentPostId');
    if (!postId) return;

    try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        const data = await response.json();
        
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '';

        if (data.success && data.comments.length > 0) {
            data.comments.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentsList.appendChild(commentElement);
            });
        } else {
            commentsList.innerHTML = '<p style="color: #666; font-style: italic;">No comments yet. Be the first to provide feedback!</p>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '<p style="color: #e74c3c;">Error loading comments. Please try again later.</p>';
    }
}

function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment';
    div.style.cssText = `
        background: #f9f9f9;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        border-left: 3px solid #667eea;
    `;

    // Format the date
    const formattedDate = new Date(comment.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #333;">${comment.authorName}</strong>
            <span style="color: #999; font-size: 0.9em;">${formattedDate}</span>
        </div>
        <p style="color: #555; line-height: 1.5;">${comment.content}</p>
    `;

    return div;
}

// Handle comment submission
document.getElementById('commentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const commentText = document.getElementById('commentText').value.trim();
    if (!commentText) {
        alert('Please enter a comment before submitting.');
        return;
    }

    // Check if user is logged in
    const user = sessionStorage.getItem('user');
    if (!user) {
        alert('Login in order to participate in discussion!');
        return;
    }

    const userData = JSON.parse(user);
    const postId = sessionStorage.getItem('currentPostId');
    if (!postId) {
        alert('Post not found.');
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: commentText,
                authorName: userData.username,
                authorId: userData._id || userData.id
            })
        });

        const data = await response.json();

        if (data.success) {
            // Clear the form
            document.getElementById('commentText').value = '';
            
            // Reload comments to show the new one
            loadComments();
        } else {
            alert(data.message || 'Failed to post comment. Please try again.');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
    }
});

// Back to submissions button functionality
function goBackToSubmissions() {
    window.location.href = '/submissions';
}
