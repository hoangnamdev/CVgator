// Hashtags page functionality
let allHashtags = [];
let selectedHashtags = [];

document.addEventListener('DOMContentLoaded', function() {
    loadHashtags();
});

async function loadHashtags() {
    try {
        const response = await fetch('/api/hashtags');
        const data = await response.json();
        
        if (data.success) {
            allHashtags = data.hashtags;
            displayHashtags();
            updateSortButton();
        } else {
            console.error('Error loading hashtags:', data.message);
        }
    } catch (error) {
        console.error('Error fetching hashtags:', error);
    }
}

function displayHashtags() {
    const hashtagsGrid = document.getElementById('hashtagsGrid');
    hashtagsGrid.innerHTML = '';

    allHashtags.forEach(hashtag => {
        const hashtagCard = document.createElement('div');
        hashtagCard.className = 'hashtag-card';
        hashtagCard.dataset.hashtag = hashtag.name;
        
        hashtagCard.innerHTML = `
            <div class="tag-name">#${hashtag.name}</div>
            <div class="tag-count">${hashtag.usageCount} uses</div>
        `;
        
        hashtagCard.addEventListener('click', function() {
            toggleHashtagSelection(hashtag.name, hashtagCard);
        });
        
        hashtagsGrid.appendChild(hashtagCard);
    });
}

function toggleHashtagSelection(hashtagName, hashtagCard) {
    const index = selectedHashtags.indexOf(hashtagName);
    
    if (index > -1) {
        // Deselect hashtag
        selectedHashtags.splice(index, 1);
        hashtagCard.classList.remove('selected');
    } else {
        // Select hashtag
        selectedHashtags.push(hashtagName);
        hashtagCard.classList.add('selected');
    }
    
    updateSortButton();
}

function updateSortButton() {
    const sortBtn = document.getElementById('sortBtn');
    if (selectedHashtags.length > 0) {
        sortBtn.disabled = false;
        sortBtn.textContent = `Sort (${selectedHashtags.length})`;
    } else {
        sortBtn.disabled = true;
        sortBtn.textContent = 'Sort';
    }
}

function sortBySelectedTags() {
    if (selectedHashtags.length === 0) return;
    
    // Store selected hashtags in sessionStorage
    sessionStorage.setItem('selectedHashtags', JSON.stringify(selectedHashtags));
    
    // Set flag to auto-sort when arriving at submissions page
    sessionStorage.setItem('autoSort', 'true');
    
    // Redirect to submissions page
    window.location.href = '/submissions';
}

