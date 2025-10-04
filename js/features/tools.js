// Herramientas Avanzadas
// Calculadoras y convertidores avanzados

// Código Excess-3

function decimalToExcess3() {
    const input = document.getElementById('excess3Decimal');
    const output = document.getElementById('excess3Output');
    const result = document.getElementById('excess3Result');
    
    if (!input || !output || !result) {
        console.error('Elementos no encontrados');
        return;
    }
    
    const decimal = parseInt(input.value);
    if (isNaN(decimal) || decimal < 0) {
        alert('Ingresa un número decimal válido');
        return;
    }
    
    const digits = decimal.toString().split('');
    let excess3 = '';
    
    digits.forEach(digit => {
        const value = parseInt(digit) + 3;
        const binary = value.toString(2).padStart(4, '0');
        excess3 += binary + ' ';
    });
    
    output.textContent = excess3.trim();
    result.classList.remove('hidden');
    
    if (typeof showToast === 'function') {
        showToast('Conversión completada', 'success');
    }
}

// Código 2421

function decimalTo2421() {
    const input = document.getElementById('code2421Decimal');
    const output = document.getElementById('code2421Output');
    const result = document.getElementById('code2421Result');
    
    if (!input || !output || !result) {
        console.error('Elementos no encontrados');
        return;
    }
    
    const decimal = parseInt(input.value);
    if (isNaN(decimal) || decimal < 0 || decimal > 9) {
        alert('Ingresa un dígito válido (0-9)');
        return;
    }
    
    // Código 2421 table
    const code2421Table = {
        0: '0000',
        1: '0001',
        2: '0010',
        3: '0011',
        4: '0100',
        5: '1011',
        6: '1100',
        7: '1101',
        8: '1110',
        9: '1111'
    };
    
    output.textContent = code2421Table[decimal];
    result.classList.remove('hidden');
    
    if (typeof showToast === 'function') {
        showToast('Conversión completada', 'success');
    }
}

// Código Hamming

function generateHamming() {
    const data = document.getElementById('hammingData')?.value.trim();
    if (!data || !/^[01]+$/.test(data)) {
        showToast('Ingresa bits de datos válidos', 'warning');
        return;
    }
    
    const m = data.length;
    let r = 0;
    while (Math.pow(2, r) < m + r + 1) r++;
    
    const n = m + r;
    let hamming = new Array(n + 1).fill(0);
    
    // Colocar bits de datos
    let j = 0;
    for (let i = 1; i <= n; i++) {
        if (!isPowerOfTwo(i)) {
            hamming[i] = parseInt(data[j++]);
        }
    }
    
    // Calcular bits de paridad
    for (let i = 0; i < r; i++) {
        const pos = Math.pow(2, i);
        let parity = 0;
        for (let j = 1; j <= n; j++) {
            if (j & pos) {
                parity ^= hamming[j];
            }
        }
        hamming[pos] = parity;
    }
    
    const code = hamming.slice(1).join('');
    const parityPositions = [];
    for (let i = 0; i < r; i++) {
        parityPositions.push(Math.pow(2, i));
    }
    
    document.getElementById('hammingCode').textContent = code;
    document.getElementById('hammingParity').textContent = `Positions: ${parityPositions.join(', ')}`;
    document.getElementById('hammingResult').classList.remove('hidden');
    showToast('Código Hamming generado', 'success');
}

function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

// Calculadora CRC

function calculateCRC() {
    const data = document.getElementById('crcData')?.value.trim().toUpperCase();
    const poly = document.getElementById('crcPoly')?.value;
    
    if (!data || !/^[0-9A-F]+$/.test(data)) {
        showToast('Ingresa datos hexadecimales válidos', 'warning');
        return;
    }
    
    // Cálculo CRC simple (simplified for demo)
    let crc = 0;
    const bytes = [];
    for (let i = 0; i < data.length; i += 2) {
        bytes.push(parseInt(data.substr(i, 2), 16));
    }
    
    if (poly === 'crc16') {
        crc = crc16(bytes);
    } else if (poly === 'crc32') {
        crc = crc32(bytes);
    } else {
        crc = crc8(bytes);
    }
    
    document.getElementById('crcOutput').textContent = '0x' + crc.toString(16).toUpperCase().padStart(poly === 'crc32' ? 8 : poly === 'crc16' ? 4 : 2, '0');
    document.getElementById('crcResult').classList.remove('hidden');
    showToast('CRC calculado', 'success');
}

function crc16(bytes) {
    let crc = 0xFFFF;
    for (let byte of bytes) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) {
            if (crc & 1) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    return crc & 0xFFFF;
}

