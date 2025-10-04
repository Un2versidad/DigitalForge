// DigitalForge - Configuration
// Configuración centralizada de la aplicación

const AppConfig = {
    // Información de la aplicación
    app: {
        name: 'DigitalForge Pro',
        version: '3.1.0',
        description: 'Suite profesional de herramientas para ingeniería digital',
        author: 'DigitalForge Team'
    },

    // Configuración de características
    features: {
        enablePuter: true,
        enableServiceWorker: true,
        enableAnalytics: false,
        enableNotifications: false,
        enableOfflineMode: true,
        enableThemePersistence: true,
        enableAutoSave: false
    },

    // Límites y validaciones
    limits: {
        maxBinaryBits: 32,
        maxDecimalValue: Number.MAX_SAFE_INTEGER,
        maxInputLength: 1000,
        maxFileSize: 1024 * 1024, // 1MB
        maxCacheAge: 60 * 60 * 1000, // 1 hora
        toastDuration: 4000 // 4 segundos
    },

    // Configuración de UI
    ui: {
        defaultTheme: 'dark',
        defaultTab: 'calculators',
        animationDuration: 300,
        debounceDelay: 300,
        scrollBehavior: 'smooth'
    },

    // Configuración de caché
    cache: {
        prefix: 'digitalforge_',
        version: 'v3.1.0',
        expiryMinutes: 60,
        maxEntries: 100
    },

    // Configuración de logging
    logging: {
        level: 'INFO', // DEBUG, INFO, WARN, ERROR
        enableConsole: true,
        enableRemote: false,
        maxLogEntries: 1000
    },

    // URLs y endpoints
    urls: {
        cdn: {
            tailwind: 'https://cdn.tailwindcss.com',
            fontAwesome: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
            puter: 'https://js.puter.com/v2/'
        },
        api: {
            // Agregar endpoints de API aquí si es necesario
        }
    },

    // Configuración de HDL
    hdl: {
        defaultModuleName: 'mi_modulo',
        defaultBits: 8,
        templates: {
            vhdl: ['entity', 'flip-flop', 'counter', 'fsm', 'alu'],
            verilog: ['module', 'flip-flop', 'counter', 'fsm', 'alu']
        }
    },

    // Configuración de calculadoras
    calculators: {
        binary: {
            maxBits: 32,
            operations: ['AND', 'OR', 'XOR', 'ADD', 'SUB']
        },
        twosComplement: {
            supportedBits: [4, 8, 16, 32]
        },
        ieee754: {
            precisions: [32, 64]
        },
        memory: {
            maxAddressBits: 32,
            maxDataBits: 64
        }
    },

    // Configuración de simuladores
    simulators: {
        gates: {
            types: ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'],
            maxInputs: 8
        },
        truthTable: {
            maxVariables: 6
        }
    },

    // Mensajes de la aplicación
    messages: {
        welcome: '¡Bienvenido a DigitalForge!',
        errors: {
            generic: 'Ha ocurrido un error',
            network: 'Error de conexión',
            validation: 'Datos inválidos',
            notFound: 'Elemento no encontrado',
            permission: 'Permiso denegado'
        },
        success: {
            saved: 'Guardado exitosamente',
            copied: 'Copiado al portapapeles',
            downloaded: 'Descargado exitosamente',
            generated: 'Generado exitosamente'
        }
    },

    // Atajos de teclado
    shortcuts: {
        save: 'Ctrl+S',
        copy: 'Ctrl+C',
        paste: 'Ctrl+V',
        undo: 'Ctrl+Z',
        redo: 'Ctrl+Y',
        find: 'Ctrl+F',
        help: 'F1'
    },

    // Configuración de accesibilidad
    accessibility: {
        enableAriaLabels: true,
        enableKeyboardNav: true,
        enableScreenReader: true,
        highContrast: false,
        reducedMotion: false
    },

    // Configuración de desarrollo
    dev: {
        debug: false,
        mockData: false,
        showPerformance: false,
        enableHotReload: false
    }
};

// Función para obtener configuración
function getConfig(path) {
    const keys = path.split('.');
    let value = AppConfig;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return undefined;
        }
    }
    
    return value;
}

// Función para actualizar configuración
function setConfig(path, newValue) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let obj = AppConfig;
    
    for (const key of keys) {
        if (!(key in obj)) {
            obj[key] = {};
        }
        obj = obj[key];
    }
    
    obj[lastKey] = newValue;
}

// Función para validar configuración
function validateConfig() {
    const errors = [];
    
    // Validar versión
    if (!AppConfig.app.version) {
        errors.push('Version is required');
    }
    
    // Validar límites
    if (AppConfig.limits.maxBinaryBits < 1 || AppConfig.limits.maxBinaryBits > 64) {
        errors.push('maxBinaryBits must be between 1 and 64');
    }
    
    // Validar nivel de logging
    const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    if (!validLevels.includes(AppConfig.logging.level)) {
        errors.push('Invalid logging level');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Función para cargar configuración desde localStorage
function loadConfigFromStorage() {
    try {
        const stored = localStorage.getItem('digitalforge_config');
        if (stored) {
            const config = JSON.parse(stored);
            // Fusionar con configuración por defecto
            Object.assign(AppConfig, config);
        }
    } catch (error) {
        console.error('Error loading config from storage:', error);
    }
}

// Función para guardar configuración en localStorage
function saveConfigToStorage() {
    try {
        localStorage.setItem('digitalforge_config', JSON.stringify(AppConfig));
    } catch (error) {
        console.error('Error saving config to storage:', error);
    }
}

// Inicializar configuración
function initConfig() {
    loadConfigFromStorage();
    
    const validation = validateConfig();
    if (!validation.valid) {
        console.warn('Configuration validation errors:', validation.errors);
    }
    
    // Aplicar configuración de accesibilidad
    if (AppConfig.accessibility.reducedMotion) {
        document.documentElement.style.setProperty('--transition-fast', '0.01ms');
        document.documentElement.style.setProperty('--transition-normal', '0.01ms');
        document.documentElement.style.setProperty('--transition-slow', '0.01ms');
    }
    
    // Aplicar configuración de desarrollo
    if (AppConfig.dev.debug) {
        console.log('🔧 Modo debug habilitado');
        console.log('📋 Config:', AppConfig);
    }
}

// Export para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppConfig,
        getConfig,
        setConfig,
        validateConfig,
        loadConfigFromStorage,
        saveConfigToStorage,
        initConfig
    };
}

// Auto-inicializar si está en el navegador
if (typeof window !== 'undefined') {
    window.AppConfig = AppConfig;
    window.getConfig = getConfig;
    window.setConfig = setConfig;
}
