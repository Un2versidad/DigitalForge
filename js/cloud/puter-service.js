// Integración con Puter.js
// Servicios en la nube

const PuterService = {
    user: null,
    isAuthenticated: false,
    fs: null,
    ai: null
};

// Inicializar Puter
async function initializePuterAdvanced() {
    if (typeof puter === 'undefined') {
        console.warn('⚠️ SDK de Puter no cargado');
        updateFooterStatus('offline');
        return false;
    }

    try {
        // Check authentication (Puter automatically persists sessions)
        PuterService.isAuthenticated = await puter.auth.isSignedIn();
        
        if (PuterService.isAuthenticated) {
            PuterService.user = await puter.auth.getUser();
            PuterService.fs = puter.fs;
            PuterService.ai = puter.ai;
            
            console.log('✅ Puter initialized:', PuterService.user.username);
            console.log('🔐 Session restored from previous login');
            updateFooterStatus('online', PuterService.user.username);
            updatePuterUI(true);
            
            // Save session info to localStorage for quick access
            saveSessionInfo({
                username: PuterService.user.username,
                lastLogin: new Date().toISOString()
            });
            
            // Inicializar cloud features
            await initializeCloudFeatures();
            
            // Mostrar welcome back message
            showToast(`Welcome back, ${PuterService.user.username}!`, 'success');
            
            return true;
        } else {
            console.log('ℹ️ Puter disponible pero no autenticado');
            updateFooterStatus('available');
            updatePuterUI(false);
            
            // Verificar si user was previously logged in
            const lastSession = getSessionInfo();
            if (lastSession) {
                console.log('ℹ️ Previous session found:', lastSession.username);
                showToast('Session expired. Please sign in again.', 'info');
            }
            
            return false;
        }
    } catch (error) {
        console.error('❌ Puter initialization error:', error);
        updateFooterStatus('error');
        return false;
    }
}

// Save session info to localStorage
function saveSessionInfo(info) {
    try {
        localStorage.setItem('digitalforge-puter-session', JSON.stringify(info));
    } catch (error) {
        console.warn('⚠️ Could not save session info:', error);
    }
}

// Get session info from localStorage
function getSessionInfo() {
    try {
        const info = localStorage.getItem('digitalforge-puter-session');
        return info ? JSON.parse(info) : null;
    } catch (error) {
        console.warn('⚠️ Could not load session info:', error);
        return null;
    }
}

// Clear session info
function clearSessionInfo() {
    try {
        localStorage.removeItem('digitalforge-puter-session');
    } catch (error) {
        console.warn('⚠️ Could not clear session info:', error);
    }
}

// Update footer status indicator
function updateFooterStatus(status, username = '') {
    const statusEl = document.getElementById('puterStatus');
    if (!statusEl) return;
    
    const dot = statusEl.querySelector('.w-2');
    const text = statusEl.querySelector('span:last-child');
    
    switch (status) {
        case 'online':
            dot.className = 'w-2 h-2 bg-green-400 rounded-full animate-pulse';
            text.textContent = `Cloud: ${username}`;
            break;
        case 'available':
            dot.className = 'w-2 h-2 bg-yellow-400 rounded-full';
            text.textContent = 'Cloud: Sign in';
            break;
        case 'offline':
            dot.className = 'w-2 h-2 bg-gray-500 rounded-full';
            text.textContent = 'Cloud: Offline';
            break;
        case 'error':
            dot.className = 'w-2 h-2 bg-red-400 rounded-full';
            text.textContent = 'Cloud: Error';
            break;
    }
}

// Inicializar cloud features
async function initializeCloudFeatures() {
    if (!PuterService.isAuthenticated) return;
    
    try {
        // Crear DigitalForge directory structure
        await ensureDirectory('DigitalForge');
        await ensureDirectory('DigitalForge/circuits');
        await ensureDirectory('DigitalForge/hdl');
        await ensureDirectory('DigitalForge/projects');
        
        console.log('✅ Directorios en la nube inicializados');
    } catch (error) {
        console.error('❌ Error initializing cloud directories:', error);
    }
}

