// AI ASSISTANT - DIGITAL FORGE
// AI Assistant specialized in Digital Logic

const AIAssistant = {
    isOpen: false,
    messages: [],
    systemPrompt: `You are Digital Forge AI, an expert digital engineering assistant specializing in:

CORE EXPERTISE:
- Digital Logic Design (combinational & sequential circuits)
- Computer Architecture (CPU, memory, I/O systems, pipeline, cache)
- HDL: VHDL and Verilog (syntax, best practices, synthesis)
- FPGA Development (Xilinx, Intel/Altera, constraints, timing)
- XDC Constraints (timing, placement, I/O)
- Logisim Circuit Simulation
- Arduino/Microcontroller Programming
- Boolean Algebra & Karnaugh Maps
- Timing Analysis (setup/hold time, clock domains, metastability)
- Memory Systems (SRAM, DRAM, ROM, Flash)

RESPONSE GUIDELINES:
1. Be precise and technically accurate
2. Provide working code examples when relevant
3. Explain concepts clearly for educational value
4. Use proper terminology (flip-flop, not latch when inappropriate)
5. Include comments in code
6. Mention common pitfalls and best practices
7. For HDL: ensure synthesizable code
8. For circuits: explain logic flow
9. Format code properly with syntax highlighting hints

CODE FORMATTING:
- Use markdown code blocks with language specification
- For VHDL: \`\`\`vhdl
- For Verilog: \`\`\`verilog
- For Arduino/C: \`\`\`c
- Add inline comments for clarity
- Use proper indentation

RESPONSE FORMAT:
- Start with a direct answer
- Provide code/examples if applicable
- Add explanations and context
- Suggest related concepts or improvements

You are helpful, professional, and educational. Always verify your technical accuracy.`
};

