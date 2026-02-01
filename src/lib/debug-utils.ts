

/**
 * Debug Utilities for Sanchez Family OS
 * logic to simulate offline/online states and network conditions
 */

export const simulateOffline = (isOffline: boolean) => {
    if (isOffline) {
        console.log('🔌 [DEBUG] Simulating Offline Mode');
        window.dispatchEvent(new Event('offline'));
        // Optionally override navigator.onLine if environment allows (mostly read-only in browsers)
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    } else {
        console.log('🌐 [DEBUG] Simulating Online Mode');
        window.dispatchEvent(new Event('online'));
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    }
};

export const simulateNetworkLatency = async (ms: number) => {
    console.log(`🐢 [DEBUG] Simulating Network Latency: ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const getNetworkStatus = () => {
    return navigator.onLine ? 'online' : 'offline';
}