function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let byte of bytes) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ 0xEDB88320;
            } else {
                crc >>>= 1;
            }
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function crc8(bytes) {
    let crc = 0;
    for (let byte of bytes) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x80) {
                crc = (crc << 1) ^ 0x07;
            } else {
                crc <<= 1;
            }
        }
    }
    return crc & 0xFF;
}

// Codificación Manchester

function manchesterEncode() {
    const data = document.getElementById('manchesterData')?.value.trim();
    if (!data || !/^[01]+$/.test(data)) {
        showToast('Ingresa bits de datos válidos', 'warning');
        return;
    }
    
    let encoded = '';
    for (let bit of data) {
        encoded += bit === '0' ? '01' : '10';
    }
    
    document.getElementById('manchesterEncoded').textContent = encoded;
    document.getElementById('manchesterResult').classList.remove('hidden');
    showToast('Codificación completada', 'success');
}

// Generador de Paridad

function calculateParity(type) {
    const data = document.getElementById('parityData')?.value.trim();
    if (!data || !/^[01]+$/.test(data)) {
        showToast('Ingresa bits de datos válidos', 'warning');
        return;
    }
    
    let ones = 0;
    for (let bit of data) {
        if (bit === '1') ones++;
    }
    
    let parityBit;
    if (type === 'even') {
        parityBit = ones % 2 === 0 ? '0' : '1';
    } else {
        parityBit = ones % 2 === 0 ? '1' : '0';
    }
    
    document.getElementById('parityBit').textContent = parityBit;
    document.getElementById('parityFull').textContent = data + parityBit;
    document.getElementById('parityResult').classList.remove('hidden');
    showToast(`Paridad ${type} calculada`, 'success');
}

// Algoritmo de Booth

function boothMultiply() {
    const m = parseInt(document.getElementById('boothM')?.value);
    const q = parseInt(document.getElementById('boothQ')?.value);
    
    if (isNaN(m) || isNaN(q)) {
        showToast('Ingresa números válidos', 'warning');
        return;
    }
    
    const product = m * q;
    const binary = product.toString(2);
    
    document.getElementById('boothProduct').textContent = product;
    document.getElementById('boothBinary').textContent = binary;
    document.getElementById('boothResult').classList.remove('hidden');
    showToast('Multiplicación completada', 'success');
}

// Solucionador K-Map

function solveKMap() {
    const vars = parseInt(document.getElementById('kmapVars')?.value);
    const minterms = document.getElementById('kmapMinterms')?.value.trim().split(',').map(x => parseInt(x.trim()));
    
    if (minterms.some(isNaN)) {
        showToast('Ingresa minterms válidos', 'warning');
        return;
    }
    
    // Solucionador K-Map simplificado (implementación básica)
    let expression = 'F = ';
    const varNames = ['A', 'B', 'C', 'D'];
    
    if (vars === 2) {
        expression += simplify2Var(minterms);
    } else if (vars === 3) {
        expression += simplify3Var(minterms);
    } else {
        expression += simplify4Var(minterms);
    }
    
    document.getElementById('kmapExpression').textContent = expression;
    document.getElementById('kmapResult').classList.remove('hidden');
    showToast('K-Map simplificado', 'success');
}

function simplify2Var(minterms) {
    // Básico 2-variable simplificación
    const terms = [];
    if (minterms.includes(0) && minterms.includes(1)) terms.push("A'");
    if (minterms.includes(2) && minterms.includes(3)) terms.push("A");
    if (minterms.includes(0) && minterms.includes(2)) terms.push("B'");
    if (minterms.includes(1) && minterms.includes(3)) terms.push("B");
    
    return terms.length > 0 ? terms.join(' + ') : minterms.map(m => `m${m}`).join(' + ');
}

function simplify3Var(minterms) {
    return minterms.map(m => `m${m}`).join(' + ');
}

function simplify4Var(minterms) {
    return minterms.map(m => `m${m}`).join(' + ');
}

// Quine-McCluskey

function quineMcCluskey() {
    const minterms = document.getElementById('qmMinterms')?.value.trim().split(',').map(x => parseInt(x.trim()));
    
    if (minterms.some(isNaN)) {
        showToast('Ingresa minterms válidos', 'warning');
        return;
    }
    
    // Algoritmo QM simplificado
    const primes = minterms.map(m => m.toString(2).padStart(4, '0'));
    
    document.getElementById('qmPrimes').textContent = primes.join(', ');
    document.getElementById('qmMinimal').textContent = minterms.map(m => `m${m}`).join(' + ');
    document.getElementById('qmResult').classList.remove('hidden');
    showToast('Minimización completada', 'success');
}

// Codificador FSM

