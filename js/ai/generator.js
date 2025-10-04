// AI FEATURES - INTEGRATED WITH PUTER
// AI features for all DigitalForge tools

// VHDL/VERILOG AI GENERATOR

async function generateHDLWithAI(language = 'vhdl') {
    const moduleNameEl = document.getElementById(language === 'vhdl' ? 'vhdlModuleNameAI' : 'verilogModuleNameAI');
    const descriptionEl = document.getElementById(`${language}Description`);
    
    if (!moduleNameEl || !descriptionEl) {
        showToast('Form elements not found', 'error');
        return;
    }
    
    const moduleName = moduleNameEl.value.trim() || 'my_module';
    const description = descriptionEl.value.trim();
    
    if (!description) {
        showToast('Please provide a description of the circuit', 'warning');
        return;
    }
    
    // Check Puter authentication
    if (typeof puter === 'undefined' || !await puter.auth.isSignedIn()) {
        showToast('Please sign in to Puter to use AI generation', 'warning');
        return;
    }
    
    const prompt = `You are an expert HDL engineer. Generate ${language.toUpperCase()} code for this specification:

SPECIFICATION: "${description}"
MODULE NAME: ${moduleName}

REQUIREMENTS:
${language === 'vhdl' ? `
- Use IEEE standard libraries (std_logic_1164, numeric_std)
- Entity-Architecture structure
- Proper port declarations (in, out, inout)
- Signal declarations in architecture
- Synchronous processes with clock and reset
- Comments explaining functionality
` : `
- Use proper Verilog syntax
- Module with port list
- Wire/reg declarations
- Always blocks for sequential logic
- Assign statements for combinational logic
- Comments explaining functionality
`}

CRITICAL RULES:
1. Code must be synthesizable (no delays, no file I/O)
2. Use synchronous reset (active high or low, specify)
3. Include detailed inline comments
4. Use meaningful signal/variable names
5. Follow industry best practices
6. Add header comment with module description
7. Ensure proper sensitivity lists (VHDL) or always blocks (Verilog)

OUTPUT FORMAT:
- Generate ONLY the code
- No markdown code blocks
- No explanations before or after
- Start directly with library/module declaration
- End with end statement

Generate the complete, production-ready ${language.toUpperCase()} code now:`;

    try {
        showToast('Generating with AI...', 'info');
        
        const chat_resp = await puter.ai.chat(prompt, {
            model: 'claude-sonnet-4',
            stream: true
        });
        
        // Display the generated code with streaming
        const outputEl = document.getElementById('hdlOutput');
        let fullCode = '';
        
        if (outputEl) {
            outputEl.textContent = 'Generating...';
            
            for await (const part of chat_resp) {
                if (part?.text) {
                    fullCode += part.text;
                    outputEl.textContent = fullCode;
                }
            }
            
            AppState.hdlCode = fullCode;
        }
        
        showToast(`${language.toUpperCase()} generated successfully!`, 'success');
        
        // Optionally save to cloud
        if (PuterService.isAuthenticated) {
            const shouldSave = await showConfirmDialog(
                '☁️ Save to Cloud',
                `Would you like to save "${moduleName}" to your cloud storage? You can access it anytime from any device.`,
                'Save to Cloud',
                'Not Now'
            );
            
            if (shouldSave) {
                const saved = await saveHDLToCloud(fullCode, moduleName, language);
                if (saved) {
                    showToast(`✅ "${moduleName}" saved to cloud successfully!`, 'success');
                }
            }
        }
        
    } catch (error) {
        console.error('❌ AI Generation error:', error);
        showToast('AI generation failed. Try again or use templates.', 'error');
    }
}

// Generador de Circuitos con IA