// Ensure directory exists
async function ensureDirectory(path) {
    try {
        // Use puter.fs.stat to check if directory exists
        await puter.fs.stat(path);
    } catch (error) {
        // Directory doesn't exist, create it
        try {
            await puter.fs.mkdir(path);
            console.log(`📁 Created directory: ${path}`);
        } catch (mkdirError) {
            // Ignore error if directory already exists
            if (!mkdirError.message.includes('already exists')) {
                console.warn(`⚠️ Could not create directory ${path}:`, mkdirError);
            }
        }
    }
}

// Funciones de almacenamiento

// Guardar circuito to cloud
async function saveCircuitToCloud(circuitData, filename, skipConfirm = false) {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to save to cloud', 'warning');
        return false;
    }
    
    try {
        // Ensure directory exists first
        await ensureDirectory('DigitalForge');
        await ensureDirectory('DigitalForge/circuits');
        
        const path = `DigitalForge/circuits/${filename}.json`;
        
        // Verificar si file already exists
        if (!skipConfirm) {
            try {
                const files = await puter.fs.readdir('DigitalForge/circuits');
                const fileExists = files.some(f => f.name === `${filename}.json`);
                
                if (fileExists) {
                    const shouldOverwrite = await showConfirmDialog(
                        'File Already Exists',
                        `A circuit named "${filename}" already exists in your cloud storage. Would you like to replace it?`,
                        'Replace',
                        'Cancel'
                    );
                    
                    if (!shouldOverwrite) {
                        return false;
                    }
                }
            } catch (e) {
                // Directory might not exist yet, continue
            }
        }
        
        const content = JSON.stringify(circuitData, null, 2);
        
        // Use puter.fs.write directly
        await puter.fs.write(path, content, { dedupeName: false });
        
        console.log(`💾 Circuit saved to cloud: ${path}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving circuit to cloud:', error);
        const errorMsg = error && error.message ? error.message : 'Unknown error';
        showToast('Error saving circuit to cloud: ' + errorMsg, 'error');
        return false;
    }
}

// Cargar circuito from cloud
async function loadCircuitFromCloud(filename) {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to load from cloud', 'warning');
        return null;
    }
    
    try {
        const path = `DigitalForge/circuits/${filename}.json`;
        
        // Use puter.fs.read which returns a Blob
        const blob = await puter.fs.read(path);
        const content = await blob.text();
        const circuitData = JSON.parse(content);
        
        console.log(`📂 Circuit loaded from cloud: ${path}`);
        return circuitData;
    } catch (error) {
        console.error('❌ Error loading circuit from cloud:', error);
        showToast('Error loading circuit from cloud: ' + error.message, 'error');
        return null;
    }
}

// List saved circuits
async function listCloudCircuits() {
    if (!PuterService.isAuthenticated) {
        return [];
    }
    
    try {
        // Ensure directory exists first
        await ensureDirectory('DigitalForge');
        await ensureDirectory('DigitalForge/circuits');
        
        // Use puter.fs.readdir
        const files = await puter.fs.readdir('DigitalForge/circuits');
        return files.filter(f => f.name.endsWith('.json'));
    } catch (error) {
        console.error('❌ Error listing circuits:', error);
        // Return empty array if directory doesn't exist
        return [];
    }
}

// Save HDL code to cloud
async function saveHDLToCloud(code, filename, type = 'vhdl', skipConfirm = false) {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to save to cloud', 'warning');
        return false;
    }
    
    try {
        // Ensure directory exists
        await ensureDirectory('DigitalForge');
        await ensureDirectory('DigitalForge/hdl');
        
        const extension = type === 'vhdl' ? 'vhd' : 'v';
        const path = `DigitalForge/hdl/${filename}.${extension}`;
        
        // Verificar si file already exists
        if (!skipConfirm) {
            try {
                const files = await puter.fs.readdir('DigitalForge/hdl');
                const fileExists = files.some(f => f.name === `${filename}.${extension}`);
                
                if (fileExists) {
                    const shouldOverwrite = await showConfirmDialog(
                        'File Already Exists',
                        `A file named "${filename}.${extension}" already exists in your cloud storage. Would you like to replace it?`,
                        'Replace',
                        'Cancel'
                    );
                    
                    if (!shouldOverwrite) {
                        return false;
                    }
                }
            } catch (e) {
                // Directory might not exist yet, continue
            }
        }
        
        // Use puter.fs.write
        await puter.fs.write(path, code, { dedupeName: false });
        
        console.log(`💾 HDL saved to cloud: ${path}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving HDL to cloud:', error);
        showToast('Error saving HDL to cloud: ' + error.message, 'error');
        return false;
    }
}

