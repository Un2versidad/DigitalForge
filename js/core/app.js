// DigitalForge - Suite de Ingeniería Digital

// Global State Management
const AppState = {
    currentTab: 'calculators',
    hdlCode: '',
    puterUser: null,
    gateInputs: { A: 0, B: 0 },
    isInitialized: false
};

// Inicializar Application
document.addEventListener('DOMContentLoaded', function () {
    if (!AppState.isInitialized) {
        initializeApp();
        AppState.isInitialized = true;
        console.log('✅ DigitalForge iniciado correctamente');
    }
});

// Funciones auxiliares
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Debounce utility for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Input sanitization
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
}

// Detect ad blockers (AdGuard, uBlock, etc.)
function detectAdBlocker() {
    // Check for common ad blocker indicators
    if (typeof window.adguard !== 'undefined') {
        return true;
    }
    
    // Check if AdGuard is blocking
    if (document.querySelector('[data-adguard]')) {
        return true;
    }
    
    // Check for generic ad blocker detection
    try {
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox ad-placement ad-placeholder adbadge BannerAd';
        testAd.style.position = 'absolute';
        testAd.style.left = '-999px';
        document.body.appendChild(testAd);
        
        const isBlocked = testAd.offsetHeight === 0 || 
                         window.getComputedStyle(testAd).display === 'none' ||
                         window.getComputedStyle(testAd).visibility === 'hidden';
        
        document.body.removeChild(testAd);
        return isBlocked;
    } catch (e) {
        return false;
    }
}

// Main Initialization
async function initializeApp() {
    try {
        // Inicializar in parallel for better performance
        await Promise.all([
            initializeTabs(),
            initializePuter(),
            initializeTheme(),
            initializeGateSimulator()
        ]);

        // Inicializar AI Assistant
        if (typeof initAIAssistant === 'function') {
            initAIAssistant();
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(() => console.log('✅ Service Worker registrado'))
                .catch(err => console.warn('⚠️ Service Worker falló:', err));
        }

        showToast('¡Bienvenido a DigitalForge!', 'success');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showToast('Error al inicializar la aplicación', 'error');
    }
}

// Tab System
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab, button);
        });
    });
}

function switchTab(tabName, clickedButton = null) {
    // Validar tab name
    if (!tabName) {
        console.warn('⚠️ Nombre de pestaña requerido');
        return;
    }

    // First scroll to features section
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Wait for scroll, then switch tab
    setTimeout(() => {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });

        if (clickedButton) {
            clickedButton.classList.add('active');
            clickedButton.setAttribute('aria-selected', 'true');
        } else {
            // Find button by data-tab attribute
            const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (targetButton) {
                targetButton.classList.add('active');
                targetButton.setAttribute('aria-selected', 'true');
            }
        }

        // Mostrar/hide tab content with animation
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
            content.setAttribute('aria-hidden', 'true');
        });

        const targetContent = document.getElementById(`${tabName}-content`);
        if (targetContent) {
            targetContent.classList.remove('hidden');
            targetContent.setAttribute('aria-hidden', 'false');
        }

        AppState.currentTab = tabName;
        showToast('Welcome to DigitalForge! 🚀', 'success');
    }, 500);

    // Update URL without reload
    if (history.pushState) {
        history.pushState(null, null, `#${tabName}`);
    }
}

// Puter.js Integration
async function initializePuter() {
    const puterStatus = document.getElementById('puter-status');
    const loginBtn = document.getElementById('puter-login-btn');
    const logoutBtn = document.getElementById('puter-logout-btn');

    if (!puterStatus || !loginBtn || !logoutBtn) {
        console.warn('⚠️ Elementos UI de Puter no encontrados');
        return;
    }

    if (typeof puter !== 'undefined') {
        puterStatus.classList.remove('hidden');

        try {
            const isAuthenticated = await puter.auth.isSignedIn();
            if (isAuthenticated) {
                AppState.puterUser = await puter.auth.getUser();
                updatePuterUI(true);
            } else {
                updatePuterUI(false);
            }
        } catch (error) {
            console.log('⚠️ Puter auth check failed:', error);
            updatePuterUI(false);
        }

        loginBtn.addEventListener('click', async () => {
            try {
                await puter.auth.signIn();
                AppState.puterUser = await puter.auth.getUser();
                updatePuterUI(true);
                showToast('Sesión iniciada en Puter exitosamente', 'success');
            } catch (error) {
                // Handle specific error cases
                if (error?.error === 'auth_window_closed') {
                    console.log('ℹ️ Puter auth window closed by user');
                    // Always warn about ad blockers when login is cancelled
                    showToast('Inicio de sesión cancelado. Verifica que no tengas bloqueadores como AdGuard activos', 'warning', 10000);
                } else {
                    console.error('❌ Puter login error:', error);
                    
                    // Check for ad blockers on other errors
                    const hasAdBlocker = detectAdBlocker();
                    if (hasAdBlocker) {
                        showToast('Error al iniciar sesión. Intenta desactivar AdGuard o bloqueadores de anuncios', 'error', 6000);
                    } else {
                        showToast('Error al iniciar sesión en Puter', 'error');
                    }
                }
            }
        });

        logoutBtn.addEventListener('click', async () => {
            try {
                await puter.auth.signOut();
                AppState.puterUser = null;
                updatePuterUI(false);

                // Clear session info
                if (typeof clearSessionInfo === 'function') {
                    clearSessionInfo();
                }

                // Update footer status
                if (typeof updateFooterStatus === 'function') {
                    updateFooterStatus('available');
                }

                showToast('Sesión cerrada en Puter', 'success');
            } catch (error) {
                console.error('❌ Puter logout error:', error);
                showToast('Error al cerrar sesión', 'error');
            }
        });
    } else {
        console.log('ℹ️ SDK de Puter no disponible');
    }
}

function updatePuterUI(loggedIn) {
    const loginBtn = document.getElementById('puter-login-btn');
    const userInfo = document.getElementById('puter-user-info');
    const saveSection = document.getElementById('puter-save-section');

    if (!loginBtn || !userInfo) {
        console.warn('⚠️ Elementos UI de Puter no encontrados');
        return;
    }

    if (loggedIn && AppState.puterUser) {
        loginBtn.classList.add('hidden');
        loginBtn.setAttribute('aria-hidden', 'true');
        userInfo.classList.remove('hidden');
        userInfo.setAttribute('aria-hidden', 'false');
        if (saveSection) {
            saveSection.classList.remove('hidden');
            saveSection.setAttribute('aria-hidden', 'false');
        }

        const usernameEl = document.getElementById('puter-username');

        if (usernameEl) {
            usernameEl.textContent = AppState.puterUser.username || 'Usuario';
        }
    } else {
        loginBtn.classList.remove('hidden');
        loginBtn.setAttribute('aria-hidden', 'false');
        userInfo.classList.add('hidden');
        userInfo.setAttribute('aria-hidden', 'true');
        if (saveSection) {
            saveSection.classList.add('hidden');
            saveSection.setAttribute('aria-hidden', 'true');
        }
    }
}

// Theme System
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);

        // Load saved theme preference
        const savedTheme = localStorage.getItem('digitalforge-theme') || 'dark';
        if (savedTheme === 'light') {
            applyLightTheme();
        }
    }
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('bg-gradient-dark');

    if (isDark) {
        applyLightTheme();
    } else {
        applyDarkTheme();
    }
}

function applyLightTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    body.className = 'bg-gray-100 text-gray-900 min-h-screen font-sans';
    if (themeToggle) {
        themeToggle.innerHTML = '<i class="fas fa-sun text-yellow-500"></i>';
        themeToggle.setAttribute('aria-label', 'Cambiar a tema oscuro');
    }

    localStorage.setItem('digitalforge-theme', 'light');
    showToast('Tema claro activado', 'success');
}

function applyDarkTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    body.className = 'bg-gradient-dark bg-gradient-mesh text-white min-h-screen font-sans';
    if (themeToggle) {
        themeToggle.innerHTML = '<i class="fas fa-moon text-yellow-400"></i>';
        themeToggle.setAttribute('aria-label', 'Cambiar a tema claro');
    }

    localStorage.setItem('digitalforge-theme', 'dark');
    showToast('Tema oscuro activado', 'success');
}

