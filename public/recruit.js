// Recruit page functionality
let allRecruits = [];
let allHashtags = [];
let selectedFilters = {
  experience: [],
  technologies: [],
  fields: []
};

document.addEventListener('DOMContentLoaded', function() {
    loadRecruits();
    loadHashtags();
    setupFilterPanel();
    setupPublishCVButton();
});

function setupPublishCVButton() {
    const publishCVBtn = document.querySelector('.publish-cv-btn');
    if (publishCVBtn) {
        publishCVBtn.addEventListener('click', function(e) {
            const user = sessionStorage.getItem('user');
            if (!user) {
                e.preventDefault();
                alert('You need to login in order to publish your CV!');
                window.location.href = '/';
                return;
            }
        });
    }
}

async function loadRecruits() {
    try {
        console.log('Loading recruits...');
        const response = await fetch('/api/recruits');
        const data = await response.json();
        
        console.log('Recruits API response:', data);
        
        if (data.success) {
            allRecruits = data.recruits;
            console.log(`Loaded ${allRecruits.length} recruits:`, allRecruits.map(r => ({ id: r._id, name: r.name, authorId: r.authorId })));
            displayRecruits(allRecruits);
        } else {
            console.error('Error loading recruits:', data.message);
        }
    } catch (error) {
        console.error('Error fetching recruits:', error);
    }
}

async function loadHashtags() {
    try {
        const response = await fetch('/api/hashtags');
        const data = await response.json();
        
        if (data.success) {
            allHashtags = data.hashtags;
            populateFilterOptions();
        } else {
            console.error('Error loading hashtags:', data.message);
        }
    } catch (error) {
        console.error('Error fetching hashtags:', error);
    }
}

function populateFilterOptions() {
    const technologiesFilter = document.getElementById('technologiesFilter');
    const fieldsFilter = document.getElementById('fieldsFilter');
    
    // Define technology tags
    const technologyTags = [
        'python', 'java', 'javascript', 'typescript', 'csharp', 'cpp', 'c', 'go', 'rust', 'kotlin',
        'swift', 'php', 'ruby', 'scala', 'r', 'matlab', 'perl', 'haskell', 'clojure', 'elixir',
        'react', 'angular', 'vue', 'nodejs', 'express', 'django', 'flask', 'spring', 'laravel',
        'rails', 'aspnet', 'nextjs', 'nuxt', 'svelte', 'ember', 'backbone', 'jquery',
        'ios', 'android', 'react-native', 'flutter', 'xamarin', 'ionic', 'cordova',
        'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra',
        'dynamodb', 'firebase', 'supabase', 'sqlite', 'oracle', 'sql-server',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab',
        'github-actions', 'ansible', 'chef', 'puppet', 'vagrant', 'nginx', 'apache',
        'machine-learning', 'artificial-intelligence', 'deep-learning', 'tensorflow',
        'pytorch', 'pandas', 'numpy', 'scikit-learn', 'opencv', 'spark', 'hadoop',
        'kafka', 'airflow', 'jupyter', 'tableau', 'power-bi', 'looker'
    ];
    
    // Define field tags
    const fieldTags = [
        'frontend', 'backend', 'full-stack', 'mobile-development', 'web-development',
        'data-science', 'data-analytics', 'devops', 'cloud-engineering', 'cybersecurity',
        'product-manager', 'project-manager', 'business-analyst', 'qa-engineer',
        'ui-ux', 'design', 'graphic-design', 'product-design', 'user-research',
        'marketing', 'digital-marketing', 'content-marketing', 'social-media',
        'seo', 'sem', 'analytics', 'growth-hacking', 'sales', 'customer-success',
        'technical-writing', 'documentation', 'training', 'consulting',
        'blockchain', 'cryptocurrency', 'fintech', 'healthtech', 'edtech', 'ecommerce',
        'gaming', 'iot', 'embedded-systems', 'robotics', 'computer-vision',
        'natural-language-processing', 'recommendation-systems', 'microservices',
        'api-development', 'graphql', 'rest', 'websockets', 'real-time-systems'
    ];
    
    // Populate technologies
    technologyTags.forEach(tag => {
        const option = document.createElement('div');
        option.className = 'filter-option';
        option.dataset.filter = 'technologies';
        option.dataset.value = tag;
        option.textContent = tag;
        technologiesFilter.appendChild(option);
    });
    
    // Populate fields
    fieldTags.forEach(tag => {
        const option = document.createElement('div');
        option.className = 'filter-option';
        option.dataset.filter = 'fields';
        option.dataset.value = tag;
        option.textContent = tag;
        fieldsFilter.appendChild(option);
    });
}

