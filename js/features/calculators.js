// Calculadoras para hardware

// Búsqueda de Fórmulas

function searchFormulas(query) {
    const cards = document.querySelectorAll('.formula-card');
    const noResults = document.getElementById('noFormulasFound');
    let visibleCount = 0;
    
    query = query.toLowerCase().trim();
    
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const keywords = card.getAttribute('data-keywords') || '';
        const content = card.textContent.toLowerCase();
        
        if (query === '' || title.includes(query) || keywords.includes(query) || content.includes(query)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
    
    // Re-render MathJax if available
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}

function filterFormulas(category) {
    const cards = document.querySelectorAll('.formula-card');
    const filters = document.querySelectorAll('.formula-filter');
    const noResults = document.getElementById('noFormulasFound');
    let visibleCount = 0;
    
    // Update active filter
    filters.forEach(f => f.classList.remove('active', 'bg-purple-500/20', 'text-purple-400'));
    const activeFilter = document.querySelector(`[data-category="${category}"]`);
    if (activeFilter) {
        activeFilter.classList.add('active', 'bg-purple-500/20', 'text-purple-400');
    }
    
    // Filtrar cards
    cards.forEach(card => {
        const categories = card.getAttribute('data-category') || '';
        
        if (category === 'all' || categories.includes(category)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
    
    // Re-render MathJax
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}

// Calculadoras Arduino

function calculateArduinoResistor() {
    const vin = parseFloat(document.getElementById('arduinoVin')?.value);
    const current = parseFloat(document.getElementById('arduinoCurrent')?.value) / 1000; // Convertir a A
    
    if (!vin || !current || vin <= 0 || current <= 0) {
        showToast('Por favor ingresa valores válidos', 'warning');
        return;
    }
    
    // Assuming LED forward voltage of 2V
    const vLED = 2.0;
    const vDrop = vin - vLED;
    
    if (vDrop <= 0) {
        showToast('Voltaje insuficiente para el LED', 'error');
        return;
    }
    
    const resistance = vDrop / current;
    const power = vDrop * current;
    
    // Encontrar resistor estándar más cercano
    const standardResistors = [100, 150, 220, 330, 470, 680, 1000, 1500, 2200, 3300, 4700, 6800, 10000];
    const nearest = standardResistors.reduce((prev, curr) => 
        Math.abs(curr - resistance) < Math.abs(prev - resistance) ? curr : prev
    );
    
    document.getElementById('arduinoR').textContent = `${resistance.toFixed(1)}Ω (usar ${nearest}Ω)`;
    document.getElementById('arduinoP').textContent = `${(power * 1000).toFixed(2)}mW`;
    document.getElementById('arduinoResult').classList.remove('hidden');
    
    showToast('Cálculo completado', 'success');
}

// Calculadoras Raspberry Pi

function calculateRPiResistor() {
    const voltage = parseFloat(document.getElementById('rpiModel')?.value);
    const current = parseFloat(document.getElementById('rpiCurrent')?.value) / 1000; // Convertir a A
    
    if (!current || current <= 0) {
        showToast('Por favor ingresa una corriente válida', 'warning');
        return;
    }
    
    if (current > 0.016) {
        showToast('¡Advertencia! Corriente excede 16mA máximo', 'error');
    }
    
    const vLED = 2.0;
    const vDrop = voltage - vLED;
    const resistance = vDrop / current;
    
    // Encontrar resistor estándar más cercano
    const standardResistors = [100, 150, 220, 330, 470, 680, 1000, 1500, 2200, 3300, 4700];
    const nearest = standardResistors.reduce((prev, curr) => 
        Math.abs(curr - resistance) < Math.abs(prev - resistance) ? curr : prev
    );
    
    document.getElementById('rpiR').textContent = `${resistance.toFixed(1)}Ω (usar ${nearest}Ω)`;
    document.getElementById('rpiResult').classList.remove('hidden');
    
    showToast('Cálculo completado', 'success');
}

// Calculadoras Basys3 FPGA

function calculateBasys3Clock() {
    const clockMHz = parseFloat(document.getElementById('basys3Clock')?.value);
    const divisor = parseFloat(document.getElementById('basys3Divisor')?.value);
    
    if (!clockMHz || !divisor || clockMHz <= 0 || divisor <= 0) {
        showToast('Por favor ingresa valores válidos', 'warning');
        return;
    }
    
    const clockHz = clockMHz * 1000000;
    const outputFreq = clockHz / divisor;
    const period = 1 / outputFreq;
    
    let freqStr = '';
    if (outputFreq >= 1000000) {
        freqStr = `${(outputFreq / 1000000).toFixed(3)} MHz`;
    } else if (outputFreq >= 1000) {
        freqStr = `${(outputFreq / 1000).toFixed(3)} KHz`;
    } else {
        freqStr = `${outputFreq.toFixed(3)} Hz`;
    }
    
    let periodStr = '';
    if (period >= 1) {
        periodStr = `${period.toFixed(3)} s`;
    } else if (period >= 0.001) {
        periodStr = `${(period * 1000).toFixed(3)} ms`;
    } else if (period >= 0.000001) {
        periodStr = `${(period * 1000000).toFixed(3)} µs`;
    } else {
        periodStr = `${(period * 1000000000).toFixed(3)} ns`;
    }
    
    document.getElementById('basys3Freq').textContent = freqStr;
    document.getElementById('basys3Period').textContent = periodStr;
    document.getElementById('basys3Result').classList.remove('hidden');
    
    showToast('Cálculo completado', 'success');
}

// Calculadoras ESP32

function updateESP32Current() {
    // This function is called when mode changes
}

function calculateESP32Power() {
    const current = parseFloat(document.getElementById('esp32Mode')?.value);
    const time = parseFloat(document.getElementById('esp32Time')?.value);
    
    if (!time || time <= 0) {
        showToast('Por favor ingresa un tiempo válido', 'warning');
        return;
    }
    
    const consumption = current * time; // mAh
    const batteryLife = 2000 / current; // hours with 2000mAh battery
    
    document.getElementById('esp32mAh').textContent = `${consumption.toFixed(2)} mAh`;
    document.getElementById('esp32Battery').textContent = `${batteryLife.toFixed(1)} horas`;
    document.getElementById('esp32Result').classList.remove('hidden');
    
    showToast('Cálculo completado', 'success');
}

// Calculadoras STM32

function calculateSTM32Clock() {
    const hse = parseFloat(document.getElementById('stm32HSE')?.value);
    const pll = parseFloat(document.getElementById('stm32PLL')?.value);
    
    if (!hse || !pll || hse <= 0 || pll <= 0) {
        showToast('Por favor ingresa valores válidos', 'warning');
        return;
    }
    
    const sysclk = hse * pll;
    
    if (sysclk > 72) {
        showToast('¡Advertencia! Frecuencia excede 72MHz máximo para STM32F1', 'warning');
    }
    
    document.getElementById('stm32Sysclk').textContent = `${sysclk.toFixed(1)} MHz`;
    document.getElementById('stm32Result').classList.remove('hidden');
    
    showToast('Cálculo completado', 'success');
}

// Calculadoras Logisim

function analyzeLogisimCircuit() {
    const gates = parseInt(document.getElementById('logisimGates')?.value);
    const levels = parseInt(document.getElementById('logisimLevels')?.value);
    
    if (!gates || !levels || gates <= 0 || levels <= 0) {
        showToast('Por favor ingresa valores válidos', 'warning');
        return;
    }
    
    // Estimate delay (assuming 10ns per gate level)
    const delay = levels * 10;
    
    // Complexity estimation
    let complexity = 'Baja';
    if (gates > 50 || levels > 5) {
        complexity = 'Alta';
    } else if (gates > 20 || levels > 3) {
        complexity = 'Media';
    }
    
    document.getElementById('logisimDelay').textContent = `~${delay} ns`;
    document.getElementById('logisimComplexity').textContent = complexity;
    document.getElementById('logisimResult').classList.remove('hidden');
    
    showToast('Análisis completado', 'success');
}

// Calculadoras UART

function calculateUARTDivisor() {
    const clock = parseFloat(document.getElementById('uartClock')?.value);
    const baud = parseFloat(document.getElementById('uartBaud')?.value);
    
    if (!clock || !baud || clock <= 0 || baud <= 0) {
        showToast('Por favor ingresa valores válidos', 'warning');
        return;
    }
    
    const divisor = Math.round(clock / (16 * baud));
    const actualBaud = clock / (16 * divisor);
    const error = ((actualBaud - baud) / baud) * 100;
    
    document.getElementById('uartDivisor').textContent = divisor;
    document.getElementById('uartError').textContent = `${Math.abs(error).toFixed(2)}%`;
    document.getElementById('uartResult').classList.remove('hidden');
    
    if (Math.abs(error) > 2) {
        showToast('¡Advertencia! Error mayor al 2%', 'warning');
    } else {
        showToast('Cálculo completado', 'success');
    }
}

// Calculadoras I2C

function calculateI2CPullup() {
    const voltage = parseFloat(document.getElementById('i2cVoltage')?.value);
    const capacitance = parseFloat(document.getElementById('i2cCapacitance')?.value) * 1e-12; // Convertir to F
    
    if (!capacitance || capacitance <= 0) {
        showToast('Por favor ingresa una capacitancia válida', 'warning');
        return;
    }
    
    // Standard I2C: 100kHz, Fast: 400kHz
    const riseTime = 1000e-9; // 1000ns for standard mode
    const rMin = riseTime / (0.8473 * capacitance);
    const rMax = voltage / 0.003; // 3mA minimum sink current
    
    document.getElementById('i2cRmin').textContent = `${(rMin / 1000).toFixed(1)} kΩ`;
    document.getElementById('i2cRmax').textContent = `${(rMax / 1000).toFixed(1)} kΩ`;
    document.getElementById('i2cResult').classList.remove('hidden');
    
    showToast('Cálculo completado', 'success');
}

// Calculadoras PWM

function calculatePWM() {
    const freq = parseFloat(document.getElementById('pwmFreq')?.value);
    const duty = parseFloat(document.getElementById('pwmDuty')?.value);
    
    if (!freq || !duty || freq <= 0 || duty < 0 || duty > 100) {
        showToast('Por favor ingresa valores válidos', 'warning');
        return;
    }
    
    const period = 1 / freq;
    const timeOn = period * (duty / 100);
    const timeOff = period - timeOn;
    
    let periodStr = '';
    if (period >= 0.001) {
        periodStr = `${(period * 1000).toFixed(3)} ms`;
    } else {
        periodStr = `${(period * 1000000).toFixed(3)} µs`;
    }
    
    let onStr = '';
    if (timeOn >= 0.001) {
        onStr = `${(timeOn * 1000).toFixed(3)} ms`;
    } else {
        onStr = `${(timeOn * 1000000).toFixed(3)} µs`;
    }
    
    let offStr = '';
    if (timeOff >= 0.001) {
        offStr = `${(timeOff * 1000).toFixed(3)} ms`;
    } else {
        offStr = `${(timeOff * 1000000).toFixed(3)} µs`;
    }
    
    document.getElementById('pwmPeriod').textContent = periodStr;
    document.getElementById('pwmOn').textContent = onStr;
    document.getElementById('pwmOff').textContent = offStr;
    document.getElementById('pwmResult').classList.remove('hidden');
    
    showToast('Cálculo completado', 'success');
}

// Exportar funciones
window.searchFormulas = searchFormulas;
window.filterFormulas = filterFormulas;
window.calculateArduinoResistor = calculateArduinoResistor;
window.calculateRPiResistor = calculateRPiResistor;
window.calculateBasys3Clock = calculateBasys3Clock;
window.updateESP32Current = updateESP32Current;
window.calculateESP32Power = calculateESP32Power;
window.calculateSTM32Clock = calculateSTM32Clock;
window.analyzeLogisimCircuit = analyzeLogisimCircuit;
window.calculateUARTDivisor = calculateUARTDivisor;
window.calculateI2CPullup = calculateI2CPullup;
window.calculatePWM = calculatePWM;

console.log('✅ Módulo de calculadoras avanzadas cargado');