// Toast Notification System
function showToast(message, type = 'success', duration = 4000) {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const messageEl = document.getElementById('toast-message');

    if (!toast || !icon || !messageEl) return;

    const icons = {
        success: 'fas fa-check-circle text-green-400',
        error: 'fas fa-exclamation-circle text-red-400',
        warning: 'fas fa-exclamation-triangle text-yellow-400',
        info: 'fas fa-info-circle text-blue-400'
    };

    icon.className = icons[type] || icons.success;
    messageEl.textContent = message;

    toast.classList.remove('hidden');
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
        hideToast();
    }, duration);
}

function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.style.transform = 'translateY(100%)';
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }
}

// Elegant Confirm Dialog
function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
                <div class="flex items-start gap-4 mb-6">
                    <div class="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-question text-purple-400 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
                        <p class="text-white/70 leading-relaxed">${message}</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button id="confirmCancel" class="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white font-medium transition-all">
                        ${cancelText}
                    </button>
                    <button id="confirmOk" class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-medium transition-all shadow-lg shadow-purple-500/25">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const handleConfirm = () => {
            modal.remove();
            resolve(true);
        };
        
        const handleCancel = () => {
            modal.remove();
            resolve(false);
        };
        
        modal.querySelector('#confirmOk').addEventListener('click', handleConfirm);
        modal.querySelector('#confirmCancel').addEventListener('click', handleCancel);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) handleCancel();
        });
    });
}

// Number Base Converter
function convertNumber() {
    const input = document.getElementById('decInput')?.value.trim();

    if (!input) {
        showToast('Por favor ingresa un número', 'warning');
        return;
    }

    const num = parseInt(input, 10);

    if (isNaN(num)) {
        showToast('Por favor ingresa un número decimal válido', 'error');
        return;
    }

    if (num < 0) {
        showToast('Usa la calculadora de complemento a dos para números negativos', 'warning');
        return;
    }

    if (num > Number.MAX_SAFE_INTEGER) {
        showToast('Número demasiado grande', 'error');
        return;
    }

    try {
        const binary = num.toString(2);
        const octal = num.toString(8);
        const hex = num.toString(16).toUpperCase();

        const binResult = document.getElementById('binResult');
        const octResult = document.getElementById('octResult');
        const hexResult = document.getElementById('hexResult');

        if (binResult) binResult.textContent = binary;
        if (octResult) octResult.textContent = octal;
        if (hexResult) hexResult.textContent = hex;

        const resultsDiv = document.getElementById('conversionResults');
        if (resultsDiv) {
            resultsDiv.classList.remove('hidden');
            resultsDiv.setAttribute('aria-live', 'polite');
        }

        showToast(`${num} convertido exitosamente`, 'success');

    } catch (error) {
        console.error('❌ Conversion error:', error);
        showToast('Error en la conversión: ' + error.message, 'error');
    }
}

// Binary Calculator
function binaryOp(operation) {
    const binA = document.getElementById('binA')?.value.trim();
    const binB = document.getElementById('binB')?.value.trim();

    if (!binA || !binB) {
        showToast('Por favor ingresa ambos valores binarios', 'error');
        return;
    }

    // Validar binary format
    const binaryRegex = /^[01]+$/;
    if (!binaryRegex.test(binA) || !binaryRegex.test(binB)) {
        showToast('Los valores deben contener solo 0s y 1s', 'error');
        return;
    }

    // Check length limits
    if (binA.length > 32 || binB.length > 32) {
        showToast('Los valores binarios no deben exceder 32 bits', 'warning');
        return;
    }

    try {
        const decA = parseInt(binA, 2);
        const decB = parseInt(binB, 2);
        let result;

        switch (operation) {
            case 'AND':
                result = (decA & decB).toString(2);
                break;
            case 'OR':
                result = (decA | decB).toString(2);
                break;
            case 'XOR':
                result = (decA ^ decB).toString(2);
                break;
            case 'ADD':
                result = (decA + decB).toString(2);
                break;
            default:
                throw new Error('Operación no válida');
        }

        const resultEl = document.getElementById('binOpRes');
        const resultDiv = document.getElementById('binaryOpResult');

        if (resultEl) resultEl.textContent = result;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast(`Operación ${operation} completada: ${result}`, 'success');

    } catch (error) {
        console.error('❌ Binary operation error:', error);
        showToast('Error en la operación: ' + error.message, 'error');
    }
}

// Two's Complement Calculator
function calculateTwosComplement() {
    const input = document.getElementById('twosInput').value.trim();
    const bits = parseInt(document.getElementById('bitsSelect').value);

    if (!input || isNaN(input)) {
        showToast('Por favor ingresa un número válido', 'error');
        return;
    }

    const num = parseInt(input);
    const maxVal = Math.pow(2, bits - 1) - 1;
    const minVal = -Math.pow(2, bits - 1);

    if (num > maxVal || num < minVal) {
        showToast(`Número fuera de rango para ${bits} bits (${minVal} a ${maxVal})`, 'error');
        return;
    }

    try {
        let magnitude, onesComp, twosComp;

        if (num >= 0) {
            magnitude = num.toString(2).padStart(bits, '0');
            onesComp = magnitude;
            twosComp = magnitude;
        } else {
            const absNum = Math.abs(num);
            magnitude = absNum.toString(2).padStart(bits, '0');
            onesComp = magnitude.split('').map(bit => bit === '0' ? '1' : '0').join('');
            const onesCompVal = parseInt(onesComp, 2);
            const twosCompVal = (onesCompVal + 1) % Math.pow(2, bits);
            twosComp = twosCompVal.toString(2).padStart(bits, '0');
        }

        document.getElementById('magnitude').textContent = magnitude;
        document.getElementById('onesComp').textContent = onesComp;
        document.getElementById('twosComp').textContent = twosComp;

        document.getElementById('twosResult').classList.remove('hidden');
        showToast(`Complemento a dos de ${num} en ${bits} bits`, 'success');

    } catch (error) {
        showToast('Error en el cálculo: ' + error.message, 'error');
    }
}

// IEEE 754 Calculator
function calculateIEEE754(precision = 32) {
    const input = document.getElementById('floatInput').value.trim();

    if (!input || isNaN(input)) {
        showToast('Por favor ingresa un número decimal válido', 'error');
        return;
    }

    const num = parseFloat(input);

    try {
        let sign, exponent, mantissa;

        if (precision === 32) {
            const buffer = new ArrayBuffer(4);
            const view = new DataView(buffer);
            view.setFloat32(0, num);
            const binary = view.getUint32(0).toString(2).padStart(32, '0');

            sign = binary.substring(0, 1);
            exponent = binary.substring(1, 9);
            mantissa = binary.substring(9, 32);
        } else { // 64-bit
            const buffer = new ArrayBuffer(8);
            const view = new DataView(buffer);
            view.setFloat64(0, num);

            const high = view.getUint32(0).toString(2).padStart(32, '0');
            const low = view.getUint32(4).toString(2).padStart(32, '0');
            const binary = high + low;

            sign = binary.substring(0, 1);
            exponent = binary.substring(1, 12);
            mantissa = binary.substring(12, 64);
        }

        document.getElementById('ieeeSign').textContent = sign;
        document.getElementById('ieeeExp').textContent = exponent;
        document.getElementById('ieeeMantissa').textContent = mantissa;

        document.getElementById('ieee754Result').classList.remove('hidden');
        showToast(`Representación IEEE 754 ${precision}-bit de ${num}`, 'success');

    } catch (error) {
        showToast('Error en el cálculo: ' + error.message, 'error');
    }
}

// Memory Calculator
function calculateMemory() {
    const addressBits = parseInt(document.getElementById('addressBits').value);
    const dataBits = parseInt(document.getElementById('dataBits').value);

    if (isNaN(addressBits) || isNaN(dataBits) || addressBits <= 0 || dataBits <= 0) {
        showToast('Por favor ingresa valores válidos mayores a 0', 'error');
        return;
    }

    try {
        const words = Math.pow(2, addressBits);
        const totalBits = words * dataBits;
        const bytes = totalBits / 8;

        // Formatear capacity
        let capacity;
        if (bytes >= Math.pow(1024, 4)) {
            capacity = (bytes / Math.pow(1024, 4)).toFixed(2) + ' TB';
        } else if (bytes >= Math.pow(1024, 3)) {
            capacity = (bytes / Math.pow(1024, 3)).toFixed(2) + ' GB';
        } else if (bytes >= Math.pow(1024, 2)) {
            capacity = (bytes / Math.pow(1024, 2)).toFixed(2) + ' MB';
        } else if (bytes >= 1024) {
            capacity = (bytes / 1024).toFixed(2) + ' KB';
        } else {
            capacity = bytes.toFixed(2) + ' B';
        }

        document.getElementById('memWords').textContent = words.toLocaleString();
        document.getElementById('memCapacity').textContent = capacity;

        document.getElementById('memoryResult').classList.remove('hidden');
        showToast(`${capacity} de memoria calculada`, 'success');

    } catch (error) {
        showToast('Error en el cálculo: ' + error.message, 'error');
    }
}