// ===== AI INTEGRATION =====

// Get AI help for circuit design
async function getCircuitAIHelp(circuitData) {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to use AI features', 'warning');
        return null;
    }
    
    try {
        const prompt = `Analyze this digital circuit and provide suggestions for improvement:
        
Components: ${circuitData.components.length}
Connections: ${circuitData.connections.length}
Circuit Type: ${detectCircuitType(circuitData)}

Please provide:
1. Circuit analysis
2. Optimization suggestions
3. Common issues to check
4. Testing recommendations`;

        const response = await PuterService.ai.chat(prompt);
        
        console.log('🤖 Análisis de IA recibido');
        return response;
    } catch (error) {
        console.error('❌ Error getting AI help:', error);
        showToast('Error getting AI assistance', 'error');
        return null;
    }
}

// Get AI help for HDL code
async function getHDLAIHelp(code, language = 'vhdl') {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to use AI features', 'warning');
        return null;
    }
    
    try {
        const prompt = `Review this ${language.toUpperCase()} code and provide suggestions:

\`\`\`${language}
${code}
\`\`\`

Please provide:
1. Code review
2. Best practices recommendations
3. Potential issues
4. Optimization suggestions`;

        const response = await PuterService.ai.chat(prompt);
        
        console.log('🤖 Revisión de código IA recibida');
        return response;
    } catch (error) {
        console.error('❌ Error getting AI help:', error);
        showToast('Error getting AI assistance', 'error');
        return null;
    }
}

// Generate HDL from description
async function generateHDLWithAI(description, language = 'vhdl') {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to use AI features', 'warning');
        return null;
    }
    
    try {
        const prompt = `Generate ${language.toUpperCase()} code for the following description:

${description}

Requirements:
- Use IEEE standard libraries
- Include detailed comments
- Follow best practices
- Make it synthesizable
- Include testbench if applicable`;

        const response = await PuterService.ai.chat(prompt);
        
        console.log('🤖 Código IA generado');
        showToast('AI code generated successfully', 'success');
        return response;
    } catch (error) {
        console.error('❌ Error generating code:', error);
        showToast('Error generating code with AI', 'error');
        return null;
    }
}

// Detect circuit type from components
function detectCircuitType(circuitData) {
    const components = circuitData.components || [];
    const types = components.map(c => c.type);
    
    if (types.includes('xor') && types.includes('and')) {
        return 'Adder Circuit';
    } else if (types.filter(t => t === 'or').length >= 2) {
        return 'Latch/Flip-Flop';
    } else if (types.includes('not') && types.includes('and')) {
        return 'Multiplexer';
    } else {
        return 'Logic Circuit';
    }
}

// ===== UI FUNCTIONS =====

// Abrir Puter cloud interface
function openPuterCloud() {
    if (PuterService.isAuthenticated) {
        window.open('https://puter.com/app/files', '_blank');
    } else {
        showToast('Please sign in to Puter first', 'warning');
        document.getElementById('puter-login-btn')?.click();
    }
}

