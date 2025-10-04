// DigitalForge - Utility Functions
// Funciones de utilidad y helpers

/**
 * Validación de entrada numérica
 */
const Validators = {
    isValidBinary: (str) => /^[01]+$/.test(str),
    isValidHex: (str) => /^[0-9A-Fa-f]+$/.test(str),
    isValidDecimal: (str) => /^-?\d+$/.test(str),
    isValidFloat: (str) => /^-?\d+\.?\d*$/.test(str),
    
    isInRange: (num, min, max) => num >= min && num <= max,
    
    sanitizeModuleName: (name) => {
        return name.trim().replace(/[^a-zA-Z0-9_]/g, '_');
    }
};

/**
 * Formateo de números
 */
const Formatters = {
    formatBinary: (num, bits = 8) => {
        return num.toString(2).padStart(bits, '0');
    },
    
    formatHex: (num, digits = 2) => {
        return num.toString(16).toUpperCase().padStart(digits, '0');
    },
    
    formatBytes: (bytes) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    },
    
    formatFrequency: (hz) => {
        if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`;
        if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
        if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} KHz`;
        return `${hz.toFixed(2)} Hz`;
    },
    
    formatTime: (seconds) => {
        if (seconds >= 1) return `${seconds.toFixed(6)} s`;
        if (seconds >= 1e-3) return `${(seconds * 1e3).toFixed(6)} ms`;
        if (seconds >= 1e-6) return `${(seconds * 1e6).toFixed(6)} μs`;
        if (seconds >= 1e-9) return `${(seconds * 1e9).toFixed(6)} ns`;
        return `${(seconds * 1e12).toFixed(6)} ps`;
    }
};

/**
 * Operaciones binarias
 */
const BinaryOps = {
    and: (a, b) => a & b,
    or: (a, b) => a | b,
    xor: (a, b) => a ^ b,
    not: (a) => ~a,
    nand: (a, b) => ~(a & b),
    nor: (a, b) => ~(a | b),
    xnor: (a, b) => ~(a ^ b),
    
    leftShift: (a, n) => a << n,
    rightShift: (a, n) => a >> n,
    
    rotateLeft: (value, bits, n) => {
        const mask = (1 << bits) - 1;
        return ((value << n) | (value >> (bits - n))) & mask;
    },
    
    rotateRight: (value, bits, n) => {
        const mask = (1 << bits) - 1;
        return ((value >> n) | (value << (bits - n))) & mask;
    }
};

/**
 * Conversiones de base
 */
const BaseConverter = {
    decToBin: (dec, bits = 8) => {
        return parseInt(dec, 10).toString(2).padStart(bits, '0');
    },
    
    decToHex: (dec, digits = 2) => {
        return parseInt(dec, 10).toString(16).toUpperCase().padStart(digits, '0');
    },
    
    decToOct: (dec) => {
        return parseInt(dec, 10).toString(8);
    },
    
    binToDec: (bin) => {
        return parseInt(bin, 2);
    },
    
    hexToDec: (hex) => {
        return parseInt(hex, 16);
    },
    
    octToDec: (oct) => {
        return parseInt(oct, 8);
    },
    
    binToHex: (bin) => {
        return parseInt(bin, 2).toString(16).toUpperCase();
    },
    
    hexToBin: (hex, bits = 8) => {
        return parseInt(hex, 16).toString(2).padStart(bits, '0');
    }
};

/**
 * Manejo de errores mejorado
 */
class DigitalForgeError extends Error {
    constructor(message, type = 'error') {
        super(message);
        this.name = 'DigitalForgeError';
        this.type = type;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Logger con niveles
 */
const Logger = {
    levels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },
    
    currentLevel: 1, // INFO por defecto
    
    debug: (...args) => {
        if (Logger.currentLevel <= Logger.levels.DEBUG) {
            console.log('🔍 [DEBUG]', ...args);
        }
    },
    
    info: (...args) => {
        if (Logger.currentLevel <= Logger.levels.INFO) {
            console.log('ℹ️ [INFO]', ...args);
        }
    },
    
    warn: (...args) => {
        if (Logger.currentLevel <= Logger.levels.WARN) {
            console.warn('⚠️ [WARN]', ...args);
        }
    },
    
    error: (...args) => {
        if (Logger.currentLevel <= Logger.levels.ERROR) {
            console.error('❌ [ERROR]', ...args);
        }
    }
};

/**
 * Cache manager para localStorage
 */
const CacheManager = {
    prefix: 'digitalforge_',
    
    set: (key, value, expiryMinutes = 60) => {
        try {
            const item = {
                value: value,
                expiry: Date.now() + (expiryMinutes * 60 * 1000)
            };
            localStorage.setItem(CacheManager.prefix + key, JSON.stringify(item));
            return true;
        } catch (error) {
            Logger.error('Cache set error:', error);
            return false;
        }
    },
    
    get: (key) => {
        try {
            const itemStr = localStorage.getItem(CacheManager.prefix + key);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            
            // Verificar si expired
            if (Date.now() > item.expiry) {
                localStorage.removeItem(CacheManager.prefix + key);
                return null;
            }
            
            return item.value;
        } catch (error) {
            Logger.error('Cache get error:', error);
            return null;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(CacheManager.prefix + key);
            return true;
        } catch (error) {
            Logger.error('Cache remove error:', error);
            return false;
        }
    },
    
    clear: () => {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CacheManager.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            Logger.error('Cache clear error:', error);
            return false;
        }
    }
};

/**
 * Performance monitor
 */
const PerformanceMonitor = {
    marks: {},
    
    start: (label) => {
        PerformanceMonitor.marks[label] = performance.now();
    },
    
    end: (label) => {
        if (!PerformanceMonitor.marks[label]) {
            Logger.warn('Performance mark not found:', label);
            return null;
        }
        
        const duration = performance.now() - PerformanceMonitor.marks[label];
        delete PerformanceMonitor.marks[label];
        
        Logger.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        return duration;
    }
};

/**
 * Clipboard helper con fallback
 */
const ClipboardHelper = {
    copy: async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback para navegadores antiguos
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                return success;
            }
        } catch (error) {
            Logger.error('Clipboard copy error:', error);
            return false;
        }
    },
    
    read: async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                return await navigator.clipboard.readText();
            }
            return null;
        } catch (error) {
            Logger.error('Clipboard read error:', error);
            return null;
        }
    }
};

// Export para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Validators,
        Formatters,
        BinaryOps,
        BaseConverter,
        DigitalForgeError,
        Logger,
        CacheManager,
        PerformanceMonitor,
        ClipboardHelper
    };
}