// Frequency Calculator
function calculatePeriod() {
    const freq = parseFloat(document.getElementById('frequency').value);
    const unit = document.getElementById('freqUnit').value;

    if (isNaN(freq) || freq <= 0) {
        showToast('Por favor ingresa una frecuencia válida mayor a 0', 'error');
        return;
    }

    try {
        const multipliers = { 'Hz': 1, 'KHz': 1e3, 'MHz': 1e6, 'GHz': 1e9 };
        const freqHz = freq * multipliers[unit];
        const period = 1 / freqHz;

        // Formatear period
        let periodStr;
        if (period >= 1) {
            periodStr = period.toFixed(6) + ' s';
        } else if (period >= 1e-3) {
            periodStr = (period * 1e3).toFixed(6) + ' ms';
        } else if (period >= 1e-6) {
            periodStr = (period * 1e6).toFixed(6) + ' μs';
        } else if (period >= 1e-9) {
            periodStr = (period * 1e9).toFixed(6) + ' ns';
        } else {
            periodStr = (period * 1e12).toFixed(6) + ' ps';
        }

        document.getElementById('period').textContent = periodStr;
        document.getElementById('periodResult').classList.remove('hidden');

        showToast(`Período calculado: ${periodStr}`, 'success');

    } catch (error) {
        showToast('Error en el cálculo: ' + error.message, 'error');
    }
}

// VHDL Generator
function generateVHDL() {
    const templateEl = document.getElementById('vhdlTemplate');
    const moduleNameEl = document.getElementById('vhdlModuleName');

    if (!templateEl) {
        showToast('Error: Elemento de template no encontrado', 'error');
        return;
    }

    const template = templateEl.value;
    const moduleName = (moduleNameEl?.value.trim() || 'mi_modulo').replace(/[^a-zA-Z0-9_]/g, '_');

    let vhdlCode = '';

    switch (template) {
        case 'entity':
            vhdlCode = `library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

entity ${moduleName} is
    Port ( 
        clk : in STD_LOGIC;
        reset : in STD_LOGIC;
        input_data : in STD_LOGIC_VECTOR(7 downto 0);
        output_data : out STD_LOGIC_VECTOR(7 downto 0)
    );
end ${moduleName};

architecture Behavioral of ${moduleName} is
begin
    process(clk, reset)
    begin
        if reset = '1' then
            output_data <= (others => '0');
        elsif rising_edge(clk) then
            output_data <= input_data;
        end if;
    end process;
end Behavioral;`;
            break;

        case 'flip-flop':
            vhdlCode = `library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

entity ${moduleName} is
    Port ( 
        clk : in STD_LOGIC;
        reset : in STD_LOGIC;
        d : in STD_LOGIC;
        q : out STD_LOGIC
    );
end ${moduleName};

architecture Behavioral of ${moduleName} is
begin
    process(clk, reset)
    begin
        if reset = '1' then
            q <= '0';
        elsif rising_edge(clk) then
            q <= d;
        end if;
    end process;
end Behavioral;`;
            break;

        case 'counter':
            vhdlCode = `library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

entity ${moduleName} is
    Port ( 
        clk : in STD_LOGIC;
        reset : in STD_LOGIC;
        enable : in STD_LOGIC;
        count : out STD_LOGIC_VECTOR(7 downto 0)
    );
end ${moduleName};

architecture Behavioral of ${moduleName} is
    signal counter : unsigned(7 downto 0) := (others => '0');
begin
    process(clk, reset)
    begin
        if reset = '1' then
            counter <= (others => '0');
        elsif rising_edge(clk) then
            if enable = '1' then
                counter <= counter + 1;
            end if;
        end if;
    end process;
    
    count <= std_logic_vector(counter);
end Behavioral;`;
            break;

        default:
            vhdlCode = `-- Selecciona un template válido`;
    }

    const outputEl = document.getElementById('hdlOutput');
    if (outputEl) {
        outputEl.textContent = vhdlCode;
    }

    AppState.hdlCode = vhdlCode;
    showToast('Código VHDL generado exitosamente', 'success');
}

// Verilog Generator
function generateVerilog() {
    const templateEl = document.getElementById('verilogTemplate');
    const moduleNameEl = document.getElementById('verilogModuleName');

    if (!templateEl) {
        showToast('Error: Elemento de template no encontrado', 'error');
        return;
    }

    const template = templateEl.value;
    const moduleName = (moduleNameEl?.value.trim() || 'mi_modulo').replace(/[^a-zA-Z0-9_]/g, '_');

    let verilogCode = '';

    switch (template) {
        case 'module':
            verilogCode = `module ${moduleName} (
    input wire clk,
    input wire reset,
    input wire [7:0] input_data,
    output reg [7:0] output_data
);

always @(posedge clk or posedge reset) begin
    if (reset) begin
        output_data <= 8'b0;
    end else begin
        output_data <= input_data;
    end
end

endmodule`;
            break;

        case 'flip-flop':
            verilogCode = `module ${moduleName} (
    input wire clk,
    input wire reset,
    input wire d,
    output reg q
);

always @(posedge clk or posedge reset) begin
    if (reset) begin
        q <= 1'b0;
    end else begin
        q <= d;
    end
end

endmodule`;
            break;

        case 'counter':
            verilogCode = `module ${moduleName} (
    input wire clk,
    input wire reset,
    input wire enable,
    output reg [7:0] count
);

always @(posedge clk or posedge reset) begin
    if (reset) begin
        count <= 8'b0;
    end else if (enable) begin
        count <= count + 1;
    end
end

endmodule`;
            break;

        default:
            verilogCode = `// Selecciona un template válido`;
    }

    const outputEl = document.getElementById('hdlOutput');
    if (outputEl) {
        outputEl.textContent = verilogCode;
    }

    AppState.hdlCode = verilogCode;
    showToast('Código Verilog generado exitosamente', 'success');
}

// Copy HDL Code
async function copyHDL() {
    if (!AppState.hdlCode) {
        showToast('No hay código para copiar', 'warning');
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(AppState.hdlCode);
            showToast('Código copiado al portapapeles', 'success');
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = AppState.hdlCode;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Código copiado al portapapeles', 'success');
        }
    } catch (error) {
        console.error('❌ Copy error:', error);
        showToast('Error al copiar el código', 'error');
    }
}

// Download HDL Code
function downloadHDL() {
    if (!AppState.hdlCode) {
        showToast('No hay código para descargar', 'warning');
        return;
    }

    try {
        const extension = AppState.hdlCode.includes('module') ? '.v' : '.vhd';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `digitalforge_${timestamp}${extension}`;

        const blob = new Blob([AppState.hdlCode], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);

        showToast(`Archivo ${filename} descargado`, 'success');
    } catch (error) {
        console.error('❌ Download error:', error);
        showToast('Error al descargar el archivo', 'error');
    }
}

// Save to Puter
async function saveToPuter() {
    if (!AppState.puterUser) {
        showToast('Debes iniciar sesión en Puter primero', 'warning');
        return;
    }

    if (!AppState.hdlCode) {
        showToast('No hay código para guardar', 'warning');
        return;
    }

    try {
        const extension = AppState.hdlCode.includes('module') ? '.v' : '.vhd';
        const timestamp = Date.now();
        const filename = `digitalforge_code_${timestamp}${extension}`;

        if (typeof puter !== 'undefined' && puter.fs && puter.fs.write) {
            await puter.fs.write(filename, AppState.hdlCode);
            showToast(`Archivo guardado en Puter como ${filename}`, 'success');
        } else {
            throw new Error('Puter API no disponible');
        }
    } catch (error) {
        console.error('❌ Error saving to Puter:', error);
        showToast('Error al guardar en Puter: ' + error.message, 'error');
    }
}

// Gate Simulator
function initializeGateSimulator() {
    AppState.gateInputs = { A: 0, B: 0 };
    updateGateSimulator();
}

