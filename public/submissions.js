let allPosts = [];
let allHashtags = [];
let selectedHashtags = [];

// Load posts when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadPostsFromDatabase();
    loadPopularHashtags();
    checkSelectedHashtags();
});

async function loadPostsFromDatabase() {
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        
        if (data.success) {
            allPosts = data.posts;
            displayPosts(allPosts);
        } else {
            console.error('Error loading posts:', data.message);
            displayError('Failed to load posts');
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        displayError('Failed to load posts');
    }
}

function displayPosts(posts) {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';

    if (posts.length === 0) {
        postList.innerHTML = '<li class="post-item"><div class="post-title">No posts found</div></li>';
        return;
    }

    posts.forEach(post => {
        const postElement = createPostElement(post);
        postList.appendChild(postElement);
    });
}

function displayError(message) {
    const postList = document.getElementById('postList');
    postList.innerHTML = `<li class="post-item"><div class="post-title">${message}</div></li>`;
}

function createPostElement(post) {
    const li = document.createElement('li');
    li.className = 'post-item';
    li.onclick = () => openCVPost(post._id);

    // Format date from DDMMYY to a more readable format
    const formattedDate = formatDate(post.date);

    li.innerHTML = `
        <div class="post-title">${post.title}</div>
        <div class="post-meta">
            <span class="post-author">${post.name}</span>
            <span class="post-date">${formattedDate}</span>
        </div>
    `;

    return li;
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

function openCVPost(postId) {
    // Store the post ID in sessionStorage for the CV post page to use
    sessionStorage.setItem('currentPostId', postId);
    window.location.href = '/cv-post';
}


function filterPostsByHashtag(hashtag) {
    const filteredPosts = allPosts.filter(post => 
        post.tags && post.tags.some(tag => tag.toLowerCase().includes(hashtag.toLowerCase().replace('#', '')))
    );
    
    displayPosts(filteredPosts);
}

function showAllPosts() {
    displayPosts(allPosts);
}

async function loadPopularHashtags() {
    try {
        const response = await fetch('/api/hashtags/popular');
        const data = await response.json();
        
        if (data.success) {
            allHashtags = data.hashtags;
            displayPopularHashtags();
        }
    } catch (error) {
        console.error('Error loading popular hashtags:', error);
    }
}

function displayPopularHashtags() {
    const hashtagList = document.querySelector('.hashtag-list');
    hashtagList.innerHTML = '';

    allHashtags.forEach(hashtag => {
        const hashtagItem = document.createElement('li');
        hashtagItem.className = 'hashtag-item';
        
        const hashtagLink = document.createElement('a');
        hashtagLink.href = '#';
        hashtagLink.className = 'hashtag-link';
        hashtagLink.textContent = `#${hashtag.name}`;
        hashtagLink.dataset.hashtag = hashtag.name;
        
        hashtagLink.addEventListener('click', function(e) {
            e.preventDefault();
            toggleHashtagSelection(hashtag.name, hashtagLink);
        });
        
        hashtagItem.appendChild(hashtagLink);
        hashtagList.appendChild(hashtagItem);
    });
    
    // Add "View all +" link
    const viewAllItem = document.createElement('li');
    viewAllItem.className = 'hashtag-item';
    
    const viewAllLink = document.createElement('a');
    viewAllLink.href = '/hashtags';
    viewAllLink.className = 'hashtag-link';
    viewAllLink.style.color = '#999';
    viewAllLink.style.fontStyle = 'italic';
    viewAllLink.textContent = 'View all +';
    
    viewAllItem.appendChild(viewAllLink);
    hashtagList.appendChild(viewAllItem);
}

function toggleHashtagSelection(hashtagName, hashtagLink) {
    const index = selectedHashtags.indexOf(hashtagName);
    
    if (index > -1) {
        // Deselect hashtag
        selectedHashtags.splice(index, 1);
        hashtagLink.classList.remove('active');
    } else {
        // Select hashtag
        selectedHashtags.push(hashtagName);
        hashtagLink.classList.add('active');
    }
    
    updateSortButton();
}

function updateSortButton() {
    let sortBtn = document.getElementById('sortBtn');
    let clearBtn = document.getElementById('clearBtn');
    
    if (!sortBtn) {
        // Create sort button if it doesn't exist
        const hashtagSidebar = document.querySelector('.hashtag-sidebar');
        sortBtn = document.createElement('button');
        sortBtn.id = 'sortBtn';
        sortBtn.className = 'sort-btn';
        sortBtn.style.cssText = `
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
            transition: transform 0.2s ease;
        `;
        sortBtn.addEventListener('click', sortBySelectedTags);
        hashtagSidebar.appendChild(sortBtn);
        
        // Create clear selection button
        clearBtn = document.createElement('button');
        clearBtn.id = 'clearBtn';
        clearBtn.className = 'clear-btn';
        clearBtn.textContent = 'Clear Selection';
        clearBtn.style.cssText = `
            width: 100%;
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
            padding: 10px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
            transition: all 0.3s ease;
        `;
        clearBtn.addEventListener('click', clearSelection);
        hashtagSidebar.appendChild(clearBtn);
    }
    
    if (selectedHashtags.length > 0) {
        sortBtn.disabled = false;
        sortBtn.textContent = `Sort (${selectedHashtags.length})`;
        sortBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else {
        sortBtn.disabled = true;
        sortBtn.textContent = 'Sort';
        sortBtn.style.background = '#ccc';
    }
}

function sortBySelectedTags() {
    if (selectedHashtags.length === 0) {
        displayPosts(allPosts);
        return;
    }
    
    const filteredPosts = allPosts.filter(post => 
        post.tags && post.tags.some(tag => {
            const tagName = tag.replace('#', '');
            return selectedHashtags.includes(tagName);
        })
    );
    
    displayPosts(filteredPosts);
}

function checkSelectedHashtags() {
    const storedHashtags = sessionStorage.getItem('selectedHashtags');
    const autoSort = sessionStorage.getItem('autoSort');
    
    if (storedHashtags) {
        selectedHashtags = JSON.parse(storedHashtags);
        sessionStorage.removeItem('selectedHashtags'); // Clear after use
        
        // Highlight selected hashtags
        selectedHashtags.forEach(hashtagName => {
            const hashtagLink = document.querySelector(`[data-hashtag="${hashtagName}"]`);
            if (hashtagLink) {
                hashtagLink.classList.add('active');
            }
        });
        
        updateSortButton();
        
        // Auto-sort if coming from hashtags page
        if (autoSort === 'true') {
            sessionStorage.removeItem('autoSort'); // Clear after use
            sortBySelectedTags();
        }
    }
}

function clearSelection() {
    // Clear selected hashtags
    selectedHashtags = [];
    
    // Remove active class from all hashtag links
    document.querySelectorAll('.hashtag-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show all posts
    displayPosts(allPosts);
    
    // Update sort button
    updateSortButton();
}
