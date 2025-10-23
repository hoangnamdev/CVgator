// Recruit page functionality
let allRecruits = [];
let allHashtags = [];
let selectedFilters = {
  experience: null,
  technologies: [],
  fields: []
};

document.addEventListener('DOMContentLoaded', function() {
    loadRecruits();
    loadHashtags();
    setupFilterPanel();
});

async function loadRecruits() {
    try {
        const response = await fetch('/api/recruits');
        const data = await response.json();
        
        if (data.success) {
            allRecruits = data.recruits;
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
    
    // Filter option selection
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-option')) {
            const filter = e.target.dataset.filter;
            const value = e.target.dataset.value;
            
            if (filter === 'experience') {
                // Only one experience level can be selected
                document.querySelectorAll('[data-filter="experience"]').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.target.classList.add('selected');
                selectedFilters.experience = value;
            } else if (filter === 'technologies' || filter === 'fields') {
                e.target.classList.toggle('selected');
                if (e.target.classList.contains('selected')) {
                    selectedFilters[filter].push(value);
                } else {
                    selectedFilters[filter] = selectedFilters[filter].filter(v => v !== value);
                }
            }
        }
    });
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', function() {
        selectedFilters = {
            experience: null,
            technologies: [],
            fields: []
        };
        
        document.querySelectorAll('.filter-option').forEach(opt => {
            opt.classList.remove('selected');
        });
    });
    
    // Apply filters
    applyFiltersBtn.addEventListener('click', function() {
        applyFilters();
    });
}

async function applyFilters() {
    try {
        const params = new URLSearchParams();
        
        if (selectedFilters.experience) {
            params.append('experience', selectedFilters.experience);
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
    window.open(cvLink, '_blank');
}

function toggleContactInfo(button) {
    const bubble = button.nextElementSibling;
    const isVisible = bubble.style.display !== 'none';
    
    // Close all other contact bubbles
    document.querySelectorAll('.contact-bubble').forEach(b => {
        b.style.display = 'none';
    });
    
    // Toggle current bubble
    bubble.style.display = isVisible ? 'none' : 'block';
}