function setGateInput(input, value) {
    // Validar input
    if (!['A', 'B'].includes(input) || ![0, 1].includes(value)) {
        console.warn('⚠️ Invalid gate input:', input, value);
        return;
    }

    AppState.gateInputs[input] = value;

    // Update button states
    const buttons = document.querySelectorAll(`#input${input}0, #input${input}1`);
    buttons.forEach(btn => {
        btn.classList.remove('bg-green-500/20', 'border-green-500/50', 'text-green-300');
        btn.classList.add('bg-white/10', 'border-white/20', 'text-white');
        btn.setAttribute('aria-pressed', 'false');
    });

    const activeButton = document.getElementById(`input${input}${value}`);
    if (activeButton) {
        activeButton.classList.remove('bg-white/10', 'border-white/20', 'text-white');
        activeButton.classList.add('bg-green-500/20', 'border-green-500/50', 'text-green-300');
        activeButton.setAttribute('aria-pressed', 'true');
    }

    updateGateSimulator();
}

function updateGateSimulator() {
    const gateTypeEl = document.getElementById('gateType');
    const inputsDiv = document.getElementById('gateInputs');
    const outputDiv = document.getElementById('gateOutput');

    if (!gateTypeEl || !inputsDiv || !outputDiv) {
        console.warn('⚠️ Elementos del simulador de compuertas no encontrados');
        return;
    }

    const gateType = gateTypeEl.value;

    // Mostrar/hide second input for NOT gate
    if (inputsDiv.children[1]) {
        inputsDiv.children[1].style.display = gateType === 'NOT' ? 'none' : 'block';
    }

    // Calculate output
    let output = 0;
    const A = AppState.gateInputs.A;
    const B = AppState.gateInputs.B;

    switch (gateType) {
        case 'AND':
            output = A & B;
            break;
        case 'OR':
            output = A | B;
            break;
        case 'NOT':
            output = A ? 0 : 1;
            break;
        case 'NAND':
            output = (A & B) ? 0 : 1;
            break;
        case 'NOR':
            output = (A | B) ? 0 : 1;
            break;
        case 'XOR':
            output = A ^ B;
            break;
        case 'XNOR':
            output = (A ^ B) ? 0 : 1;
            break;
        default:
            console.warn('⚠️ Unknown gate type:', gateType);
            return;
    }

    outputDiv.textContent = output;
    outputDiv.className = `text-4xl font-bold ${output ? 'text-green-400' : 'text-red-400'}`;
    outputDiv.setAttribute('aria-label', `Salida: ${output}`);
}

// Truth Table Generator
function generateTruthTable() {
    const vars = parseInt(document.getElementById('truthTableVars').value);
    const operation = document.getElementById('truthTableOp').value;
    const output = document.getElementById('truthTableOutput');

    const numRows = Math.pow(2, vars);
    let table = '<table class="w-full text-sm"><thead><tr class="border-b border-white/20">';

    // Headers
    for (let i = 0; i < vars; i++) {
        table += `<th class="p-2 text-center">${String.fromCharCode(65 + i)}</th>`;
    }
    table += `<th class="p-2 text-center">Salida</th></tr></thead><tbody>`;

    // Rows
    for (let i = 0; i < numRows; i++) {
        table += '<tr class="border-b border-white/10">';
        const inputs = [];

        for (let j = vars - 1; j >= 0; j--) {
            const bit = (i >> j) & 1;
            inputs.push(bit);
            table += `<td class="p-2 text-center font-mono">${bit}</td>`;
        }

        // Calcular salida basada en la operación
        let result = inputs[0];
        for (let k = 1; k < inputs.length; k++) {
            switch (operation) {
                case 'AND': result = result & inputs[k]; break;
                case 'OR': result = result | inputs[k]; break;
                case 'XOR': result = result ^ inputs[k]; break;
                case 'NAND': result = result & inputs[k]; break;
                case 'NOR': result = result | inputs[k]; break;
            }
        }

        if (operation === 'NAND' || operation === 'NOR') {
            result = result ? 0 : 1;
        }

        table += `<td class="p-2 text-center font-mono font-bold ${result ? 'text-green-400' : 'text-red-400'}">${result}</td>`;
        table += '</tr>';
    }

    table += '</tbody></table>';
    output.innerHTML = table;

    showToast('Tabla de verdad generada', 'success');
}

// ASCII Converter
function convertASCII() {
    const input = document.getElementById('asciiInput').value;

    if (!input) {
        showToast('Por favor ingresa un texto', 'error');
        return;
    }

    try {
        const decimal = Array.from(input).map(char => char.charCodeAt(0)).join(' ');
        const hex = Array.from(input).map(char => char.charCodeAt(0).toString(16).toUpperCase()).join(' ');
        const binary = Array.from(input).map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');

        document.getElementById('asciiDecimal').textContent = decimal;
        document.getElementById('asciiHex').textContent = hex;
        document.getElementById('asciiBinary').textContent = binary;

        document.getElementById('asciiResult').classList.remove('hidden');
        showToast('Texto convertido a ASCII', 'success');

    } catch (error) {
        showToast('Error en la conversión: ' + error.message, 'error');
    }
}

// BCD Converter
function convertBCD() {
    const input = document.getElementById('bcdInput').value;

    if (!input || isNaN(input)) {
        showToast('Por favor ingresa un número decimal válido', 'error');
        return;
    }

    try {
        const digits = input.split('');
        const bcd = digits.map(digit => parseInt(digit).toString(2).padStart(4, '0')).join(' ');

        document.getElementById('bcdOutput').textContent = bcd;
        document.getElementById('bcdResult').classList.remove('hidden');

        showToast('Número convertido a BCD', 'success');

    } catch (error) {
        showToast('Error en la conversión: ' + error.message, 'error');
    }
}

// Gray Code Converter
function convertToGray() {
    const input = document.getElementById('grayInput').value.trim();

    if (!input || !/^[01]+$/.test(input)) {
        showToast('Por favor ingresa un número binario válido', 'error');
        return;
    }

    try {
        let gray = input[0]; // First bit remains the same

        for (let i = 1; i < input.length; i++) {
            gray += (parseInt(input[i - 1]) ^ parseInt(input[i])).toString();
        }

        document.getElementById('grayOutput').textContent = gray;
        document.getElementById('grayResult').classList.remove('hidden');

        showToast('Convertido a código Gray', 'success');

    } catch (error) {
        showToast('Error en la conversión: ' + error.message, 'error');
    }
}

function convertFromGray() {
    const input = document.getElementById('grayInput').value.trim();

    if (!input || !/^[01]+$/.test(input)) {
        showToast('Por favor ingresa un código Gray válido', 'error');
        return;
    }

    try {
        let binary = input[0]; // First bit remains the same

        for (let i = 1; i < input.length; i++) {
            binary += (parseInt(binary[i - 1]) ^ parseInt(input[i])).toString();
        }

        document.getElementById('grayOutput').textContent = binary;
        document.getElementById('grayResult').classList.remove('hidden');

        showToast('Convertido de código Gray a binario', 'success');

    } catch (error) {
        showToast('Error en la conversión: ' + error.message, 'error');
    }
}

// Boolean Simplifier
function simplifyBoolean() {
    const expr = document.getElementById('boolExpr').value.trim();

    if (!expr) {
        showToast('Por favor ingresa una expresión booleana', 'error');
        return;
    }

    try {
        // Básico simplificación (this is a simplified version)
        let simplified = expr;
        let canonical = expr;

        // Básico rules
        simplified = simplified.replace(/A\+A/g, 'A');
        simplified = simplified.replace(/A\.A/g, 'A');
        simplified = simplified.replace(/A\+0/g, 'A');
        simplified = simplified.replace(/A\.1/g, 'A');
        simplified = simplified.replace(/A\+1/g, '1');
        simplified = simplified.replace(/A\.0/g, '0');

        document.getElementById('originalExpr').textContent = expr;
        document.getElementById('simplified').textContent = simplified;
        document.getElementById('canonical').textContent = canonical;

        document.getElementById('booleanResult').classList.remove('hidden');
        showToast('Expresión booleana simplificada', 'success');

    } catch (error) {
        showToast('Error en la simplificación: ' + error.message, 'error');
    }
}

function expandBoolean() {
    const expr = document.getElementById('boolExpr').value.trim();

    if (!expr) {
        showToast('Por favor ingresa una expresión booleana', 'error');
        return;
    }

    // Básico expansion logic would go here
    document.getElementById('simplified').textContent = expr + ' (expandida)';
    showToast('Expresión booleana expandida', 'success');
}

