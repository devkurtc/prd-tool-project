// PRD Tool - Interactive Prototype JavaScript
// Main application logic and interactivity

class PRDToolApp {
    constructor() {
        this.currentView = 'dashboard';
        this.isAIPanelOpen = true;
        this.notifications = [];
        this.activeUsers = [];
        this.init();
    }

    init() {
        this.initEventListeners();
        this.initAnimations();
        this.simulateRealTimeData();
        this.startTypingSimulation();
    }

    initEventListeners() {
        // Mobile menu
        this.initMobileMenu();
        
        // Navigation
        document.querySelectorAll('[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(item.dataset.view);
            });
        });

        // Modal handlers
        const newPRDBtn = document.getElementById('new-prd-btn');
        const createPRDBtn = document.getElementById('create-prd-btn');
        const closePRDBtn = document.getElementById('create-prd-btn');
        const modal = document.getElementById('new-prd-modal');
        const closeModal = document.getElementById('close-modal');
        const cancelPRD = document.getElementById('cancel-prd');

        if (newPRDBtn) {
            newPRDBtn.addEventListener('click', () => this.openModal());
        }
        if (createPRDBtn) {
            createPRDBtn.addEventListener('click', () => this.openModal());
        }
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }
        if (cancelPRD) {
            cancelPRD.addEventListener('click', () => this.closeModal());
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        // PRD creation
        const createPRD = document.getElementById('create-prd');
        if (createPRD) {
            createPRD.addEventListener('click', () => this.createNewPRD());
        }

        // Editor navigation
        const backToDashboard = document.getElementById('back-to-dashboard');
        if (backToDashboard) {
            backToDashboard.addEventListener('click', () => this.switchView('dashboard'));
        }

        // Edit PRD button
        const editPRDBtn = document.querySelector('[onclick="openPRDEditor()"]');
        if (editPRDBtn) {
            editPRDBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('editor');
            });
        }

        // AI Panel toggle
        const toggleAIPanel = document.getElementById('toggle-ai-panel');
        if (toggleAIPanel) {
            toggleAIPanel.addEventListener('click', () => this.toggleAIPanel());
        }

        // AI input and commands
        const aiInput = document.getElementById('ai-input');
        const sendAIMessage = document.getElementById('send-ai-message');
        
        if (aiInput) {
            aiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAIMessage();
                }
            });
        }
        
        if (sendAIMessage) {
            sendAIMessage.addEventListener('click', () => this.sendAIMessage());
        }

        // Command buttons
        document.querySelectorAll('.command-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.executeAICommand(btn.dataset.command);
            });
        });

        // Voice input
        const voiceInputBtn = document.getElementById('voice-input-btn');
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => this.startVoiceInput());
        }

        // Notifications
        const notificationsBtn = document.getElementById('notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => this.toggleNotifications());
        }

        // Preview button
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.togglePreview());
        }

        // Message actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-success')) {
                this.acceptAISuggestion(e.target.closest('.ai-message'));
            }
            if (e.target.closest('.btn-danger')) {
                this.rejectAISuggestion(e.target.closest('.ai-message'));
            }
        });
    }

    initMobileMenu() {
        // Add mobile menu button to header
        const headerLeft = document.querySelector('.header-left');
        if (headerLeft && window.innerWidth <= 768) {
            const menuBtn = document.createElement('button');
            menuBtn.className = 'mobile-menu-btn';
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            menuBtn.addEventListener('click', () => this.toggleMobileMenu());
            headerLeft.insertBefore(menuBtn, headerLeft.firstChild);
        }

        // Add overlay for mobile menu
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => this.closeMobileMenu());
        document.body.appendChild(overlay);

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        }
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    }

    initAnimations() {
        // Animate counters on dashboard
        this.animateCounters();
        
        // Stagger animations for cards
        this.staggerCardAnimations();
        
        // Add hover effects
        this.addHoverEffects();
    }

    animateCounters() {
        const counters = document.querySelectorAll('[data-target]');
        
        const animateCounter = (counter) => {
            const target = parseInt(counter.dataset.target);
            const increment = target / 50;
            let current = 0;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        };

        // Animate counters when they come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => animateCounter(entry.target), 200);
                    observer.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => observer.observe(counter));
    }

    staggerCardAnimations() {
        const cards = document.querySelectorAll('.stat-card, .table-row, .activity-item');
        
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-fadeIn');
        });
    }

    addHoverEffects() {
        // Add interactive hover effects
        const interactiveElements = document.querySelectorAll('.btn, .table-row, .nav-item, .stat-card');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.transition = 'transform 0.2s ease';
            });
            
            element.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    switchView(viewName) {
        // Hide current view
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show target view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
        
        // Update breadcrumb if in editor
        if (viewName === 'editor') {
            this.updateBreadcrumb(['Home', 'Projects', 'SSO Integration PRD']);
        } else {
            this.updateBreadcrumb(['Home', 'Dashboard']);
        }
    }

    updateBreadcrumb(items) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (!breadcrumb) return;
        
        breadcrumb.innerHTML = items.map((item, index) => {
            const isLast = index === items.length - 1;
            return isLast 
                ? `<span class="breadcrumb-item active">${item}</span>`
                : `<a href="#" class="breadcrumb-item">${item}</a><span class="breadcrumb-separator">></span>`;
        }).join('');
    }

    openModal() {
        const modal = document.getElementById('new-prd-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('animate-fadeIn');
            
            // Focus on first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 300);
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('new-prd-modal');
        if (modal) {
            modal.classList.add('animate-fadeOut');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('animate-fadeOut', 'animate-fadeIn');
                this.clearModalForm();
            }, 300);
        }
    }

    clearModalForm() {
        const modal = document.getElementById('new-prd-modal');
        if (modal) {
            modal.querySelectorAll('input, textarea, select').forEach(input => {
                input.value = '';
            });
        }
    }

    createNewPRD() {
        const title = document.getElementById('prd-title')?.value;
        const project = document.getElementById('prd-project')?.value;
        
        if (!title) {
            this.showNotification('Please enter a PRD title', 'error');
            return;
        }
        
        // Simulate PRD creation
        this.showNotification(`Creating "${title}" PRD...`, 'info');
        
        setTimeout(() => {
            this.closeModal();
            this.showNotification(`"${title}" PRD created successfully!`, 'success');
            this.switchView('editor');
        }, 1500);
    }

    toggleAIPanel() {
        const aiPanel = document.getElementById('ai-panel');
        if (!aiPanel) return;
        
        this.isAIPanelOpen = !this.isAIPanelOpen;
        
        if (this.isAIPanelOpen) {
            aiPanel.style.width = '320px';
            aiPanel.style.opacity = '1';
        } else {
            aiPanel.style.width = '0';
            aiPanel.style.opacity = '0';
        }
    }

    sendAIMessage() {
        const input = document.getElementById('ai-input');
        if (!input || !input.value.trim()) return;
        
        const message = input.value.trim();
        this.addUserMessage(message);
        input.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            this.simulateAIResponse(message);
        }, 1000);
    }

    addUserMessage(message) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message animate-slideInRight';
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-author">John</span>
                <time>Now</time>
            </div>
            <div class="message-content">${message}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    simulateAIResponse(userMessage) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        // Show typing indicator
        this.showAITyping();
        
        setTimeout(() => {
            this.hideAITyping();
            
            const responses = {
                'oauth': `I'll add OAuth2 specifications to the technical section:
                
                <div class="generated-content">
                    <strong>OAuth2 Integration</strong>
                    <ul>
                        <li>Authorization code flow with PKCE</li>
                        <li>Token refresh every 15 minutes</li>
                        <li>Support for multiple identity providers</li>
                        <li>Rate limiting: 100 requests/minute</li>
                    </ul>
                </div>`,
                'diagram': `I'll create a sequence diagram for the authentication flow:
                
                <div class="generated-content">
                    <strong>Authentication Sequence Diagram</strong>
                    <p>Generating Mermaid diagram for OAuth2 flow...</p>
                    <code>
                    sequenceDiagram
                        User->>App: Login Request
                        App->>IDP: Redirect to OAuth2
                        IDP->>User: Login Form
                        User->>IDP: Credentials
                        IDP->>App: Authorization Code
                        App->>IDP: Exchange for Token
                    </code>
                </div>`,
                'metrics': `I'll suggest success metrics for this feature:
                
                <div class="generated-content">
                    <strong>Success Metrics</strong>
                    <ul>
                        <li>User adoption: 80% of users use SSO within 30 days</li>
                        <li>Login time: Average under 10 seconds</li>
                        <li>Support tickets: 50% reduction in auth-related issues</li>
                        <li>Security: Zero auth-related security incidents</li>
                    </ul>
                </div>`
            };
            
            let response = responses.default || `I understand you want help with: "${userMessage}". I'll help you improve this section of your PRD.`;
            
            // Simple keyword matching
            if (userMessage.toLowerCase().includes('oauth') || userMessage.toLowerCase().includes('auth')) {
                response = responses.oauth;
            } else if (userMessage.toLowerCase().includes('diagram') || userMessage.toLowerCase().includes('flow')) {
                response = responses.diagram;
            } else if (userMessage.toLowerCase().includes('metric') || userMessage.toLowerCase().includes('success')) {
                response = responses.metrics;
            }
            
            const messageElement = document.createElement('div');
            messageElement.className = 'message ai-message animate-slideInLeft';
            messageElement.innerHTML = `
                <div class="message-header">
                    <span class="message-author">🤖 AI Assistant</span>
                    <time>Now</time>
                </div>
                <div class="message-content">
                    ${response}
                    <div class="message-actions">
                        <button class="btn btn-sm btn-success">✅ Accept</button>
                        <button class="btn btn-sm btn-secondary">✏️ Edit</button>
                        <button class="btn btn-sm btn-danger">❌ Reject</button>
                    </div>
                </div>
            `;
            
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 2000);
    }

    showAITyping() {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        const typingElement = document.createElement('div');
        typingElement.className = 'message ai-message typing-message';
        typingElement.innerHTML = `
            <div class="message-header">
                <span class="message-author">🤖 AI Assistant</span>
                <time>typing...</time>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideAITyping() {
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    executeAICommand(command) {
        const input = document.getElementById('ai-input');
        if (input) {
            input.value = command + ' ';
            input.focus();
        }
    }

    startVoiceInput() {
        this.showNotification('Voice input started...', 'info');
        
        // Simulate voice recognition
        setTimeout(() => {
            const input = document.getElementById('ai-input');
            if (input) {
                input.value = 'Add user story for password reset with email verification';
                this.showNotification('Voice input recognized!', 'success');
            }
        }, 2000);
    }

    acceptAISuggestion(messageElement) {
        if (!messageElement) return;
        
        messageElement.style.backgroundColor = '#d4edda';
        messageElement.style.borderLeft = '4px solid #28a745';
        
        const actions = messageElement.querySelector('.message-actions');
        if (actions) {
            actions.innerHTML = '<span class="text-success">✅ Accepted and applied to document</span>';
        }
        
        this.showNotification('AI suggestion accepted and applied!', 'success');
        this.updateDocumentContent();
    }

    rejectAISuggestion(messageElement) {
        if (!messageElement) return;
        
        messageElement.style.backgroundColor = '#f8d7da';
        messageElement.style.borderLeft = '4px solid #dc3545';
        
        const actions = messageElement.querySelector('.message-actions');
        if (actions) {
            actions.innerHTML = '<span class="text-danger">❌ Rejected</span>';
        }
        
        this.showNotification('AI suggestion rejected', 'info');
    }

    updateDocumentContent() {
        // Simulate updating the markdown editor
        const editor = document.getElementById('markdown-editor');
        if (editor) {
            // Add a subtle highlight effect
            editor.style.boxShadow = '0 0 10px rgba(40, 167, 69, 0.3)';
            setTimeout(() => {
                editor.style.boxShadow = '';
            }, 2000);
        }
    }

    toggleNotifications() {
        const panel = document.getElementById('notification-panel');
        if (!panel) return;
        
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            panel.classList.add('animate-slideInRight');
        } else {
            panel.classList.add('animate-slideOutRight');
            setTimeout(() => {
                panel.classList.add('hidden');
                panel.classList.remove('animate-slideInRight', 'animate-slideOutRight');
            }, 300);
        }
    }

    togglePreview() {
        const editor = document.querySelector('.markdown-editor');
        const preview = document.createElement('div');
        
        if (!editor) return;
        
        if (editor.style.display === 'none') {
            // Show editor, hide preview
            editor.style.display = 'block';
            const existingPreview = document.querySelector('.markdown-preview');
            if (existingPreview) {
                existingPreview.remove();
            }
        } else {
            // Show preview, hide editor
            editor.style.display = 'none';
            preview.className = 'markdown-preview';
            preview.innerHTML = this.convertMarkdownToHTML(editor.value);
            editor.parentNode.appendChild(preview);
        }
    }

    convertMarkdownToHTML(markdown) {
        // Simple markdown conversion for demo
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} animate-slideInRight`;
        notification.innerHTML = `
            <div class="notification-content">
                ${message}
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const colors = {
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107',
            'info': '#17a2b8'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    simulateRealTimeData() {
        // Simulate active users
        setInterval(() => {
            this.updateActiveUsers();
        }, 10000);
        
        // Simulate typing indicators
        setInterval(() => {
            this.showRandomTyping();
        }, 30000);
        
        // Simulate new notifications
        setInterval(() => {
            this.addRandomNotification();
        }, 45000);
    }

    updateActiveUsers() {
        const users = ['Sarah', 'Mike', 'Lisa', 'Alex'];
        const activities = ['viewing', 'editing', 'commenting'];
        
        users.forEach(user => {
            const activity = activities[Math.floor(Math.random() * activities.length)];
            const userElement = document.querySelector(`[title*="${user}"]`);
            if (userElement) {
                // Update activity indicator
                const indicator = userElement.querySelector('.status-indicator');
                if (indicator) {
                    indicator.className = `status-indicator ${activity}`;
                }
            }
        });
    }

    showRandomTyping() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator && typingIndicator.classList.contains('hidden')) {
            typingIndicator.classList.remove('hidden');
            setTimeout(() => {
                typingIndicator.classList.add('hidden');
            }, 5000);
        }
    }

    addRandomNotification() {
        const notifications = [
            'Sarah added a comment to User Stories',
            'Mike updated the technical requirements',
            'New AI suggestions available',
            'PRD review requested by team lead'
        ];
        
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        this.showNotification(randomNotification, 'info');
    }

    startTypingSimulation() {
        // Simulate collaborative typing
        const editor = document.getElementById('markdown-editor');
        if (!editor) return;
        
        let isSimulating = false;
        
        setInterval(() => {
            if (!isSimulating && Math.random() > 0.7) {
                isSimulating = true;
                this.simulateTyping(editor);
                setTimeout(() => {
                    isSimulating = false;
                }, 5000);
            }
        }, 15000);
    }

    simulateTyping(editor) {
        const additions = [
            '\n\n### Security Considerations\n- Implement rate limiting\n- Add CSRF protection',
            '\n\n### Performance Requirements\n- Response time < 200ms\n- Support 1000 concurrent users',
            '\n\n### Monitoring and Alerting\n- Track authentication success rates\n- Monitor token expiration events'
        ];
        
        const addition = additions[Math.floor(Math.random() * additions.length)];
        const originalContent = editor.value;
        
        let currentIndex = 0;
        const typeInterval = setInterval(() => {
            if (currentIndex < addition.length) {
                editor.value = originalContent + addition.substring(0, currentIndex + 1);
                currentIndex++;
            } else {
                clearInterval(typeInterval);
            }
        }, 50);
    }
}

// Global functions for compatibility
window.openPRDEditor = function() {
    if (window.prdApp) {
        window.prdApp.switchView('editor');
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.prdApp = new PRDToolApp();
    
    // Add custom CSS animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out;
        }
        
        .animate-fadeOut {
            animation: fadeOut 0.3s ease-in-out;
        }
        
        .animate-slideInRight {
            animation: slideInRight 0.3s ease-out;
        }
        
        .animate-slideOutRight {
            animation: slideOutRight 0.3s ease-in;
        }
        
        .animate-slideInLeft {
            animation: slideInLeft 0.3s ease-out;
        }
        
        .typing-indicator {
            display: flex;
            gap: 4px;
            align-items: center;
        }
        
        .typing-indicator span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #ccc;
            animation: typing 1.4s infinite ease-in-out both;
        }
        
        .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0%, 80%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .notification {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            margin-left: 10px;
        }
        
        .generated-content {
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 12px;
            margin: 8px 0;
            border-radius: 0 4px 4px 0;
        }
        
        .generated-content code {
            display: block;
            background: #f1f3f4;
            padding: 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin-top: 8px;
            white-space: pre-wrap;
        }
    `;
    document.head.appendChild(style);
});