// Abrir Puter documentation
function openPuterDocs() {
    window.open('https://docs.puter.com', '_blank');
}

// Mostrar about dialog
function showAbout() {
    showToast('DigitalForge v1.0.0 - Professional Digital Engineering Suite', 'info');
}

// Mostrar cloud save dialog
async function showCloudSaveDialog() {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to save to cloud', 'warning');
        return;
    }
    
    // Verificar si there's circuit data
    if (typeof circuitComponents === 'undefined' || circuitComponents.length === 0) {
        showToast('No circuit to save. Create a circuit first.', 'warning');
        return;
    }
    
    // Crear modal dialog
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-black border border-purple-500/30 rounded-2xl p-6 max-w-md w-full m-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold text-white flex items-center">
                    <i class="fas fa-cloud-upload-alt text-purple-400 mr-2"></i>
                    Save to Cloud
                </h3>
                <button onclick="this.closest('.fixed').remove()" class="text-white/60 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Circuit Name</label>
                    <input type="text" id="cloudSaveFilename" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50" placeholder="my_circuit" />
                </div>
                <div class="text-xs text-white/40">
                    <i class="fas fa-info-circle mr-1"></i>
                    Saved to: DigitalForge/circuits/
                </div>
                <div class="flex space-x-2">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all">
                        Cancel
                    </button>
                    <button onclick="handleCloudSave()" class="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all">
                        <i class="fas fa-save mr-2"></i>Save
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('cloudSaveFilename')?.focus();
}

// Handle cloud save
async function handleCloudSave() {
    const filename = document.getElementById('cloudSaveFilename')?.value.trim();
    if (!filename) {
        showToast('Please enter a filename', 'warning');
        return;
    }
    
    const circuitData = {
        components: circuitComponents,
        connections: circuitConnections,
        timestamp: new Date().toISOString()
    };
    
    const success = await saveCircuitToCloud(circuitData, filename);
    if (success) {
        // Cerrar the modal
        const modal = document.getElementById('cloudSaveFilename')?.closest('.fixed');
        if (modal) modal.remove();
        showToast(`✅ Circuit "${filename}" saved successfully to cloud!`, 'success');
    }
}

// Mostrar cloud load dialog
async function showCloudLoadDialog() {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to load from cloud', 'warning');
        return;
    }
    
    showToast('Loading circuits...', 'info');
    const circuits = await listCloudCircuits();
    
    if (circuits.length === 0) {
        showToast('No saved circuits found in cloud', 'info');
        return;
    }
    
    // Crear modal dialog
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-black border border-purple-500/30 rounded-2xl p-6 max-w-md w-full m-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold text-white flex items-center">
                    <i class="fas fa-cloud-download-alt text-purple-400 mr-2"></i>
                    Load from Cloud
                </h3>
                <button onclick="this.closest('.fixed').remove()" class="text-white/60 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Select Circuit</label>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        ${circuits.map(f => `
                            <div class="flex items-center gap-2">
                                <button onclick="handleCloudLoad('${f.name.replace('.json', '')}')" class="flex-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg text-left transition-all group">
                                    <div class="flex items-center justify-between">
                                        <span class="text-white font-medium">${f.name.replace('.json', '')}</span>
                                        <i class="fas fa-download text-white/40 group-hover:text-purple-400"></i>
                                    </div>
                                </button>
                                <button onclick="deleteCloudFile('DigitalForge/circuits/${f.name}', 'circuit')" class="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all" title="Eliminar">
                                    <i class="fas fa-trash text-red-400"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Handle cloud load