function setupFilterPanel() {
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    
    // Toggle filter panel
    filterBtn.addEventListener('click', function() {
        filterPanel.classList.toggle('active');
        const icon = filterBtn.querySelector('.filter-icon');
        icon.textContent = filterPanel.classList.contains('active') ? '▲' : '▼';
    });
    
    // Filter option selection - use event delegation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-option')) {
            e.preventDefault();
            const filter = e.target.dataset.filter;
            const value = e.target.dataset.value;
            
            console.log('Filter clicked:', filter, value); // Debug log
            
            if (filter === 'experience') {
                e.target.classList.toggle('selected');
                if (e.target.classList.contains('selected')) {
                    if (!selectedFilters.experience.includes(value)) {
                        selectedFilters.experience.push(value);
                    }
                } else {
                    selectedFilters.experience = selectedFilters.experience.filter(v => v !== value);
                }
                console.log('Selected experience:', selectedFilters.experience); // Debug log
            } else if (filter === 'technologies') {
                e.target.classList.toggle('selected');
                if (e.target.classList.contains('selected')) {
                    if (!selectedFilters.technologies.includes(value)) {
                        selectedFilters.technologies.push(value);
                    }
                } else {
                    selectedFilters.technologies = selectedFilters.technologies.filter(v => v !== value);
                }
                console.log('Selected technologies:', selectedFilters.technologies); // Debug log
            } else if (filter === 'fields') {
                e.target.classList.toggle('selected');
                if (e.target.classList.contains('selected')) {
                    if (!selectedFilters.fields.includes(value)) {
                        selectedFilters.fields.push(value);
                    }
                } else {
                    selectedFilters.fields = selectedFilters.fields.filter(v => v !== value);
                }
                console.log('Selected fields:', selectedFilters.fields); // Debug log
            }
        }
    });
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', function() {
        selectedFilters = {
            experience: [],
            technologies: [],
            fields: []
        };
        
        document.querySelectorAll('.filter-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Reload all recruits
        loadRecruits();
    });
    
    // Apply filters
    applyFiltersBtn.addEventListener('click', function() {
        applyFilters();
    });
}

async function applyFilters() {
    try {
        const params = new URLSearchParams();
        
        if (selectedFilters.experience.length > 0) {
            params.append('experience', selectedFilters.experience.join(','));
        }
        
        if (selectedFilters.technologies.length > 0) {
            params.append('technologies', selectedFilters.technologies.join(','));
        }
        
        if (selectedFilters.fields.length > 0) {
            params.append('fields', selectedFilters.fields.join(','));
        }
        
        const response = await fetch(`/api/recruits?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
            allRecruits = data.recruits;
            displayRecruits(allRecruits);
        } else {
            console.error('Error applying filters:', data.message);
        }
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

function displayRecruits(recruits) {
    const candidatesGrid = document.getElementById('candidatesGrid');
    const noCandidates = document.getElementById('noCandidates');
    
    if (recruits.length === 0) {
        candidatesGrid.innerHTML = '';
        noCandidates.style.display = 'block';
        return;
    }
    
    noCandidates.style.display = 'none';
    
    // Group recruits into rows of 3
    const rows = [];
    for (let i = 0; i < recruits.length; i += 3) {
        rows.push(recruits.slice(i, i + 3));
    }
    
    candidatesGrid.innerHTML = '';
    
    rows.forEach(row => {
        const rowElement = document.createElement('div');
        rowElement.className = 'candidates-row';
        
        row.forEach(recruit => {
            const candidateCard = createCandidateCard(recruit);
            rowElement.appendChild(candidateCard);
        });
        
        candidatesGrid.appendChild(rowElement);
    });
}

function createCandidateCard(recruit) {
    const card = document.createElement('div');
    card.className = 'candidate-card';
    
    const name = recruit.name;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    card.innerHTML = `
        <div class="candidate-header">
            <div class="candidate-avatar">
                <div class="avatar-circle">${initials}</div>
            </div>
            <h3 class="candidate-name">${name}</h3>
        </div>
        
        <div class="cv-preview">
            <div class="cv-icon">📄</div>
            <p class="cv-text">CV Document</p>
            <button class="open-cv-btn" onclick="openCV('${recruit.postId.link}')">Open CV</button>
        </div>
        
        <button class="contact-btn" onclick="toggleContactInfo(this)">Contact</button>
        <div class="contact-bubble" style="display: none;">
            <div class="contact-info">
                <h4>Contact Information</h4>
                <p>${recruit.contactInformation}</p>
            </div>
        </div>
    `;
    
    return card;
}

function openCV(cvLink) {
    // Create a temporary link element to download the file with proper extension
    const link = document.createElement('a');
    // Append .pdf to Cloudinary URL to ensure proper download
    const downloadUrl = cvLink.endsWith('.pdf') ? cvLink : cvLink + '.pdf';
    link.href = downloadUrl;
    link.download = 'CV.pdf'; // Force download with .pdf extension
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function toggleContactInfo(button) {
    const bubble = button.nextElementSibling;
    const isVisible = bubble.style.display !== 'none';
    
    // Close all other contact bubbles and reset their buttons
    document.querySelectorAll('.contact-bubble').forEach(b => {
        if (b !== bubble) {
            b.style.display = 'none';
            b.classList.remove('closing');
        }
    });
    
    // Reset all other contact buttons
    document.querySelectorAll('.contact-btn').forEach(btn => {
        if (btn !== button) {
            btn.classList.remove('active');
        }
    });
    
    if (isVisible) {
        // Close current bubble with animation
        bubble.classList.add('closing');
        button.classList.remove('active');
        
        setTimeout(() => {
            bubble.style.display = 'none';
            bubble.classList.remove('closing');
        }, 300); // Match animation duration
    } else {
        // Open current bubble
        bubble.style.display = 'block';
        button.classList.add('active');
    }
}
