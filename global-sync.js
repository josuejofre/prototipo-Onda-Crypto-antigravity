// Global State Sync for OndaFinance Prototype

const MOCK_CLIENTS = [
    { name: 'Joao Silva', cpf: '230.123.456-45', id: 'bp-123' },
    { name: 'Maria Santos', cpf: '145.678.901-12', id: 'bp-456' },
    { name: 'Carlos Oliveira', cpf: '334.556.778-90', id: 'bp-789' },
    { name: 'Ana Costa', cpf: '098.765.432-10', id: 'bp-012' }
];

function formatCPF(cpf) {
    if (!cpf) return '';
    // Simplify for prototype display: XXX.xxx.xxx-XX
    const parts = cpf.split('.');
    if (parts.length < 3) return cpf;
    return `${parts[0]}.xxx.xxx-${cpf.slice(-2)}`;
}

function updateGlobalHeader() {
    const selectedClient = JSON.parse(localStorage.getItem('selectedClient'));
    const headerActions = document.querySelector('.header-actions');
    const userProfile = document.querySelector('.user-profile');
    
    // Add Banker Label if not present
    if (userProfile && !userProfile.querySelector('.banker-label')) {
        const userInfo = userProfile.querySelector('.user-info');
        if (userInfo) {
            const label = document.createElement('span');
            label.className = 'banker-label';
            label.textContent = 'Banker';
            userInfo.appendChild(label);
        }
    }

    // Add/Update Global Client Highlight
    if (headerActions) {
        // Exclude from administration page
        if (window.location.pathname.includes('administration.html')) {
            const existingHighlight = document.querySelector('.header-client-info');
            if (existingHighlight) existingHighlight.remove();
        } else {
            let highlight = document.querySelector('.header-client-info');
            
            if (!highlight) {
                highlight = document.createElement('div');
                highlight.className = 'header-client-info';
                headerActions.parentNode.insertBefore(highlight, headerActions);
            }

            if (selectedClient) {
                highlight.innerHTML = `
                    <span class="header-client-label">Selected Client:</span>
                    <div class="header-client-details">
                        <span class="header-client-name">${selectedClient.name}</span>
                        <span class="header-client-cpf">${formatCPF(selectedClient.cpf)}</span>
                    </div>
                `;
                highlight.style.display = 'flex';
            } else {
                highlight.innerHTML = `
                    <span class="header-client-label">No client selected</span>
                    <a href="wallet.html" style="font-size: 12px; color: var(--accent-green); text-decoration: none; margin-left: 8px;">Select Now</a>
                `;
                highlight.style.display = 'flex';
            }
        }
    }

    // Logo Redirect Logic
    const logo = document.querySelector('.sidebar .logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // User Profile Menu Logic
    if (userProfile) {
        userProfile.classList.add('user-profile-clickable');
        
        // Remove existing dropdown if any
        const existingMenu = document.querySelector('.user-menu-dropdown');
        if (existingMenu) existingMenu.remove();

        // Create Dropdown
        const menu = document.createElement('div');
        menu.className = 'user-menu-dropdown';
        menu.innerHTML = `
            <div class="menu-item logout-item" id="logoutBtn">
                <i class="ph ph-sign-out"></i>
                <span>Logout</span>
            </div>
        `;
        document.body.appendChild(menu);

        function toggleUserMenu(e) {
            e.stopPropagation();
            const rect = userProfile.getBoundingClientRect();
            menu.style.top = `${rect.bottom + 8}px`;
            menu.style.right = `${window.innerWidth - rect.right}px`;
            menu.classList.toggle('show');
        }

        userProfile.addEventListener('click', toggleUserMenu);

        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!userProfile.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
    }
}

// Handle shared client selector logic across pages
function initClientSelector(searchId = 'walletClientSearch', dropdownId = 'clientResultsDropdown', displayId = 'walletClientName') {
    const searchInput = document.getElementById(searchId);
    const resultsDropdown = document.getElementById(dropdownId);
    if (!searchInput || !resultsDropdown) return;

    function renderResults(query) {
        if (!query) {
            resultsDropdown.classList.remove('show');
            return;
        }

        const filtered = MOCK_CLIENTS.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) || 
            c.cpf.includes(query)
        );

        if (filtered.length > 0) {
            resultsDropdown.innerHTML = filtered.map(c => `
                <div class="client-result-item" data-id="${c.id}" data-name="${c.name}" data-cpf="${c.cpf}">
                    <span class="client-result-name">${c.name}</span>
                    <span class="client-result-cpf">${formatCPF(c.cpf)}</span>
                </div>
            `).join('');
            resultsDropdown.classList.add('show');
        } else {
            resultsDropdown.innerHTML = '<div class="client-result-item" style="cursor: default; color: var(--text-muted);">No clients found</div>';
            resultsDropdown.classList.add('show');
        }
    }

    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value);
    });

    searchInput.addEventListener('focus', (e) => {
        if (e.target.value) renderResults(e.target.value);
    });

    // Handle item selection
    resultsDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.client-result-item');
        if (item && item.dataset.id) {
            const client = {
                id: item.dataset.id,
                name: item.dataset.name,
                cpf: item.dataset.cpf
            };
            
            localStorage.setItem('selectedClient', JSON.stringify(client));
            updateLocalClientDisplays(client);
            searchInput.value = '';
            resultsDropdown.classList.remove('show');
            updateGlobalHeader();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
            resultsDropdown.classList.remove('show');
        }
    });

    // Initial load from storage
    const initialClient = JSON.parse(localStorage.getItem('selectedClient'));
    if (initialClient) {
        updateLocalClientDisplays(initialClient);
    }
}