async function handleCloudLoad(filename) {
    try {
        const circuitData = await loadCircuitFromCloud(filename);
        
        if (circuitData) {
            // Wait for loadCircuitData to be available (in case scripts are still loading)
            let attempts = 0;
            while (typeof window.loadCircuitData !== 'function' && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (typeof window.loadCircuitData === 'function') {
                window.loadCircuitData(circuitData);
                showToast(`✅ Circuit "${filename}" loaded successfully!`, 'success');
            } else {
                console.error('Función loadCircuitData no encontrada después de esperar');
                showToast('Error: Circuit loader not available', 'error');
            }
        }
    } catch (error) {
        console.error('Error in handleCloudLoad:', error);
        showToast(`Error loading circuit: ${error.message}`, 'error');
    } finally {
        // Always close the modal, even if there's an error
        const modal = document.querySelector('.fixed');
        if (modal) modal.remove();
    }
}

// ===== HDL CLOUD SAVE/LOAD DIALOGS =====

// Mostrar HDL cloud save dialog
async function showHDLCloudSaveDialog() {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to save to cloud', 'warning');
        return;
    }
    
    const hdlOutput = document.getElementById('hdlOutput');
    if (!hdlOutput || !hdlOutput.textContent || hdlOutput.textContent.includes('Selecciona un template')) {
        showToast('No HDL code to save. Generate code first.', 'warning');
        return;
    }
    
    // Crear modal dialog
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-black border border-purple-500/30 rounded-2xl p-6 max-w-md w-full m-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold text-white flex items-center">
                    <i class="fas fa-cloud-upload-alt text-purple-400 mr-2"></i>
                    Save HDL to Cloud
                </h3>
                <button onclick="this.closest('.fixed').remove()" class="text-white/60 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">File Name</label>
                    <input type="text" id="hdlCloudSaveFilename" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50" placeholder="my_module" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-white/80 mb-2">Type</label>
                    <select id="hdlCloudSaveType" class="w-full bg-gray-800 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 cursor-pointer" style="appearance: none; -webkit-appearance: none; -moz-appearance: none; background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1em; padding-right: 2.5rem;">
                        <option value="vhdl" style="background-color: #1e293b; color: white;">VHDL (.vhd)</option>
                        <option value="verilog" style="background-color: #1e293b; color: white;">Verilog (.v)</option>
                    </select>
                </div>
                <div class="text-xs text-white/40">
                    <i class="fas fa-info-circle mr-1"></i>
                    Saved to: DigitalForge/hdl/
                </div>
                <div class="flex space-x-2">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all">
                        Cancel
                    </button>
                    <button onclick="handleHDLCloudSave()" class="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all">
                        <i class="fas fa-save mr-2"></i>Save
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('hdlCloudSaveFilename')?.focus();
}

// Handle HDL cloud save
async function handleHDLCloudSave() {
    const filename = document.getElementById('hdlCloudSaveFilename')?.value.trim();
    const type = document.getElementById('hdlCloudSaveType')?.value || 'vhdl';
    
    if (!filename) {
        showToast('Please enter a filename', 'warning');
        return;
    }
    
    const hdlOutput = document.getElementById('hdlOutput');
    const code = hdlOutput?.textContent || '';
    
    const success = await saveHDLToCloud(code, filename, type);
    if (success) {
        // Cerrar the modal
        const modal = document.getElementById('hdlCloudSaveFilename')?.closest('.fixed');
        if (modal) modal.remove();
        showToast(`✅ HDL file "${filename}" saved successfully to cloud!`, 'success');
    }
}