// Documentation database
const Documentation = {
    'digital-logic': {
        title: 'Lógica Digital',
        content: `
# Lógica Digital - Fundamentos

## Compuertas Lógicas Básicas

### AND (Y)
- Símbolo: · o ∧
- Salida 1 solo si TODAS las entradas son 1
- Tabla de verdad:
  A | B | Y
  0 | 0 | 0
  0 | 1 | 0
  1 | 0 | 0
  1 | 1 | 1

### OR (O)
- Símbolo: + o ∨
- Salida 1 si AL MENOS una entrada es 1
- Tabla de verdad:
  A | B | Y
  0 | 0 | 0
  0 | 1 | 1
  1 | 0 | 1
  1 | 1 | 1

### NOT (NO)
- Símbolo: ¬ o '
- Invierte la entrada
- Tabla de verdad:
  A | Y
  0 | 1
  1 | 0

### XOR (O Exclusivo)
- Símbolo: ⊕
- Salida 1 si las entradas son DIFERENTES
- Tabla de verdad:
  A | B | Y
  0 | 0 | 0
  0 | 1 | 1
  1 | 0 | 1
  1 | 1 | 0

## Álgebra Booleana

### Leyes Fundamentales
1. Identidad: A + 0 = A, A · 1 = A
2. Nulo: A + 1 = 1, A · 0 = 0
3. Idempotencia: A + A = A, A · A = A
4. Complemento: A + A' = 1, A · A' = 0
5. Involución: (A')' = A

### Leyes de De Morgan
- (A + B)' = A' · B'
- (A · B)' = A' + B'

## Circuitos Combinacionales
- Salida depende SOLO de las entradas actuales
- Ejemplos: sumadores, multiplexores, decodificadores

## Circuitos Secuenciales
- Salida depende de entradas Y estado previo
- Tienen memoria (flip-flops, latches)
- Ejemplos: contadores, registros, máquinas de estado
`
    },
    'computer-arch': {
        title: 'Arquitectura de Computadoras',
        content: `
# Arquitectura de Computadoras

## Componentes Principales

### CPU (Unidad Central de Procesamiento)
1. **ALU (Arithmetic Logic Unit)**
   - Operaciones aritméticas (+, -, *, /)
   - Operaciones lógicas (AND, OR, XOR, NOT)
   
2. **Unidad de Control**
   - Decodifica instrucciones
   - Genera señales de control
   - Coordina operaciones

3. **Registros**
   - Almacenamiento rápido dentro del CPU
   - PC (Program Counter)
   - IR (Instruction Register)
   - Registros de propósito general

### Memoria
1. **Jerarquía de Memoria**
   - Registros (más rápido, más caro)
   - Cache L1, L2, L3
   - RAM (DRAM)
   - Almacenamiento (SSD, HDD)

2. **SRAM vs DRAM**
   - SRAM: Más rápida, más cara, no necesita refresh
   - DRAM: Más lenta, más barata, necesita refresh

### Buses
- **Bus de Datos**: Transfiere datos
- **Bus de Direcciones**: Especifica ubicación
- **Bus de Control**: Señales de control (R/W, Clock, etc.)

## Pipeline
- Divide ejecución en etapas
- Aumenta throughput
- Etapas típicas: Fetch, Decode, Execute, Memory, Write-back

## Cache
- Memoria rápida entre CPU y RAM
- Principio de localidad (temporal y espacial)
- Políticas: Direct-mapped, Set-associative, Fully-associative
`
    },
    'vhdl': {
        title: 'VHDL',
        content: `
# VHDL - VHSIC Hardware Description Language

## Estructura Básica

### Entity (Interfaz)
\`\`\`vhdl
entity mi_modulo is
    port (
        clk    : in  std_logic;
        reset  : in  std_logic;
        input  : in  std_logic_vector(7 downto 0);
        output : out std_logic_vector(7 downto 0)
    );
end entity mi_modulo;
\`\`\`

### Architecture (Implementación)
\`\`\`vhdl
architecture rtl of mi_modulo is
    signal temp : std_logic_vector(7 downto 0);
begin
    process(clk, reset)
    begin
        if reset = '1' then
            temp <= (others => '0');
        elsif rising_edge(clk) then
            temp <= input;
        end if;
    end process;
    
    output <= temp;
end architecture rtl;
\`\`\`

## Tipos de Datos
- **std_logic**: '0', '1', 'Z', 'X', etc.
- **std_logic_vector**: Array de std_logic
- **integer**: Números enteros
- **boolean**: true/false

## Operadores
- Lógicos: and, or, not, xor, nand, nor
- Relacionales: =, /=, <, >, <=, >=
- Aritméticos: +, -, *, /, mod, rem

## Best Practices
1. Usar procesos síncronos para lógica secuencial
2. Usar asignaciones concurrentes para lógica combinacional
3. Inicializar señales en reset
4. Evitar latches no intencionales
5. Usar tipos estándar (IEEE.std_logic_1164)
`
    },
    'verilog': {
        title: 'Verilog',
        content: `
# Verilog HDL

## Estructura Básica

### Module
\`\`\`verilog
module mi_modulo (
    input wire clk,
    input wire reset,
    input wire [7:0] data_in,
    output reg [7:0] data_out
);

    always @(posedge clk or posedge reset) begin
        if (reset)
            data_out <= 8'b0;
        else
            data_out <= data_in;
    end

endmodule
\`\`\`

## Tipos de Datos
- **wire**: Conexiones combinacionales
- **reg**: Almacenamiento (no siempre es registro físico)
- **integer**: Números enteros
- **parameter**: Constantes

## Bloques Always
1. **Combinacional**
\`\`\`verilog
always @(*) begin
    // Lógica combinacional
end
\`\`\`

2. **Secuencial**
\`\`\`verilog
always @(posedge clk) begin
    // Lógica secuencial
end
\`\`\`

## Operadores
- Lógicos: &&, ||, !
- Bitwise: &, |, ^, ~
- Reducción: &, |, ^
- Shift: <<, >>
- Aritméticos: +, -, *, /, %

## Best Practices
1. Usar blocking (=) para combinacional
2. Usar non-blocking (<=) para secuencial
3. Evitar mezclar blocking y non-blocking
4. Inicializar en reset
5. Usar parámetros para valores configurables
`
    },
    'fpga': {
        title: 'FPGA Development',
        content: `
# FPGA Development

## Conceptos Básicos
- **LUT (Look-Up Table)**: Implementa funciones lógicas
- **Flip-Flops**: Elementos de memoria
- **Block RAM**: Memoria embebida
- **DSP Slices**: Multiplicadores y ALUs optimizados
- **I/O Blocks**: Interfaz con pines externos

## Xilinx
### Vivado Design Suite
- Síntesis, implementación, bitstream
- Simulación con Vivado Simulator
- IP Integrator para diseño gráfico

### Constraints (XDC)
\`\`\`tcl
# Clock constraint
create_clock -period 10.0 [get_ports clk]

# Input delay
set_input_delay -clock clk 2.0 [get_ports data_in]

# Output delay
set_output_delay -clock clk 3.0 [get_ports data_out]

# Pin assignment
set_property PACKAGE_PIN A1 [get_ports clk]
set_property IOSTANDARD LVCMOS33 [get_ports clk]
\`\`\`

## Intel/Altera
### Quartus Prime
- Síntesis, fitting, timing analysis
- ModelSim para simulación
- Platform Designer (Qsys)

### Constraints (SDC)
\`\`\`tcl
create_clock -period 10.0 [get_ports clk]
set_input_delay -clock clk 2.0 [get_ports data_in]
set_output_delay -clock clk 3.0 [get_ports data_out]
\`\`\`

## Best Practices
1. Usar clock enable en lugar de clock gating
2. Sincronizar señales entre dominios de clock
3. Usar constraints de timing
4. Optimizar para área o velocidad según necesidad
5. Usar IP cores cuando sea posible
`
    },
    'timing': {
        title: 'Timing Analysis',
        content: `
# Timing Analysis

## Conceptos Fundamentales

### Setup Time (tsu)
- Tiempo mínimo que los datos deben estar estables ANTES del flanco de reloj
- Violación: datos cambian muy cerca del clock edge

### Hold Time (th)
- Tiempo mínimo que los datos deben permanecer estables DESPUÉS del flanco de reloj
- Violación: datos cambian muy pronto después del clock edge

### Clock-to-Q Delay (tco)
- Tiempo desde el flanco de reloj hasta que la salida del flip-flop es válida

### Propagation Delay (tpd)
- Tiempo que tarda una señal en propagarse a través de lógica combinacional

## Ecuaciones de Timing

### Setup Constraint
\`\`\`
Tclk >= tco + tpd + tsu
\`\`\`

### Hold Constraint
\`\`\`
tco + tpd >= th
\`\`\`

### Maximum Frequency
\`\`\`
Fmax = 1 / (tco + tpd + tsu)
\`\`\`

## Clock Domain Crossing (CDC)
### Problemas
- Metastabilidad
- Pérdida de datos
- Corrupción de datos

### Soluciones
1. **Sincronizadores de 2 FF**
\`\`\`vhdl
process(clk_dest)
begin
    if rising_edge(clk_dest) then
        sync_ff1 <= async_signal;
        sync_ff2 <= sync_ff1;
    end if;
end process;
\`\`\`

2. **Handshake**
3. **FIFO asíncrono**
4. **Gray code** para contadores

## Best Practices
1. Minimizar CDC
2. Usar sincronizadores apropiados
3. Aplicar constraints de timing
4. Analizar reportes de timing
5. Considerar variaciones de proceso, voltaje y temperatura (PVT)
`
    }
};