async function generateCircuitWithAI() {
    const descriptionEl = document.getElementById('circuitAIDescription');
    
    if (!descriptionEl) {
        showToast('Description field not found', 'error');
        return;
    }
    
    const description = descriptionEl.value.trim();
    
    if (!description) {
        showToast('Please describe the circuit you want to create', 'warning');
        return;
    }
    
    // Check Puter authentication
    if (typeof puter === 'undefined' || !await puter.auth.isSignedIn()) {
        showToast('Please sign in to Puter to use AI generation', 'warning');
        return;
    }
    
    const prompt = `Generate a digital circuit in JSON format for: "${description}"

CRITICAL RULES:
1. Respond ONLY with valid JSON, no explanations
2. No markdown, no code blocks, no extra text
3. Start with { and end with }

Format:
{"components":[{"id":1,"type":"input","x":100,"y":150,"state":0}],"connections":[{"id":1,"from":1,"to":2,"fromType":"input","toType":"and"}]}

Valid types: input, output, and, or, not, xor
Layout: inputs at x=100, gates at x=250-300, outputs at x=400
Spacing: 80px vertical between components

Example for "half adder":
{"components":[{"id":1,"type":"input","x":100,"y":120,"state":0},{"id":2,"type":"input","x":100,"y":200,"state":0},{"id":3,"type":"xor","x":280,"y":140,"state":null},{"id":4,"type":"and","x":280,"y":220,"state":null},{"id":5,"type":"output","x":420,"y":140,"state":null},{"id":6,"type":"output","x":420,"y":220,"state":null}],"connections":[{"id":1,"from":1,"to":3,"fromType":"input","toType":"xor"},{"id":2,"from":2,"to":3,"fromType":"input","toType":"xor"},{"id":3,"from":1,"to":4,"fromType":"input","toType":"and"},{"id":4,"from":2,"to":4,"fromType":"input","toType":"and"},{"id":5,"from":3,"to":5,"fromType":"xor","toType":"output"},{"id":6,"from":4,"to":6,"fromType":"and","toType":"output"}]}

Now generate for: "${description}"`;

    try {
        showToast('Generating circuit with AI...', 'info');
        
        const response = await puter.ai.chat(prompt, {
            model: 'claude-sonnet-4'
        });
        
        // Try to parse the response as JSON
        let circuitData;
        try {
            // Convertir response to string if it's not already
            let responseText = typeof response === 'string' ? response : String(response);
            
            // Remove markdown code blocks if present
            let cleanResponse = responseText.trim();
            if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            
            circuitData = JSON.parse(cleanResponse);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            console.error('Response was:', response);
            showToast('AI response was not valid JSON. Try rephrasing your description.', 'error');
            return;
        }
        
        // Validar circuit data
        if (!circuitData.components || !Array.isArray(circuitData.components)) {
            showToast('Invalid circuit data from AI', 'error');
            return;
        }
        
        // Load the circuit
        if (typeof loadCircuitData === 'function') {
            loadCircuitData(circuitData);
            showToast('Circuit generated and loaded!', 'success');
        } else {
            showToast('Circuit loader not available', 'error');
        }
        
    } catch (error) {
        console.error('❌ Circuit AI error:', error);
        showToast('Failed to generate circuit. Please try again.', 'error');
    }
}

// CIRCUIT ANALYZER WITH AI
// Removed - not working properly

// Mostrar analysis result - Removed

// LOGISIM UTILITIES
// Removed - not needed

// UTILITY FUNCTIONS

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// TAB SWITCHING

function switchVHDLMode(mode) {
    const templateTab = document.getElementById('vhdlTemplateTab');
    const aiTab = document.getElementById('vhdlAITab');
    const templateMode = document.getElementById('vhdlTemplateMode');
    const aiMode = document.getElementById('vhdlAIMode');
    
    if (mode === 'template') {
        templateTab.className = 'flex-1 py-2 px-4 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-medium';
        aiTab.className = 'flex-1 py-2 px-4 rounded-lg bg-white/5 text-white/60 border border-white/10 text-sm font-medium hover:bg-white/10';
        templateMode.classList.remove('hidden');
        aiMode.classList.add('hidden');
    } else {
        templateTab.className = 'flex-1 py-2 px-4 rounded-lg bg-white/5 text-white/60 border border-white/10 text-sm font-medium hover:bg-white/10';
        aiTab.className = 'flex-1 py-2 px-4 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-medium';
        templateMode.classList.add('hidden');
        aiMode.classList.remove('hidden');
    }
}

function switchVerilogMode(mode) {
    const templateTab = document.getElementById('verilogTemplateTab');
    const aiTab = document.getElementById('verilogAITab');
    const templateMode = document.getElementById('verilogTemplateMode');
    const aiMode = document.getElementById('verilogAIMode');
    
    if (mode === 'template') {
        templateTab.className = 'flex-1 py-2 px-4 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-medium';
        aiTab.className = 'flex-1 py-2 px-4 rounded-lg bg-white/5 text-white/60 border border-white/10 text-sm font-medium hover:bg-white/10';
        templateMode.classList.remove('hidden');
        aiMode.classList.add('hidden');
    } else {
        templateTab.className = 'flex-1 py-2 px-4 rounded-lg bg-white/5 text-white/60 border border-white/10 text-sm font-medium hover:bg-white/10';
        aiTab.className = 'flex-1 py-2 px-4 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-medium';
        templateMode.classList.add('hidden');
        aiMode.classList.remove('hidden');
    }
}

// Exportar funciones
window.generateHDLWithAI = generateHDLWithAI;
window.switchVHDLMode = switchVHDLMode;
window.switchVerilogMode = switchVerilogMode;

console.log('✅ Módulo de IA cargado');