// Mostrar HDL cloud load dialog
async function showHDLCloudLoadDialog() {
    if (!PuterService.isAuthenticated) {
        showToast('Please sign in to Puter to load from cloud', 'warning');
        return;
    }
    
    showToast('Loading HDL files...', 'info');
    
    try {
        await ensureDirectory('DigitalForge');
        await ensureDirectory('DigitalForge/hdl');
        
        const files = await puter.fs.readdir('DigitalForge/hdl');
        const hdlFiles = files.filter(f => f.name.endsWith('.vhd') || f.name.endsWith('.v'));
        
        if (hdlFiles.length === 0) {
            showToast('No saved HDL files found in cloud', 'info');
            return;
        }
        
        // Crear modal dialog
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-black border border-purple-500/30 rounded-2xl p-6 max-w-md w-full m-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-white flex items-center">
                        <i class="fas fa-cloud-download-alt text-purple-400 mr-2"></i>
                        Load HDL from Cloud
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-white/60 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-white/80 mb-2">Select File</label>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            ${hdlFiles.map(f => `
                                <div class="flex items-center gap-2">
                                    <button onclick="handleHDLCloudLoad('${f.name}')" class="flex-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg text-left transition-all group">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <span class="text-white font-medium">${f.name}</span>
                                                <span class="text-xs text-white/40 ml-2">${f.name.endsWith('.vhd') ? 'VHDL' : 'Verilog'}</span>
                                            </div>
                                            <i class="fas fa-download text-white/40 group-hover:text-purple-400"></i>
                                        </div>
                                    </button>
                                    <button onclick="deleteCloudFile('DigitalForge/hdl/${f.name}', 'hdl')" class="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all" title="Eliminar">
                                        <i class="fas fa-trash text-red-400"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('❌ Error loading HDL files:', error);
        showToast('Error loading HDL files', 'error');
    }
}

// Handle HDL cloud load
async function handleHDLCloudLoad(filename) {
    try {
        const path = `DigitalForge/hdl/${filename}`;
        const blob = await puter.fs.read(path);
        const code = await blob.text();
        
        const hdlOutput = document.getElementById('hdlOutput');
        if (hdlOutput) {
            hdlOutput.textContent = code;
            if (typeof AppState !== 'undefined') {
                AppState.hdlCode = code;
            }
        }
        
        // Mostrar success message
        showToast(`✅ HDL file "${filename}" loaded successfully!`, 'success');
    } catch (error) {
        console.error('❌ Error loading HDL file:', error);
        showToast(`❌ Error loading "${filename}": ${error.message}`, 'error');
    } finally {
        // Always close the modal, even if there's an error
        const modal = document.querySelector('.fixed');
        if (modal) modal.remove();
    }
}

// Exportar funciones to global scope
window.PuterService = PuterService;
window.initializePuterAdvanced = initializePuterAdvanced;
window.saveCircuitToCloud = saveCircuitToCloud;
window.loadCircuitFromCloud = loadCircuitFromCloud;
window.saveHDLToCloud = saveHDLToCloud;
window.getCircuitAIHelp = getCircuitAIHelp;
window.getHDLAIHelp = getHDLAIHelp;
window.generateHDLWithAI = generateHDLWithAI;
window.openPuterCloud = openPuterCloud;
window.openPuterDocs = openPuterDocs;
window.showAbout = showAbout;
window.showCloudSaveDialog = showCloudSaveDialog;
window.showCloudLoadDialog = showCloudLoadDialog;
window.handleCloudSave = handleCloudSave;
window.handleCloudLoad = handleCloudLoad;
window.showHDLCloudSaveDialog = showHDLCloudSaveDialog;
window.showHDLCloudLoadDialog = showHDLCloudLoadDialog;
window.handleHDLCloudSave = handleHDLCloudSave;
window.handleHDLCloudLoad = handleHDLCloudLoad;

// Eliminar cloud file
async function deleteCloudFile(path, type) {
    if (!confirm(`¿Estás seguro de que quieres eliminar este archivo?`)) {
        return;
    }
    
    try {
        await puter.fs.delete(path);
        showToast('Archivo eliminado correctamente', 'success');
        
        // Refrescar the dialog
        document.querySelector('.fixed')?.remove();
        
        if (type === 'circuit') {
            await showCloudLoadDialog();
        } else if (type === 'hdl') {
            await showHDLCloudLoadDialog();
        }
    } catch (error) {
        console.error('❌ Error deleting file:', error);
        showToast('Error al eliminar archivo', 'error');
    }
}

window.deleteCloudFile = deleteCloudFile;

console.log('✅ Integración Avanzada de Puter cargada');