// Inicializar AI Assistant
function initAIAssistant() {
    console.log('🤖 Asistente IA inicializado');
}

// Load documentation
function loadDocumentation(topic) {
    const doc = Documentation[topic];
    if (!doc) {
        showToast('Documentación no encontrada', 'error');
        return;
    }
    
    // Add documentation as a message
    const message = `📚 **${doc.title}**\n\n${doc.content}`;
    addChatMessage('assistant', message);
    showToast(`Documentación de ${doc.title} cargada`, 'success');
}

// Quick prompt
function quickPrompt(prompt) {
    const input = document.getElementById('aiChatInput');
    if (input) {
        input.value = prompt;
        input.focus();
    }
}

// Clear chat
function clearAIChat() {
    const messagesContainer = document.getElementById('aiChatMessages');
    if (messagesContainer) {
        // Keep only welcome message
        const messages = messagesContainer.querySelectorAll('[data-message-id]');
        messages.forEach(msg => msg.remove());
        AIAssistant.messages = [];
        showToast('Chat limpiado', 'success');
    }
}

// Handle chat keydown
function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

// Update character count
function updateCharCount(textarea) {
    const charCount = document.getElementById('charCount');
    if (charCount) {
        const length = textarea.value.length;
        charCount.textContent = length;
        
        // Cambiar color basado en la longitud
        if (length > 9000) {
            charCount.style.color = '#ef4444'; // rojo
        } else if (length > 7000) {
            charCount.style.color = '#f59e0b'; // amarillo
        } else {
            charCount.style.color = 'rgba(255, 255, 255, 0.3)';
        }
    }
}