function updateLocalClientDisplays(client) {
    const displayName = document.getElementById('walletClientName') || document.getElementById('pageClientName');
    if (displayName) {
        displayName.textContent = client.name;
        let cpfSpan = displayName.parentNode.querySelector('.client-cpf-highlight');
        if (!cpfSpan) {
            cpfSpan = document.createElement('span');
            cpfSpan.className = 'client-cpf-highlight';
            cpfSpan.style.fontSize = '14px';
            cpfSpan.style.color = 'var(--text-muted)';
            cpfSpan.style.marginLeft = '8px';
            displayName.parentNode.appendChild(cpfSpan);
        }
        cpfSpan.textContent = `(${formatCPF(client.cpf)})`;
    }

    // Trades drawer logic
    const clientInput = document.querySelector('.drawer .form-group input[placeholder*="Search client"]');
    const existingBox = document.querySelector('.selected-client-display-box');
    
    if (clientInput || existingBox) {
        const box = existingBox || clientInput.parentNode;
        const formGroup = box.parentNode;
        const label = formGroup.querySelector('label');
        if (label) label.style.display = 'none';

        box.className = 'selected-client-display-box';
        box.style.cssText = `
            background: var(--bg-panel);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 4px;
        `;
        
        box.innerHTML = `
            <div style="width: 44px; height: 44px; background: var(--accent-green-dim); color: var(--accent-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                <i class="ph ph-user"></i>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="font-weight: 700; color: var(--accent-green); font-size: 16px; letter-spacing: 0.3px;">${client.name}</span>
                <span style="font-size: 13px; color: var(--text-muted); font-family: 'Inter', monospace;">${formatCPF(client.cpf)}</span>
            </div>
        `;
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
    updateGlobalHeader();
    initClientSelector();

    window.addEventListener('storage', (e) => {
        if (e.key === 'selectedClient') {
            updateGlobalHeader();
            const client = JSON.parse(e.newValue);
            if (client) updateLocalClientDisplays(client);
        }
    });

    const selectedClient = JSON.parse(localStorage.getItem('selectedClient'));
    if (selectedClient) {
        updateLocalClientDisplays(selectedClient);
    }
});