// Circuit Analyzer
function analyzeCircuit() {
    const description = document.getElementById('circuitDescription').value.trim();

    if (!description) {
        showToast('Por favor describe el circuito', 'error');
        return;
    }

    const analysis = document.getElementById('circuitAnalysis');

    // Análisis simple basado en palabras clave
    let result = 'Análisis del circuito:\n\n';

    if (description.toLowerCase().includes('flip-flop')) {
        result += '• Circuito secuencial detectado\n';
        result += '• Requiere señal de reloj\n';
        result += '• Almacena 1 bit de información\n';
    }

    if (description.toLowerCase().includes('counter')) {
        result += '• Contador detectado\n';
        result += '• Circuito secuencial\n';
        result += '• Incrementa en cada ciclo de reloj\n';
    }

    if (description.toLowerCase().includes('mux')) {
        result += '• Multiplexor detectado\n';
        result += '• Circuito combinacional\n';
        result += '• Selecciona una entrada basada en control\n';
    }

    result += '\nRecomendaciones:\n';
    result += '• Verificar timing constraints\n';
    result += '• Considerar condiciones de reset\n';
    result += '• Validar con simulación\n';

    analysis.innerHTML = `<pre class="text-sm text-gray-300 whitespace-pre-wrap">${result}</pre>`;
    analysis.classList.remove('hidden');

    showToast('Circuito analizado', 'success');
}

// Funciones auxiliares
function generateQR() {
    const input = document.getElementById('qrInput').value.trim();

    if (!input) {
        showToast('Por favor ingresa texto o URL', 'error');
        return;
    }

    // Simple QR placeholder (would need QR library in real implementación)
    const qrCode = document.getElementById('qrCode');
    qrCode.innerHTML = `<div class="w-32 h-32 bg-white border-2 border-gray-300 flex items-center justify-center text-black text-xs">QR: ${input.substring(0, 10)}...</div>`;

    document.getElementById('qrResult').classList.remove('hidden');
    showToast('Código QR generado', 'success');
}

function generatePalette() {
    const baseColor = document.getElementById('baseColor').value;
    const palette = document.getElementById('colorPalette');

    // Generate color variations
    const colors = [
        baseColor,
        adjustBrightness(baseColor, 20),
        adjustBrightness(baseColor, -20),
        adjustBrightness(baseColor, 40),
        adjustBrightness(baseColor, -40)
    ];

    palette.innerHTML = colors.map(color =>
        `<div class="h-16 rounded-lg border border-white/20" style="background-color: ${color}">
            <div class="p-2 text-xs font-mono text-white bg-black/50 rounded-t-lg">${color}</div>
        </div>`
    ).join('');

    document.getElementById('paletteResult').classList.remove('hidden');
    showToast('Paleta de colores generada', 'success');
}