// Send chat message
async function sendChatMessage() {
    const input = document.getElementById('aiChatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Verificar si Puter is available and authenticated
    if (typeof puter === 'undefined') {
        showToast('Puter SDK no está cargado', 'error');
        return;
    }
    
    // Re-check authentication status
    try {
        const isSignedIn = await puter.auth.isSignedIn();
        if (!isSignedIn) {
            showToast('Por favor inicia sesión en Puter para usar el AI Assistant', 'warning');
            document.getElementById('puter-login-btn')?.click();
            return;
        }
    } catch (error) {
        console.error('❌ Auth check error:', error);
        showToast('Error de autenticación. Por favor inicia sesión nuevamente.', 'error');
        return;
    }
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Add user message
    addChatMessage('user', message);
    
    // Mostrar loading with elegant animation
    const loadingId = addChatMessage('assistant', `
        <div class="flex items-center space-x-2">
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
            <span class="text-white/60">Pensando...</span>
        </div>
    `, true);
    
    // Deshabilitar send button with loading state
    const sendBtn = document.getElementById('aiChatSendBtn');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
        sendBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    }
    
    try {
        // Prepare context with system prompt
        const fullPrompt = `${AIAssistant.systemPrompt}

USER QUESTION: ${message}

Provide a helpful, accurate, and educational response. If the question involves code, provide working examples with proper formatting and comments. If it's a concept, explain clearly with examples. Use markdown formatting for better readability.`;
        
        // Call Puter AI with Claude Sonnet 4
        const chat_resp = await puter.ai.chat(fullPrompt, {
            model: 'claude-sonnet-4',
            stream: true
        });
        
        // Remove loading message
        removeMessage(loadingId);
        
        // Crear message container for streaming response
        let fullResponse = '';
        const responseId = addChatMessage('assistant', '', false);
        
        // Get the response element using the ID directly
        const responseMessageDiv = document.getElementById(responseId);
        const responseElement = responseMessageDiv ? responseMessageDiv.querySelector('.message-content') : null;
        
        // Stream the response
        for await (const part of chat_resp) {
            if (part?.text) {
                fullResponse += part.text;
                if (responseElement) {
                    responseElement.innerHTML = formatMessageContent(fullResponse);
                }
                // Auto-scroll
                const messagesContainer = document.getElementById('aiChatMessages');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        }
        
        // Save to history
        saveChatHistory();
        
    } catch (error) {
        console.error('❌ AI Error:', error);
        removeMessage(loadingId);
        addChatMessage('assistant', '❌ Lo siento, encontré un error. Por favor intenta nuevamente.');
        showToast('Error en la solicitud de AI', 'error');
    } finally {
        // Re-enable send button
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }
}

// Add message to chat
function addChatMessage(role, content, isLoading = false) {
    const messagesContainer = document.getElementById('aiChatMessages');
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    
    const isUser = role === 'user';
    
    // Formatear content (markdown-like) - but not if it's loading HTML
    const formattedContent = isLoading ? content : formatMessageContent(content);
    
    const messageHTML = `
        <div id="${messageId}" data-message-id="${messageId}" class="flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''} animate-fade-in">
            ${!isUser ? `
                <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-xs"></i>
                </div>
            ` : ''}
            <div class="flex-1 ${isUser ? 'flex justify-end' : ''}">
                <div class="${isUser ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30' : 'bg-white/5'} rounded-lg p-4 text-sm text-white/90 ${isUser ? 'max-w-[85%]' : 'w-full'} message-content">
                    ${formattedContent}
                </div>
            </div>
            ${isUser ? `
                <div class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-white text-xs"></i>
                </div>
            ` : ''}
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store message
    if (!isLoading) {
        AIAssistant.messages.push({ id: messageId, role, content, timestamp: Date.now() });
    }
    
    return messageId;
}

// Formatear message content (markdown-like)
function formatMessageContent(content) {
    if (typeof content !== 'string') {
        content = String(content);
    }
    
    // Escape HTML first
    let formatted = escapeHtml(content);
    
    // Formatear code blocks with language
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'code';
        return `<div class="code-block my-3">
            <div class="code-header">
                <span class="code-language">${language}</span>
                <button onclick="copyCode(this)" class="copy-btn"><i class="fas fa-copy"></i> Copiar</button>
            </div>
            <pre class="code-content"><code class="language-${language}">${code.trim()}</code></pre>
        </div>`;
    });
    
    // Formatear inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Formatear bold
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Formatear tables (before line breaks)
    formatted = formatted.replace(/\|(.+)\|/g, (match) => {
        // Verificar si it's a table separator line
        if (match.match(/\|[\s-:|]+\|/)) {
            return match; // Keep separator for now
        }
        return match;
    });
    
    // Convertir markdown tables to HTML
    const lines = formatted.split('\n');
    let inTable = false;
    let tableHTML = '';
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableHTML = '<table class="markdown-table my-3"><tbody>';
            }
            
            // Verificar si it's a separator line
            if (line.match(/\|[\s-:|]+\|/)) {
                continue; // Skip separator
            }
            
            // Parsear table row
            const cells = line.split('|').filter(cell => cell.trim() !== '');
            const isHeader = i === 0 || (i === 1 && lines[i-1].match(/\|[\s-:|]+\|/));
            
            if (isHeader && tableHTML === '<table class="markdown-table my-3"><tbody>') {
                tableHTML = '<table class="markdown-table my-3"><thead><tr>';
                cells.forEach(cell => {
                    tableHTML += `<th>${cell.trim()}</th>`;
                });
                tableHTML += '</tr></thead><tbody>';
            } else {
                tableHTML += '<tr>';
                cells.forEach(cell => {
                    tableHTML += `<td>${cell.trim()}</td>`;
                });
                tableHTML += '</tr>';
            }
        } else {
            if (inTable) {
                tableHTML += '</tbody></table>';
                processedLines.push(tableHTML);
                tableHTML = '';
                inTable = false;
            }
            processedLines.push(line);
        }
    }
    
    if (inTable) {
        tableHTML += '</tbody></table>';
        processedLines.push(tableHTML);
    }
    
    formatted = processedLines.join('\n');
    
    // Formatear headers
    formatted = formatted.replace(/^### (.+)$/gm, '<h4 class="text-base font-bold mt-3 mb-2 text-purple-400">$1</h4>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-purple-400">$1</h3>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-3 text-purple-400">$1</h2>');
    
    // Formatear lists
    formatted = formatted.replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>');
    formatted = formatted.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$1. $2</li>');
    
    // Formatear line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// Copy code to clipboard
function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        button.innerHTML = '<i class="fas fa-check"></i> Copiado';
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i> Copiar';
        }, 2000);
    }).catch(err => {
        console.error('Error copying code:', err);
        showToast('Error al copiar código', 'error');
    });
}

// Remove message
function removeMessage(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
        // Add fade-out animation
        message.style.opacity = '0';
        message.style.transform = 'translateY(-10px)';
        message.style.transition = 'all 0.2s ease-out';
        
        // Remove after animation
        setTimeout(() => {
            message.remove();
        }, 200);
    }
    AIAssistant.messages = AIAssistant.messages.filter(m => m.id !== messageId);
}

// Escape HTML
function escapeHtml(text) {
    if (typeof text !== 'string') {
        text = String(text);
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Save chat history to localStorage
function saveChatHistory() {
    try {
        const history = AIAssistant.messages
            .filter(m => !m.content.includes('Pensando...'))
            .slice(-20); // Keep last 20 messages
        localStorage.setItem('digitalforge-ai-history', JSON.stringify(history));
    } catch (error) {
        console.warn('⚠️ Could not save chat history:', error);
    }
}

// Load chat history from localStorage
function loadChatHistory() {
    try {
        const history = localStorage.getItem('digitalforge-ai-history');
        if (history) {
            const messages = JSON.parse(history);
            console.log('📚 Historial de chat disponible:', messages.length, 'mensajes');
        }
    } catch (error) {
        console.warn('⚠️ Could not load chat history:', error);
    }
}

// Exportar funciones
window.initAIAssistant = initAIAssistant;
window.sendChatMessage = sendChatMessage;
window.handleChatKeydown = handleChatKeydown;
window.updateCharCount = updateCharCount;
window.clearAIChat = clearAIChat;
window.loadDocumentation = loadDocumentation;
window.quickPrompt = quickPrompt;
window.copyCode = copyCode;
window.AIAssistant = AIAssistant;

console.log('✅ Módulo Asistente IA cargado');