let allPosts = [];
let allHashtags = [];
let selectedHashtags = [];

// Pagination variables
let currentPage = 1;
let postsPerPage = 20; // Default for desktop
let filteredPosts = [];

// Load posts when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set posts per page based on screen size
    setPostsPerPage();
    
    loadPostsFromDatabase();
    loadPopularHashtags();
    checkSelectedHashtags();
    setupPaginationControls();
    setupSortButton();
    
    // Update posts per page on window resize
    window.addEventListener('resize', setPostsPerPage);
});

function setPostsPerPage() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) {
        postsPerPage = 10; // Mobile
    } else if (screenWidth <= 768) {
        postsPerPage = 15; // Tablet
    } else {
        postsPerPage = 20; // Desktop
    }
}

async function loadPostsFromDatabase() {
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        
        if (data.success) {
            allPosts = data.posts;
            filteredPosts = [...allPosts]; // Start with all posts
            displayPosts();
        } else {
            console.error('Error loading posts:', data.message);
            displayError('Failed to load posts');
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        displayError('Failed to load posts');
    }
}

function displayPosts() {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';

    if (filteredPosts.length === 0) {
        postList.innerHTML = '<li class="post-item"><div class="post-title">No posts found</div></li>';
        updatePaginationControls();
        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = Math.min(startIndex + postsPerPage, filteredPosts.length);
    
    // Get posts for current page
    const postsToShow = filteredPosts.slice(startIndex, endIndex);

    postsToShow.forEach(post => {
        const postElement = createPostElement(post);
        postList.appendChild(postElement);
    });
    
    updatePaginationControls();
}

function updatePaginationControls() {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const paginationInfo = document.getElementById('paginationInfo');
    
    // Update button states
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    // Update pagination info
    if (filteredPosts.length === 0) {
        paginationInfo.textContent = 'No posts';
    } else {
        const startIndex = (currentPage - 1) * postsPerPage + 1;
        const endIndex = Math.min(currentPage * postsPerPage, filteredPosts.length);
        paginationInfo.textContent = `Page ${currentPage} of ${totalPages} (${startIndex}-${endIndex} of ${filteredPosts.length})`;
    }
    
    // Hide pagination if only one page
    const paginationContainer = document.getElementById('paginationContainer');
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
    } else {
        paginationContainer.style.display = 'flex';
    }
}

function setupPaginationControls() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayPosts();
            // Scroll to top of posts
            document.getElementById('postList').scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayPosts();
            // Scroll to top of posts
            document.getElementById('postList').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

function displayError(message) {
    const postList = document.getElementById('postList');
    postList.innerHTML = `<li class="post-item"><div class="post-title">${message}</div></li>`;
    updatePaginationControls();
}

function createPostElement(post) {
    const postItem = document.createElement('li');
    postItem.className = 'post-item clickable-post';
    
    const tagsHtml = post.tags ? post.tags.map(tag => 
        `<span class="post-tag">${tag}</span>`
    ).join('') : '';
    
    postItem.innerHTML = `
        <div class="post-header">
            <h3 class="post-title">${post.title}</h3>
            <span class="post-date">${post.date}</span>
        </div>
        <div class="post-meta">
            <span class="post-author">Posted by: <strong>${post.name}</strong></span>
        </div>
        <div class="post-tags">
            ${tagsHtml}
        </div>
    `;
    
    // Make the entire post clickable
    postItem.addEventListener('click', function() {
        viewPost(post._id);
    });
    
    return postItem;
}

function viewPost(postId) {
    sessionStorage.setItem('currentPostId', postId);
    window.location.href = '/cv-post';
}

async function loadPopularHashtags() {
    try {
        const response = await fetch('/api/hashtags/popular');
        const data = await response.json();
        
        if (data.success) {
            allHashtags = data.hashtags;
            displayHashtags();
        } else {
            console.error('Error loading hashtags:', data.message);
        }
    } catch (error) {
        console.error('Error fetching hashtags:', error);
    }
}

function displayHashtags() {
    const hashtagList = document.querySelector('.hashtag-list');
    hashtagList.innerHTML = '';

    allHashtags.forEach(hashtag => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'hashtag-link';
        link.textContent = `#${hashtag.name}`;
        link.setAttribute('data-hashtag', hashtag.name);
        link.setAttribute('data-usage-count', hashtag.usageCount);
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            toggleHashtagSelection(hashtag.name, this);
        });
        
        listItem.appendChild(link);
        hashtagList.appendChild(listItem);
    });
}

function toggleHashtagSelection(hashtagName, element) {
    const index = selectedHashtags.indexOf(hashtagName);
    
    if (index > -1) {
        // Remove from selection
        selectedHashtags.splice(index, 1);
        element.classList.remove('active');
    } else {
        // Add to selection
        selectedHashtags.push(hashtagName);
        element.classList.add('active');
    }
    
    updateSortButton();
}

function updateSortButton() {
    const sortBtn = document.getElementById('sortBtn');
    const hashtagSidebar = document.querySelector('.hashtag-sidebar');
    
    // Remove existing clear button
    const existingClearBtn = hashtagSidebar.querySelector('.clear-btn');
    if (existingClearBtn) {
        existingClearBtn.remove();
    }
    
    if (selectedHashtags.length > 0) {
        // Add clear button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-btn';
        clearBtn.textContent = 'Clear Selection';
        clearBtn.style.cssText = `
            background: #ff6b6b;
            color: white;
            border: 2px solid #ff6b6b;
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
        filteredPosts = [...allPosts];
    } else {
        filteredPosts = allPosts.filter(post => 
            post.tags && post.tags.some(tag => {
                const tagName = tag.replace('#', '');
                return selectedHashtags.includes(tagName);
            })
        );
    }
    
    // Reset to first page when filtering
    currentPage = 1;
    displayPosts();
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

function setupSortButton() {
    const sortBtn = document.getElementById('sortBtn');
    sortBtn.addEventListener('click', sortBySelectedTags);
}

function clearSelection() {
    // Clear selected hashtags
    selectedHashtags = [];
    
    // Remove active class from all hashtag links
    document.querySelectorAll('.hashtag-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Reset to all posts
    filteredPosts = [...allPosts];
    currentPage = 1;
    displayPosts();
    
    // Update sort button
    updateSortButton();
}