function adjustBrightness(hex, percent) {
    // Simple brightness adjustment
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Convertiridor de Unidades
function convertUnits() {
    const value = parseFloat(document.getElementById('unitValue')?.value);
    const fromUnit = document.getElementById('unitFrom')?.value;
    const toUnit = document.getElementById('unitTo')?.value;

    if (isNaN(value)) {
        showToast('Please enter a valid value', 'error');
        return;
    }

    try {
        const multipliers = {
            'mV': 0.001,
            'V': 1,
            'kV': 1000
        };

        const baseValue = value * multipliers[fromUnit];
        const result = baseValue / multipliers[toUnit];

        const outputEl = document.getElementById('unitOutput');
        const resultDiv = document.getElementById('unitResult');

        if (outputEl) outputEl.textContent = `${result.toFixed(6)} ${toUnit}`;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast(`${value} ${fromUnit} = ${result.toFixed(6)} ${toUnit}`, 'success');

    } catch (error) {
        console.error('❌ Unit conversion error:', error);
        showToast('Error in conversion: ' + error.message, 'error');
    }
}

// Karnaugh Map Generator (simplified)
function generateKMap() {
    const func = document.getElementById('booleanFunction').value.trim();
    const vars = parseInt(document.getElementById('kmapVars').value);

    if (!func) {
        showToast('Por favor ingresa una función booleana', 'error');
        return;
    }

    const output = document.getElementById('kmapOutput');

    // Simple K-map placeholder
    let kmap = '<div class="text-center"><h4 class="text-lg font-bold mb-4">Mapa de Karnaugh</h4>';
    kmap += '<div class="grid grid-cols-4 gap-1 max-w-xs mx-auto">';

    for (let i = 0; i < Math.pow(2, vars); i++) {
        kmap += `<div class="w-12 h-12 bg-white/10 border border-white/20 rounded flex items-center justify-center font-mono">${Math.floor(Math.random() * 2)}</div>`;
    }

    kmap += '</div></div>';
    output.innerHTML = kmap;

    showToast('Mapa de Karnaugh generado', 'success');
}

console.log('DigitalForge JavaScript cargado correctamente');

// Simplificador Booleano
function simplifyBoolean() {
    const expr = document.getElementById('boolExpr')?.value.trim();

    if (!expr) {
        showToast('Por favor ingresa una expresión booleana', 'error');
        return;
    }

    try {
        // Simplificación básica
        let simplified = expr;
        let canonical = expr;

        // Aplicar reglas básicas
        simplified = simplified.replace(/A\+A/g, 'A');
        simplified = simplified.replace(/A\.A/g, 'A');
        simplified = simplified.replace(/A\+0/g, 'A');
        simplified = simplified.replace(/A\.1/g, 'A');
        simplified = simplified.replace(/A\+1/g, '1');
        simplified = simplified.replace(/A\.0/g, '0');

        const originalEl = document.getElementById('originalExpr');
        const simplifiedEl = document.getElementById('simplified');
        const canonicalEl = document.getElementById('canonical');
        const resultDiv = document.getElementById('boolResult');

        if (originalEl) originalEl.textContent = expr;
        if (simplifiedEl) simplifiedEl.textContent = simplified;
        if (canonicalEl) canonicalEl.textContent = canonical;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast('Expresión simplificada', 'success');

    } catch (error) {
        console.error('❌ Boolean simplificación error:', error);
        showToast('Error al simplificar: ' + error.message, 'error');
    }
}

// Analizador de Circuitos
function analyzeCircuit() {
    const desc = document.getElementById('circuitDesc')?.value.trim();

    if (!desc) {
        showToast('Por favor describe el circuito', 'error');
        return;
    }

    try {
        const resultEl = document.getElementById('analysisResult');
        const analysisDiv = document.getElementById('circuitAnalysis');

        // Análisis básico
        const analysis = `
            Componentes detectados: ${desc.split(' ').length} palabras
            Longitud de descripción: ${desc.length} caracteres
            Análisis completado exitosamente
        `;

        if (resultEl) resultEl.textContent = analysis;
        if (analysisDiv) {
            analysisDiv.classList.remove('hidden');
            analysisDiv.setAttribute('aria-live', 'polite');
        }

        showToast('Circuito analizado', 'success');

    } catch (error) {
        console.error('❌ Circuit analysis error:', error);
        showToast('Error al analizar: ' + error.message, 'error');
    }
}

// Calculadora de Potencia
function calculatePower() {
    const input = document.getElementById('powerInput')?.value.trim();

    if (!input || isNaN(input)) {
        showToast('Por favor ingresa un exponente válido', 'error');
        return;
    }

    const exp = parseInt(input, 10);

    if (exp < 0 || exp > 53) {
        showToast('Exponente debe estar entre 0 y 53', 'warning');
        return;
    }

    try {
        const result = Math.pow(2, exp);

        const outputEl = document.getElementById('powerOutput');
        const resultDiv = document.getElementById('powerResult');

        if (outputEl) outputEl.textContent = result.toLocaleString();
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast(`2^${exp} = ${result.toLocaleString()}`, 'success');

    } catch (error) {
        console.error('❌ Power cálculo error:', error);
        showToast('Error en el cálculo: ' + error.message, 'error');
    }
}

// Generador de Máscaras
function generateMask(type) {
    const bits = parseInt(document.getElementById('maskBits')?.value);

    if (isNaN(bits) || bits <= 0 || bits > 64) {
        showToast('Por favor ingresa un número de bits válido (1-64)', 'error');
        return;
    }

    try {
        let mask;

        if (type === 'all') {
            mask = '1'.repeat(bits);
        } else if (type === 'none') {
            mask = '0'.repeat(bits);
        } else {
            mask = '0'.repeat(bits);
        }

        const outputEl = document.getElementById('maskOutput');
        const resultDiv = document.getElementById('maskResult');

        if (outputEl) outputEl.textContent = mask;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast(`Máscara de ${bits} bits generada`, 'success');

    } catch (error) {
        console.error('❌ Mask generation error:', error);
        showToast('Error al generar máscara: ' + error.message, 'error');
    }
}


// Diseñador de Circuitos
// NOTA: El código del Diseñador de Circuitos se movió a circuit-designer.js
// Esta sección está comentada para evitar conflictos

/*
let circuitComponents = [];
let canvas = null;
let ctx = null;

// Inicializar canvas
function initCircuitCanvas() {
    canvas = document.getElementById('logicCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
}

// Agregar componente to circuit
function addComponent(type) {
    const component = {
        id: Date.now(),
        type: type,
        x: Math.random() * 300 + 50,
        y: Math.random() * 200 + 50,
        state: 0
    };

    circuitComponents.push(component);
    updateComponentCount();
    drawCircuit();
    showToast(`${type.toUpperCase()} component added`, 'success');
}

// Limpiar canvas
function clearCanvas() {
    circuitComponents = [];
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    updateComponentCount();
    showToast('Canvas cleared', 'success');
}
*/

/*
// Actualizar contador de componentes
function updateComponentCount() {
    const countEl = document.getElementById('componentCount');
    if (countEl) {
        countEl.textContent = `${circuitComponents.length} components`;
    }
}

// Dibujar circuito
function drawCircuit() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    circuitComponents.forEach(comp => {
        ctx.fillStyle = getComponentColor(comp.type);
        ctx.beginPath();
        ctx.arc(comp.x, comp.y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(comp.type.toUpperCase(), comp.x, comp.y + 35);
    });
}

// Obtener componente color
function getComponentColor(type) {
    const colors = {
        'input': '#10b981',
        'output': '#f59e0b',
        'and': '#3b82f6',
        'or': '#a855f7',
        'not': '#ef4444',
        'xor': '#ec4899'
    };
    return colors[type] || '#6b7280';
}

// Simular circuito
function simulateCircuit() {
    if (circuitComponents.length === 0) {
        showToast('Add components first', 'warning');
        return;
    }

    showToast('Simulation started', 'success');
    // Simulation logic here
}

// Step simulation
function stepSimulation() {
    showToast('Step forward', 'info');
    // Step logic here
}

// Exportar circuito
function exportCircuit() {
    if (circuitComponents.length === 0) {
        showToast('No circuit to export', 'warning');
        return;
    }

    const data = JSON.stringify(circuitComponents, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circuit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Circuit exported', 'success');
}
*/

// Karnaugh Map Generator
function generateKMap() {
    const vars = parseInt(document.getElementById('kmapVars')?.value || 2);
    const outputDiv = document.getElementById('kmapOutput');
    const gridDiv = document.getElementById('kmapGrid');

    if (!gridDiv || !outputDiv) return;

    const size = Math.pow(2, vars);
    const gridSize = Math.sqrt(size);

    gridDiv.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridDiv.innerHTML = '';

    for (let i = 0; i < size; i++) {
        const cell = document.createElement('div');
        cell.className = 'p-3 bg-white/5 border border-white/10 rounded text-center cursor-pointer hover:bg-white/10 transition-colors';
        cell.textContent = Math.random() > 0.5 ? '1' : '0';
        cell.onclick = () => {
            cell.textContent = cell.textContent === '1' ? '0' : '1';
        };
        gridDiv.appendChild(cell);
    }

    outputDiv.classList.remove('hidden');
    showToast(`${vars}-variable K-Map generated`, 'success');
}

// Generador FSM
function generateFSM() {
    const states = parseInt(document.getElementById('fsmStates')?.value || 4);

    if (isNaN(states) || states < 2 || states > 8) {
        showToast('Please enter 2-8 states', 'error');
        return;
    }

    const outputDiv = document.getElementById('fsmOutput');
    const diagramDiv = document.getElementById('fsmDiagram');

    if (!outputDiv || !diagramDiv) return;

    let diagram = `State Machine with ${states} states:\n\n`;
    for (let i = 0; i < states; i++) {
        diagram += `S${i} → S${(i + 1) % states}\n`;
    }

    diagramDiv.textContent = diagram;
    outputDiv.classList.remove('hidden');
    showToast(`FSM with ${states} states generated`, 'success');
}

// Generador de Diagramas de Tiempo
function generateTiming() {
    const signals = document.getElementById('timingSignals')?.value.trim();

    if (!signals) {
        showToast('Please enter signal names', 'error');
        return;
    }

    const outputDiv = document.getElementById('timingOutput');
    const canvas = document.getElementById('timingCanvas');

    if (!outputDiv || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 128;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const signalList = signals.split(',').map(s => s.trim());
    const signalHeight = canvas.height / signalList.length;

    signalList.forEach((signal, index) => {
        const y = index * signalHeight;

        // Draw signal name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(signal, 5, y + 20);

        // Draw waveform
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 60; x < canvas.width; x += 40) {
            const high = Math.random() > 0.5;
            ctx.lineTo(x, y + (high ? 10 : signalHeight - 10));
            ctx.lineTo(x + 40, y + (high ? 10 : signalHeight - 10));
        }

        ctx.stroke();
    });

    outputDiv.classList.remove('hidden');
    showToast('Timing diagram generated', 'success');
}

// Inicializar circuit designer when tab is opened
// NOTE: Moved to circuit-designer.js
/*
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initCircuitCanvas();
    }, 1000);
});
*/


// Analizador de Tiempo
function analyzeTiming() {
    const freq = parseFloat(document.getElementById('clockFreq')?.value);
    const delay = parseFloat(document.getElementById('propDelay')?.value);

    if (isNaN(freq) || isNaN(delay) || freq <= 0 || delay < 0) {
        showToast('Please enter valid values', 'error');
        return;
    }

    try {
        const period = (1 / freq) * 1000; // ns
        const maxFreq = 1 / (delay / 1000); // MHz
        const setupTime = period * 0.1; // Estimate 10% of period

        const periodEl = document.getElementById('timingPeriod');
        const maxFreqEl = document.getElementById('timingMaxFreq');
        const setupEl = document.getElementById('timingSetup');
        const resultDiv = document.getElementById('timingAnalysis');

        if (periodEl) periodEl.textContent = `${period.toFixed(2)} ns`;
        if (maxFreqEl) maxFreqEl.textContent = `${maxFreq.toFixed(2)} MHz`;
        if (setupEl) setupEl.textContent = `${setupTime.toFixed(2)} ns`;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast('Timing analysis complete', 'success');

    } catch (error) {
        console.error('❌ Timing analysis error:', error);
        showToast('Error in analysis: ' + error.message, 'error');
    }
}

// Unit Converter
function convertUnits() {
    const value = parseFloat(document.getElementById('unitValue')?.value);
    const fromUnit = document.getElementById('unitFrom')?.value;
    const toUnit = document.getElementById('unitTo')?.value;

    if (isNaN(value)) {
        showToast('Please enter a valid value', 'error');
        return;
    }

    try {
        const multipliers = {
            'mV': 0.001,
            'V': 1,
            'kV': 1000
        };

        const baseValue = value * multipliers[fromUnit];
        const result = baseValue / multipliers[toUnit];

        const outputEl = document.getElementById('unitOutput');
        const resultDiv = document.getElementById('unitResult');

        if (outputEl) outputEl.textContent = `${result.toFixed(6)} ${toUnit}`;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast(`${value} ${fromUnit} = ${result.toFixed(6)} ${toUnit}`, 'success');

    } catch (error) {
        console.error('❌ Unit conversion error:', error);
        showToast('Error in conversion: ' + error.message, 'error');
    }
}


// Generador K-Map
function generateKMap() {
    const vars = parseInt(document.getElementById('kmapVars')?.value || 2);
    const outputDiv = document.getElementById('kmapOutput');
    const gridDiv = document.getElementById('kmapGrid');

    if (!gridDiv || !outputDiv) return;

    const size = Math.pow(2, vars);
    const gridSize = Math.sqrt(size);

    gridDiv.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridDiv.innerHTML = '';

    for (let i = 0; i < size; i++) {
        const cell = document.createElement('div');
        cell.className = 'p-3 bg-white/5 border border-white/10 rounded text-center cursor-pointer hover:bg-white/10 transition-colors';
        cell.textContent = Math.random() > 0.5 ? '1' : '0';
        cell.onclick = () => {
            cell.textContent = cell.textContent === '1' ? '0' : '1';
        };
        gridDiv.appendChild(cell);
    }

    outputDiv.classList.remove('hidden');
    showToast(`${vars}-variable K-Map generated`, 'success');
}

// Generador FSM
function generateFSM() {
    const states = parseInt(document.getElementById('fsmStates')?.value || 4);

    if (isNaN(states) || states < 2 || states > 8) {
        showToast('Please enter 2-8 states', 'error');
        return;
    }

    const outputDiv = document.getElementById('fsmOutput');
    const diagramDiv = document.getElementById('fsmDiagram');

    if (!outputDiv || !diagramDiv) return;

    let diagram = `State Machine with ${states} states:\n\n`;
    for (let i = 0; i < states; i++) {
        diagram += `S${i} → S${(i + 1) % states}\n`;
    }

    diagramDiv.textContent = diagram;
    outputDiv.classList.remove('hidden');
    showToast(`FSM with ${states} states generated`, 'success');
}

// Generador de Diagramas de Tiempo
function generateTiming() {
    const signals = document.getElementById('timingSignals')?.value.trim();

    if (!signals) {
        showToast('Please enter signal names', 'error');
        return;
    }

    const outputDiv = document.getElementById('timingOutput');
    const canvas = document.getElementById('timingCanvas');

    if (!outputDiv || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 128;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const signalList = signals.split(',').map(s => s.trim());
    const signalHeight = canvas.height / signalList.length;

    signalList.forEach((signal, index) => {
        const y = index * signalHeight;

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(signal, 5, y + 20);

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 60; x < canvas.width; x += 40) {
            const high = Math.random() > 0.5;
            ctx.lineTo(x, y + (high ? 10 : signalHeight - 10));
            ctx.lineTo(x + 40, y + (high ? 10 : signalHeight - 10));
        }

        ctx.stroke();
    });

    outputDiv.classList.remove('hidden');
    showToast('Timing diagram generated', 'success');
}


// Analizador de Tiempo
function analyzeTiming() {
    const freq = parseFloat(document.getElementById('clockFreq')?.value);
    const delay = parseFloat(document.getElementById('propDelay')?.value);

    if (isNaN(freq) || isNaN(delay) || freq <= 0 || delay < 0) {
        showToast('Please enter valid values', 'error');
        return;
    }

    try {
        const period = (1 / freq) * 1000; // ns
        const maxFreq = 1 / (delay / 1000); // MHz
        const setupTime = period * 0.1; // Estimate 10% of period

        const periodEl = document.getElementById('timingPeriod');
        const maxFreqEl = document.getElementById('timingMaxFreq');
        const setupEl = document.getElementById('timingSetup');
        const resultDiv = document.getElementById('timingAnalysis');

        if (periodEl) periodEl.textContent = `${period.toFixed(2)} ns`;
        if (maxFreqEl) maxFreqEl.textContent = `${maxFreq.toFixed(2)} MHz`;
        if (setupEl) setupEl.textContent = `${setupTime.toFixed(2)} ns`;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast('Timing analysis complete', 'success');

    } catch (error) {
        console.error('❌ Timing analysis error:', error);
        showToast('Error in analysis: ' + error.message, 'error');
    }
}

// UNIT CONVERTER
function convertUnits() {
    const value = parseFloat(document.getElementById('unitValue')?.value);
    const fromUnit = document.getElementById('unitFrom')?.value;
    const toUnit = document.getElementById('unitTo')?.value;

    if (isNaN(value)) {
        showToast('Please enter a valid value', 'error');
        return;
    }

    try {
        const multipliers = {
            'mV': 0.001,
            'V': 1,
            'kV': 1000
        };

        const baseValue = value * multipliers[fromUnit];
        const result = baseValue / multipliers[toUnit];

        const outputEl = document.getElementById('unitOutput');
        const resultDiv = document.getElementById('unitResult');

        if (outputEl) outputEl.textContent = `${result.toFixed(6)} ${toUnit}`;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast(`${value} ${fromUnit} = ${result.toFixed(6)} ${toUnit}`, 'success');

    } catch (error) {
        console.error('❌ Unit conversion error:', error);
        showToast('Error in conversion: ' + error.message, 'error');
    }
}

// Integración Puter para VHDL
async function getVHDLHelp() {
    if (!AppState.puterUser) {
        showToast('Please login to Puter Cloud first', 'warning');
        document.getElementById('puter-login-btn')?.click();
        return;
    }

    const template = document.getElementById('vhdlTemplate')?.value;
    const moduleName = document.getElementById('vhdlModuleName')?.value || 'my_module';

    const prompt = `You are a VHDL expert. Generate professional VHDL code with the following specifications:

Module Name: ${moduleName}
Template Type: ${template}

Requirements:
1. Use IEEE standard libraries (IEEE.STD_LOGIC_1164.ALL, IEEE.NUMERIC_STD.ALL)
2. Include proper entity and architecture declarations
3. Add synchronous reset logic (active high)
4. Include detailed comments explaining the functionality
5. Follow VHDL best practices and coding standards
6. Make the code synthesizable for FPGA implementación

Additional specifications based on template:
${template === 'entity' ? '- Create a basic entity with clock, reset, 8-bit input and output' : ''}
${template === 'flip-flop' ? '- Implement a D flip-flop with asynchronous reset' : ''}
${template === 'counter' ? '- Create an 8-bit up counter with enable signal' : ''}

Generate complete, production-ready VHDL code with proper formatting.`;

    try {
        showToast('Generating VHDL code with AI assistance...', 'info');

        // Simular respuesta de AI (en producción usarías puter.ai.chat)
        setTimeout(() => {
            generateVHDL(); // Usar la función existente por ahora
            showToast('VHDL code generated! (AI integration coming soon)', 'success');
        }, 1000);

    } catch (error) {
        console.error('❌ Puter AI error:', error);
        showToast('Error generating code: ' + error.message, 'error');
    }
}

// Integración Puter para Logisim
async function getLogisimHelp() {
    if (!AppState.puterUser) {
        showToast('Please login to Puter Cloud first', 'warning');
        document.getElementById('puter-login-btn')?.click();
        return;
    }

    const componentCount = circuitComponents.length;
    const connectionCount = circuitConnections.length;

    const prompt = `You are a digital circuit design expert specializing in Logisim.

Current Circuit Status:
- Components: ${componentCount}
- Connections: ${connectionCount}

Please provide:
1. Best practices for circuit design
2. Common mistakes to avoid
3. Optimization suggestions
4. Testing strategies
5. How to verify the circuit logic

Provide practical, actionable advice for improving this digital circuit design.`;

    try {
        showToast('Getting circuit design assistance...', 'info');

        // Simular respuesta de AI
        setTimeout(() => {
            const tips = [
                '✓ Use inputs on the left, outputs on the right',
                '✓ Group related components together',
                '✓ Test each gate individually before connecting',
                '✓ Use clear signal paths (avoid crossing wires)',
                '✓ Verify truth tables match expected behavior'
            ];

            showToast(tips.join('\n'), 'success');
        }, 1000);

    } catch (error) {
        console.error('❌ Puter AI error:', error);
        showToast('Error getting help: ' + error.message, 'error');
    }
}

// Botones de Ayuda IA
// REMOVED - These buttons don't work properly and are redundant
// AI functionality is available through:
// - AI Chat Assistant (floating robot button)
// - VHDL/Verilog AI Generate tabs

/*
function addAIHelpButtons() {
    // Removed - not needed
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAIHelpButtons);
} else {
    addAIHelpButtons();
}
*/


// Calculadora de Consumo
function calculatePowerConsumption() {
    const voltage = parseFloat(document.getElementById('powerVoltage')?.value);
    const current = parseFloat(document.getElementById('powerCurrent')?.value);

    if (isNaN(voltage) || isNaN(current) || voltage <= 0 || current < 0) {
        showToast('Please enter valid values', 'error');
        return;
    }

    try {
        const power = (voltage * current) / 1000; // Watts

        const outputEl = document.getElementById('powerConsumptionOutput');
        const resultDiv = document.getElementById('powerConsumptionResult');

        if (outputEl) outputEl.textContent = `${power.toFixed(3)} W`;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast(`Power: ${power.toFixed(3)} W`, 'success');

    } catch (error) {
        console.error('❌ Power cálculo error:', error);
        showToast('Error in cálculo: ' + error.message, 'error');
    }
}

// Analizador de Tiempo (FIXED)
function analyzeTiming() {
    const freq = parseFloat(document.getElementById('clockFreq')?.value);
    const delay = parseFloat(document.getElementById('propDelay')?.value);

    if (isNaN(freq) || isNaN(delay) || freq <= 0 || delay < 0) {
        showToast('Please enter valid values', 'error');
        return;
    }

    try {
        const period = (1 / freq) * 1000; // ns
        const maxFreq = 1 / (delay / 1000); // MHz
        const setupTime = period * 0.1; // Estimate 10% of period

        const periodEl = document.getElementById('timingPeriod');
        const maxFreqEl = document.getElementById('timingMaxFreq');
        const setupEl = document.getElementById('timingSetup');
        const resultDiv = document.getElementById('timingAnalysis');

        if (periodEl) periodEl.textContent = `${period.toFixed(2)} ns`;
        if (maxFreqEl) maxFreqEl.textContent = `${maxFreq.toFixed(2)} MHz`;
        if (setupEl) setupEl.textContent = `${setupTime.toFixed(2)} ns`;
        if (resultDiv) {
            resultDiv.classList.remove('hidden');
            resultDiv.setAttribute('aria-live', 'polite');
        }

        showToast('Timing analysis complete', 'success');

    } catch (error) {
        console.error('❌ Timing analysis error:', error);
        showToast('Error in analysis: ' + error.message, 'error');
    }
}

// Generador FSM (FIXED)
function generateFSM() {
    const states = parseInt(document.getElementById('fsmStates')?.value || 4);

    if (isNaN(states) || states < 2 || states > 8) {
        showToast('Please enter 2-8 states', 'error');
        return;
    }

    const outputDiv = document.getElementById('fsmOutput');
    const diagramDiv = document.getElementById('fsmDiagram');

    if (!outputDiv || !diagramDiv) return;

    let diagram = `State Machine with ${states} states:\n\n`;
    for (let i = 0; i < states; i++) {
        diagram += `S${i} → S${(i + 1) % states}\n`;
    }

    diagramDiv.textContent = diagram;
    outputDiv.classList.remove('hidden');
    showToast(`FSM with ${states} states generated`, 'success');
}

// Generador de Diagramas de Tiempo (FIXED)
function generateTiming() {
    const signals = document.getElementById('timingSignals')?.value.trim();

    if (!signals) {
        showToast('Please enter signal names', 'error');
        return;
    }

    const outputDiv = document.getElementById('timingOutput');
    const canvas = document.getElementById('timingCanvas');

    if (!outputDiv || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 128;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const signalList = signals.split(',').map(s => s.trim());
    const signalHeight = canvas.height / signalList.length;

    signalList.forEach((signal, index) => {
        const y = index * signalHeight;

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(signal, 5, y + 20);

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 60; x < canvas.width; x += 40) {
            const high = Math.random() > 0.5;
            ctx.lineTo(x, y + (high ? 10 : signalHeight - 10));
            ctx.lineTo(x + 40, y + (high ? 10 : signalHeight - 10));
        }

        ctx.stroke();
    });

    outputDiv.classList.remove('hidden');
    showToast('Timing diagram generated', 'success');
}

// Integración Puter
async function getVHDLHelp() {
    if (typeof puter === 'undefined') {
        showToast('Puter.js not loaded', 'error');
        return;
    }

    try {
        const isSignedIn = await puter.auth.isSignedIn();

        if (!isSignedIn) {
            showToast('Please login to Puter Cloud first', 'warning');
            await puter.auth.signIn();
            return;
        }

        const template = document.getElementById('vhdlTemplate')?.value || 'entity';
        const moduleName = document.getElementById('vhdlModuleName')?.value || 'my_module';

        const prompt = `You are a VHDL expert. Generate professional, synthesizable VHDL code.

SPECIFICATIONS:
- Module Name: ${moduleName}
- Template Type: ${template}
- Target: FPGA synthesis

REQUIREMENTS:
1. Use IEEE.STD_LOGIC_1164.ALL and IEEE.NUMERIC_STD.ALL
2. Include entity and architecture declarations
3. Add synchronous reset (active high)
4. Include detailed comments
5. Follow VHDL-2008 standards
6. Make code synthesizable

VHDL SYNTAX RULES:
- Entity format: entity <name> is port(...); end <name>;
- Architecture format: architecture <name> of <entity> is begin ... end <name>;
- Process format: process(clk, reset) begin ... end process;
- Signal assignment: signal_name <= value;
- Comments: -- comment text

TEMPLATE SPECIFIC:
${template === 'entity' ? '- 8-bit input/output with clock and reset' : ''}
${template === 'flip-flop' ? '- D flip-flop with async reset' : ''}
${template === 'counter' ? '- 8-bit up counter with enable' : ''}

Generate complete, production-ready VHDL code now.`;

        showToast('Generating VHDL with AI...', 'info');

        // Use Puter AI (if available in your plan)
        if (puter.ai && puter.ai.chat) {
            const response = await puter.ai.chat(prompt);
            document.getElementById('hdlOutput').textContent = response;
            AppState.hdlCode = response;
            showToast('VHDL generated with AI!', 'success');
        } else {
            // Fallback to regular generation
            generateVHDL();
            showToast('AI not available, using template', 'warning');
        }

    } catch (error) {
        console.error('❌ Puter AI error:', error);
        showToast('Error: ' + error.message, 'error');
        // Fallback
        generateVHDL();
    }
}

async function getLogisimHelp() {
    if (typeof puter === 'undefined') {
        showToast('Puter.js not loaded', 'error');
        return;
    }

    try {
        const isSignedIn = await puter.auth.isSignedIn();

        if (!isSignedIn) {
            showToast('Please login to Puter Cloud first', 'warning');
            await puter.auth.signIn();
            return;
        }

        const componentCount = circuitComponents?.length || 0;
        const connectionCount = circuitConnections?.length || 0;

        const prompt = `You are a digital circuit design expert specializing in Logisim.

CURRENT CIRCUIT:
- Components: ${componentCount}
- Connections: ${connectionCount}

LOGISIM FORMAT KNOWLEDGE:
- Components: Input, Output, AND, OR, NOT, XOR, NAND, NOR
- Connections: Wire from output to input
- Simulation: Signals propagate through gates
- Best practices: Left to right flow, clear organization

PROVIDE:
1. Design best practices for this circuit
2. Common mistakes to avoid
3. Optimization suggestions
4. Testing strategies
5. How to verify logic correctness

Give practical, actionable advice in 5 bullet points.`;

        showToast('Getting circuit design help...', 'info');

        if (puter.ai && puter.ai.chat) {
            const response = await puter.ai.chat(prompt);
            showToast(response, 'success');
        } else {
            const tips = [
                '✓ Place inputs on left, outputs on right',
                '✓ Group related components together',
                '✓ Test each gate before connecting',
                '✓ Avoid crossing wires when possible',
                '✓ Verify truth tables match expected behavior'
            ];
            showToast(tips.join('\n'), 'info');
        }

    } catch (error) {
        console.error('❌ Puter AI error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

console.log('✅ Todas las funciones de calculadora cargadas');


// Funcionalidad de Pestañas
function initTabSlider() {
    const container = document.getElementById('tabsContainer');
    const scrollLeftBtn = document.getElementById('scrollLeftBtn');
    const scrollRightBtn = document.getElementById('scrollRightBtn');
    
    if (!container || !scrollLeftBtn || !scrollRightBtn) return;
    
    // Make container scrollable
    container.style.overflowX = 'auto';
    container.style.scrollbarWidth = 'none';
    container.style.msOverflowStyle = 'none';
    
    // Check scroll position and update buttons
    function updateScrollButtons() {
        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        // Mostrar/hide left button
        if (scrollLeft > 10) {
            scrollLeftBtn.style.opacity = '1';
            scrollLeftBtn.style.pointerEvents = 'auto';
        } else {
            scrollLeftBtn.style.opacity = '0';
            scrollLeftBtn.style.pointerEvents = 'none';
        }
        
        // Mostrar/hide right button
        if (scrollLeft < scrollWidth - clientWidth - 10) {
            scrollRightBtn.style.opacity = '1';
            scrollRightBtn.style.pointerEvents = 'auto';
        } else {
            scrollRightBtn.style.opacity = '0';
            scrollRightBtn.style.pointerEvents = 'none';
        }
    }
    
    // Scroll left
    scrollLeftBtn.addEventListener('click', () => {
        container.scrollBy({
            left: -250,
            behavior: 'smooth'
        });
    });
    
    // Scroll right
    scrollRightBtn.addEventListener('click', () => {
        container.scrollBy({
            left: 250,
            behavior: 'smooth'
        });
    });
    
    // Update buttons on scroll
    container.addEventListener('scroll', updateScrollButtons);
    
    // Update buttons on resize
    window.addEventListener('resize', updateScrollButtons);
    
    // Initial update
    setTimeout(updateScrollButtons, 100);
    
    console.log('✅ Deslizador de pestañas inicializado');
}

// Inicializar tab slider after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabSlider);
} else {
    initTabSlider();
}
