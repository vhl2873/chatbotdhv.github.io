/**
 * API Configuration Loader
 * Loads API base URL from config.json
 */

let apiConfig = null;

async function loadAPIConfig() {
    if (apiConfig) return apiConfig;
    
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        apiConfig = {
            baseUrl: config.api?.host || 'http://localhost:8000',
            models: config.models || null
        };
        return apiConfig;
    } catch (error) {
        console.error('Error loading API config:', error);
        // Fallback to default
        apiConfig = {
            baseUrl: 'http://localhost:8000',
            models: null
        };
        return apiConfig;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.APIConfig = { loadAPIConfig };
}