function encodeFSM() {
    const states = parseInt(document.getElementById('fsmStates')?.value);
    const encoding = document.getElementById('fsmEncoding')?.value;
    
    if (isNaN(states) || states < 2) {
        showToast('Ingresa un número válido de estados', 'warning');
        return;
    }
    
    let encoded = [];
    
    if (encoding === 'binary') {
        const bits = Math.ceil(Math.log2(states));
        for (let i = 0; i < states; i++) {
            encoded.push(`S${i}: ${i.toString(2).padStart(bits, '0')}`);
        }
    } else if (encoding === 'onehot') {
        for (let i = 0; i < states; i++) {
            const code = '0'.repeat(i) + '1' + '0'.repeat(states - i - 1);
            encoded.push(`S${i}: ${code}`);
        }
    } else { // gray
        for (let i = 0; i < states; i++) {
            const binary = i.toString(2).padStart(Math.ceil(Math.log2(states)), '0');
            let gray = binary[0];
            for (let j = 1; j < binary.length; j++) {
                gray += (parseInt(binary[j-1]) ^ parseInt(binary[j])).toString();
            }
            encoded.push(`S${i}: ${gray}`);
        }
    }
    
    document.getElementById('fsmEncoded').innerHTML = encoded.join('<br>');
    document.getElementById('fsmResult').classList.remove('hidden');
    showToast('Estados codificados', 'success');
}

// Calculadora CDC

function analyzeCDC() {
    const srcClk = parseFloat(document.getElementById('cdcSrcClk')?.value);
    const dstClk = parseFloat(document.getElementById('cdcDstClk')?.value);
    
    if (isNaN(srcClk) || isNaN(dstClk) || srcClk <= 0 || dstClk <= 0) {
        showToast('Ingresa frecuencias válidas', 'warning');
        return;
    }
    
    const ratio = (srcClk / dstClk).toFixed(2);
    const stages = srcClk > dstClk * 2 ? 3 : 2;
    
    document.getElementById('cdcRatio').textContent = `${ratio}:1`;
    document.getElementById('cdcStages').textContent = `${stages} FF`;
    document.getElementById('cdcResult').classList.remove('hidden');
    showToast('Análisis completado', 'success');
}

// Generador LFSR

function generateLFSR() {
    const bits = parseInt(document.getElementById('lfsrBits')?.value);
    const seed = parseInt(document.getElementById('lfsrSeed')?.value.trim(), 16);
    
    if (isNaN(seed) || seed === 0) {
        showToast('Ingresa un seed válido (hex, no cero)', 'warning');
        return;
    }
    
    // Polinomios para diferentes anchos de bit
    const polynomials = {
        4: 'x^4 + x^3 + 1',
        8: 'x^8 + x^6 + x^5 + x^4 + 1',
        16: 'x^16 + x^15 + x^13 + x^4 + 1',
        32: 'x^32 + x^22 + x^2 + x^1 + 1'
    };
    
    const taps = {
        4: [3, 2],
        8: [7, 5, 4, 3],
        16: [15, 14, 12, 3],
        32: [31, 21, 1, 0]
    };
    
    let lfsr = seed;
    const sequence = [lfsr.toString(16).toUpperCase()];
    
    for (let i = 0; i < 9; i++) {
        let bit = 0;
        for (let tap of taps[bits]) {
            bit ^= (lfsr >> tap) & 1;
        }
        lfsr = ((lfsr << 1) | bit) & ((1 << bits) - 1);
        sequence.push(lfsr.toString(16).toUpperCase().padStart(bits/4, '0'));
    }
    
    document.getElementById('lfsrPoly').textContent = polynomials[bits];
    document.getElementById('lfsrSeq').textContent = sequence.join(', ');
    document.getElementById('lfsrResult').classList.remove('hidden');
    showToast('Secuencia LFSR generada', 'success');
}

// Calculadora de Metaestabilidad

function calculateMTBF() {
    const clk = parseFloat(document.getElementById('metaClk')?.value) * 1e6;
    const data = parseFloat(document.getElementById('metaData')?.value) * 1e6;
    const stages = parseInt(document.getElementById('metaStages')?.value);
    
    if (isNaN(clk) || isNaN(data) || isNaN(stages)) {
        showToast('Ingresa valores válidos', 'warning');
        return;
    }
    
    // Cálculo MTBF simplificado
    const tau = 1e-9; // 1ns
    const tw = 1e-10; // 100ps
    const mtbf = Math.exp(stages * tau / tw) / (clk * data * tw);
    
    let mtbfStr = '';
    if (mtbf > 365 * 24 * 3600) {
        mtbfStr = `${(mtbf / (365 * 24 * 3600)).toExponential(2)} years`;
    } else if (mtbf > 24 * 3600) {
        mtbfStr = `${(mtbf / (24 * 3600)).toFixed(2)} days`;
    } else {
        mtbfStr = `${mtbf.toExponential(2)} seconds`;
    }
    
    document.getElementById('metaMTBF').textContent = mtbfStr;
    document.getElementById('metaResult').classList.remove('hidden');
    showToast('MTBF calculado', 'success');
}

