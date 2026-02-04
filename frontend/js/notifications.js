/**
 * Notification System
 * This file provides a global notification system for the application
 */

// Global notification function
document.showNotification = function(message, type = 'info', duration = 5000) {
    // Create message container if it doesn't exist
    let container = document.getElementById('messageContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'messageContainer';
        container.className = 'message-container';
        document.body.insertBefore(container, document.body.firstChild);
    }

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    // Add to container and show
    container.innerHTML = ''; // Clear previous messages
    container.appendChild(messageElement);
    container.classList.add('show');
    container.classList.add(type);

    // Auto-hide after duration
    if (duration > 0) {
        setTimeout(() => {
            container.classList.remove('show');
            // Wait for fade out animation to complete before removing classes
            setTimeout(() => {
                container.className = 'message-container';
            }, 300);
        }, duration);
    }

    // Return a function to manually hide the notification
    return () => {
        container.classList.remove('show');
        setTimeout(() => {
            container.className = 'message-container';
        }, 300);
    };
};

// Handle URL parameters for showing messages on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const messageType = urlParams.get('messageType') || 'info';
    
    if (message) {
        // Decode the message (it might be URL-encoded)
        const decodedMessage = decodeURIComponent(message);
        document.showNotification(decodedMessage, messageType);
        
        // Clean up the URL without refreshing the page
        const cleanUrl = window.location.pathname + window.location.search
            .replace(/[?&]message=[^&]+/g, '')
            .replace(/[?&]messageType=[^&]+/g, '')
            .replace(/^&/, '?')
            .replace(/[?&]$/, '');
        
        window.history.replaceState({}, document.title, cleanUrl || window.location.pathname);
    }
});

// Add global error handler for fetch requests (COMENTADO PARA EVITAR LEITURA DUPLICADA)
// const originalFetch = window.fetch;
// window.fetch = async function(resource, config) {
//     try {
//         const response = await originalFetch(resource, config);
//         
//         // If the response is not ok, try to parse the error message
//         if (!response.ok) {
//             try {
//                 const errorData = await response.json();
//                 if (errorData.erro) {
//                     document.showNotification(errorData.erro, 'error');
//                 } else {
//                     document.showNotification(`Erro ${response.status}: ${response.statusText}`, 'error');
//                 }
//             } catch (e) {
//                 // If we can't parse the error as JSON, show a generic error
//                 document.showNotification(`Erro na requisição: ${response.statusText}`, 'error');
//             }
//         }
//         
//         return response;
//     } catch (error) {
//         console.error('Fetch error:', error);
//         document.showNotification('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
//         throw error;
//     }
// };
