

const util = {
    
    generateUniqueId: () => {
        return 'component_' + Math.random().toString(36).substr(2, 9);
    },

    
    rgbArrayToHex: (rgbArray) => {
        if (!Array.isArray(rgbArray) || rgbArray.length < 3) {
            return '#FFFFFF';
        }
        
        const r = Math.round(rgbArray[0] * 255);
        const g = Math.round(rgbArray[1] * 255);
        const b = Math.round(rgbArray[2] * 255);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
    },

    
    hexToRgbArray: (hex) => {
        
        hex = hex.replace('#', '');
        
        
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        
        return [r, g, b];
    },
    snapToGrid: (value, gridSize = 18) => {
        return Math.round(value / gridSize) * gridSize;
    },
    formatNumber: (value, decimals = 1) => {
        return Number(value).toFixed(decimals);
    },
    saveToLocalStorage: (key, data) => {
        try {
            if (data === null) {
                localStorage.removeItem(key);
                return;
            }
            
            
            const serialized = JSON.stringify(data);
            
            
            const testKey = `test_${Date.now()}`;
            localStorage.setItem(testKey, '1');
            localStorage.removeItem(testKey);
            
            
            localStorage.setItem(key, serialized);
            return true;
        } catch (e) {
            console.error('Error saving to local storage:', e);
            
            if (e.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Try clearing some browser data.');
            }
            return false;
        }
    },
    loadFromLocalStorage: (key) => {
        try {
            const data = localStorage.getItem(key);
            if (!data) {
                return null;
            }
            
            const parsed = JSON.parse(data);
            console.log(`Loaded data from localStorage: ${key}`, parsed);
            return parsed;
        } catch (e) {
            console.error('Error loading from local storage:', e);
            return null;
        }
    },
    downloadJSON: (data, filename = 'chest_ui.json') => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },
    uploadFile: (onLoad, accept = 'application/json') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    onLoad(data);
                } catch (error) {
                    console.error('Error parsing JSON file:', error);
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
};