// Divisor de Voltaje

function calculateVoltageDivider() {
    const vin = parseFloat(document.getElementById('vdivVin')?.value);
    const vout = parseFloat(document.getElementById('vdivVout')?.value);
    const r1 = parseFloat(document.getElementById('vdivR1')?.value);
    
    if (isNaN(vin) || isNaN(vout) || isNaN(r1) || vin <= 0 || vout <= 0 || r1 <= 0) {
        showToast('Ingresa valores válidos', 'warning');
        return;
    }
    
    if (vout >= vin) {
        showToast('Vout debe ser menor que Vin', 'error');
        return;
    }
    
    const r2 = (vout * r1) / (vin - vout);
    const current = vin / (r1 + r2);
    
    document.getElementById('vdivR2').textContent = `${r2.toFixed(1)} Ω`;
    document.getElementById('vdivCurrent').textContent = `${(current * 1000).toFixed(2)} mA`;
    document.getElementById('vdivResult').classList.remove('hidden');
    showToast('Cálculo completado', 'success');
}

// Constante de Tiempo RC

function calculateRC() {
    const r = parseFloat(document.getElementById('rcR')?.value);
    const c = parseFloat(document.getElementById('rcC')?.value) * 1e-6; // Convertir µF a F
    
    if (isNaN(r) || isNaN(c) || r <= 0 || c <= 0) {
        showToast('Ingresa valores válidos', 'warning');
        return;
    }
    
    const tau = r * c;
    const tau5 = 5 * tau;
    
    let tauStr = '';
    if (tau >= 1) {
        tauStr = `${tau.toFixed(3)} s`;
    } else if (tau >= 0.001) {
        tauStr = `${(tau * 1000).toFixed(3)} ms`;
    } else {
        tauStr = `${(tau * 1000000).toFixed(3)} µs`;
    }
    
    let tau5Str = '';
    if (tau5 >= 1) {
        tau5Str = `${tau5.toFixed(3)} s`;
    } else if (tau5 >= 0.001) {
        tau5Str = `${(tau5 * 1000).toFixed(3)} ms`;
    } else {
        tau5Str = `${(tau5 * 1000000).toFixed(3)} µs`;
    }
    
    document.getElementById('rcTau').textContent = tauStr;
    document.getElementById('rc5Tau').textContent = tau5Str;
    document.getElementById('rcResult').classList.remove('hidden');
    showToast('Cálculo completado', 'success');
}

// Calculadora de Resistencia LED

function calculateLEDResistor() {
    const vs = parseFloat(document.getElementById('ledVs')?.value);
    const vf = parseFloat(document.getElementById('ledVf')?.value);
    const i = parseFloat(document.getElementById('ledI')?.value) / 1000; // Convertir a A
    
    if (isNaN(vs) || isNaN(vf) || isNaN(i) || vs <= 0 || vf <= 0 || i <= 0) {
        showToast('Ingresa valores válidos', 'warning');
        return;
    }
    
    if (vf >= vs) {
        showToast('Voltaje de alimentación insuficiente', 'error');
        return;
    }
    
    const r = (vs - vf) / i;
    const p = (vs - vf) * i;
    
    // Encontrar resistor estándar más cercano
    const standardResistors = [100, 150, 220, 330, 470, 680, 1000, 1500, 2200, 3300, 4700, 6800, 10000];
    const nearest = standardResistors.reduce((prev, curr) => 
        Math.abs(curr - r) < Math.abs(prev - r) ? curr : prev
    );
    
    document.getElementById('ledR').textContent = `${r.toFixed(1)} Ω (usar ${nearest} Ω)`;
    document.getElementById('ledP').textContent = `${(p * 1000).toFixed(2)} mW`;
    document.getElementById('ledResult').classList.remove('hidden');
    showToast('Cálculo completado', 'success');
}

// Exportar funciones
window.decimalToExcess3 = decimalToExcess3;
window.decimalTo2421 = decimalTo2421;
window.generateHamming = generateHamming;
window.calculateCRC = calculateCRC;
window.manchesterEncode = manchesterEncode;
window.calculateParity = calculateParity;
window.boothMultiply = boothMultiply;
window.solveKMap = solveKMap;
window.quineMcCluskey = quineMcCluskey;
window.encodeFSM = encodeFSM;
window.analyzeCDC = analyzeCDC;
window.generateLFSR = generateLFSR;
window.calculateMTBF = calculateMTBF;
window.calculateVoltageDivider = calculateVoltageDivider;
window.calculateRC = calculateRC;
window.calculateLEDResistor = calculateLEDResistor;

console.log('✅ Módulo de herramientas avanzadas cargado');
