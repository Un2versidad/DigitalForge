// Diseñador de Circuitos

let circuitComponents = [];
let circuitConnections = [];
let canvas = null;
let ctx = null;
let selectedComponent = null;
let draggingComponent = null;
let connectingFrom = null;
let isSimulating = false;
let mousePos = { x: 0, y: 0 };

// Definiciones de componentes
const COMPONENT_TYPES = {
    input: { width: 40, height: 30, color: '#10b981', label: 'IN', inputs: 0, outputs: 1 },
    output: { width: 40, height: 30, color: '#f59e0b', label: 'OUT', inputs: 1, outputs: 0 },
    and: { width: 50, height: 40, color: '#3b82f6', label: 'AND', inputs: 2, outputs: 1 },
    or: { width: 50, height: 40, color: '#a855f7', label: 'OR', inputs: 2, outputs: 1 },
    not: { width: 40, height: 30, color: '#ef4444', label: 'NOT', inputs: 1, outputs: 1 },
    xor: { width: 50, height: 40, color: '#ec4899', label: 'XOR', inputs: 2, outputs: 1 }
};

// Inicializar canvas
function initCircuitCanvas() {
    canvas = document.getElementById('logicCanvas');
    if (!canvas) {
        console.error('❌ Elemento canvas no encontrado!');
        return false;
    }
    
    console.log('📐 Canvas element found:', canvas);
    console.log('📏 Canvas offsetWidth:', canvas.offsetWidth, 'offsetHeight:', canvas.offsetHeight);
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('❌ No se pudo obtener el contexto 2D!');
        return false;
    }
    
    // Establecer dimensiones del canvas - forzar tamaño mínimo
    canvas.width = Math.max(canvas.offsetWidth, 800);
    canvas.height = Math.max(canvas.offsetHeight, 400);
    
    console.log('📐 Canvas dimensions set to:', canvas.width, 'x', canvas.height);
    
    // Remover listeners antiguos para evitar duplicados
    canvas.removeEventListener('mousedown', handleCanvasMouseDown);
    canvas.removeEventListener('mousemove', handleCanvasMouseMove);
    canvas.removeEventListener('mouseup', handleCanvasMouseUp);
    canvas.removeEventListener('click', handleCanvasClick);
    canvas.removeEventListener('contextmenu', handleCanvasContextMenu);
    
    // Agregar event listeners
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('contextmenu', handleCanvasContextMenu);
    
    console.log('�� Dibujando circuito inicial...');
    drawCircuit();
    console.log('✅ Diseñador de Circuitos inicializado correctamente');
    
    return true;
}

// Manejar mouse down
function handleCanvasMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    
    const comp = getComponentAtPosition(mousePos.x, mousePos.y);
    if (comp) {
        if (e.shiftKey) {
            connectingFrom = comp;
        } else {
            draggingComponent = comp;
            selectedComponent = comp;
        }
    }
}

// Manejar mouse move
function handleCanvasMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    
    if (draggingComponent) {
        draggingComponent.x = mousePos.x;
        draggingComponent.y = mousePos.y;
        drawCircuit();
    } else if (connectingFrom) {
        drawCircuit();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(connectingFrom.x, connectingFrom.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
    } else {
        // Actualizar cursor basado en lo que está bajo el mouse
        const comp = getComponentAtPosition(mousePos.x, mousePos.y);
        const conn = getConnectionAtPosition(mousePos.x, mousePos.y);
        
        if (comp || conn) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }
}

// Manejar mouse up
function handleCanvasMouseUp(e) {
    if (connectingFrom) {
        const rect = canvas.getBoundingClientRect();
        const pos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        const targetComp = getComponentAtPosition(pos.x, pos.y);
        if (targetComp && targetComp !== connectingFrom) {
            circuitConnections.push({
                from: connectingFrom.id,
                to: targetComp.id
            });
            showToast('Connection created', 'success');
        }
        connectingFrom = null;
    }
    
    draggingComponent = null;
    drawCircuit();
}

// Manejar canvas click
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    
    const comp = getComponentAtPosition(pos.x, pos.y);
    if (comp && comp.type === 'input') {
        comp.state = comp.state === 1 ? 0 : 1;
        console.log(`🔘 Toggled input ${comp.id} to state: ${comp.state}`);
        if (isSimulating) {
            propagateSignals();
        }
        drawCircuit();
        showToast(`Input ${comp.state === 1 ? 'ON' : 'OFF'}`, 'info');
    }
}

// Manejar click derecho (context menu)
function handleCanvasContextMenu(e) {
    e.preventDefault(); // Prevenir menú contextual por defecto
    
    const rect = canvas.getBoundingClientRect();
    const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    
    // Verificar si se hizo click en un componente
    const comp = getComponentAtPosition(pos.x, pos.y);
    if (comp) {
        deleteComponent(comp);
        return;
    }
    
    // Verificar si se hizo click en una conexión
    const conn = getConnectionAtPosition(pos.x, pos.y);
    if (conn) {
        deleteConnection(conn);
        return;
    }
}

// Obtener conexión en posición (verificar si el click está cerca de la línea de conexión)
function getConnectionAtPosition(x, y) {
    const threshold = 10; // píxeles
    
    for (let conn of circuitConnections) {
        const fromComp = circuitComponents.find(c => c.id === conn.from);
        const toComp = circuitComponents.find(c => c.id === conn.to);
        
        if (!fromComp || !toComp) continue;
        
        // Calcular distancia de punto a segmento de línea
        const dist = distanceToLineSegment(x, y, fromComp.x, fromComp.y, toComp.x, toComp.y);
        
        if (dist < threshold) {
            return conn;
        }
    }
    
    return null;
}

// Calcular distancia de punto a segmento de línea
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
        param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
}

// Eliminar componente
function deleteComponent(comp) {
    const index = circuitComponents.findIndex(c => c.id === comp.id);
    if (index === -1) return;
    
    // Remover componente
    circuitComponents.splice(index, 1);
    
    // Remover todas las conexiones hacia/desde este componente
    circuitConnections = circuitConnections.filter(conn => 
        conn.from !== comp.id && conn.to !== comp.id
    );
    
    console.log(`🗑️ Deleted component: ${comp.type} (id: ${comp.id})`);
    console.log(`📊 Remaining components: ${circuitComponents.length}`);
    
    updateComponentCount();
    drawCircuit();
    
    showToast(`${comp.type.toUpperCase()} deleted`, 'success');
}

// Eliminar conexión
function deleteConnection(conn) {
    const index = circuitConnections.findIndex(c => c.id === conn.id);
    if (index === -1) return;
    
    circuitConnections.splice(index, 1);
    
    console.log(`🗑️ Deleted connection: ${conn.from} → ${conn.to}`);
    console.log(`📊 Remaining connections: ${circuitConnections.length}`);
    
    updateComponentCount();
    drawCircuit();
    
    showToast('Connection deleted', 'success');
}

// Obtener componente en posición
function getComponentAtPosition(x, y) {
    for (let i = circuitComponents.length - 1; i >= 0; i--) {
        const comp = circuitComponents[i];
        const def = COMPONENT_TYPES[comp.type];
        if (x >= comp.x - def.width/2 && x <= comp.x + def.width/2 &&
            y >= comp.y - def.height/2 && y <= comp.y + def.height/2) {
            return comp;
        }
    }
    return null;
}

// Agregar componente
function addComponent(type) {
    console.log('➕ Adding component:', type);
    
    if (!COMPONENT_TYPES[type]) {
        showToast('Invalid component type', 'error');
        return;
    }
    
    // Verificar si el canvas está inicializado
    if (!canvas || !ctx) {
        console.warn('⚠️ Canvas no inicializado, inicializando ahora...');
        const success = initCircuitCanvas();
        if (!success) {
            showToast('Canvas not ready, please try again', 'error');
            return;
        }
    }
    
    const component = {
        id: Date.now() + Math.random(),
        type: type,
        x: 100 + circuitComponents.length * 60,
        y: 150,
        state: type === 'input' ? 0 : null
    };
    
    circuitComponents.push(component);
    console.log('📦 Component added:', component);
    console.log('📊 Total components:', circuitComponents.length);
    
    updateComponentCount();
    
    // Forzar redibujo
    console.log('🎨 Forzando redibujo...');
    drawCircuit();
    
    showToast(`${type.toUpperCase()} added - Drag to move, Shift+Click to connect`, 'success');
}

// Limpiar canvas
function clearCanvas() {
    circuitComponents = [];
    circuitConnections = [];
    selectedComponent = null;
    isSimulating = false;
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCircuit();
    }
    updateComponentCount();
    showToast('Canvas cleared', 'success');
}

// Actualizar contador de componentes
function updateComponentCount() {
    const countEl = document.getElementById('componentCount');
    if (countEl) {
        countEl.textContent = `${circuitComponents.length} components, ${circuitConnections.length} connections`;
    }
}

// Dibujar circuito
function drawCircuit() {
    if (!ctx || !canvas) {
        console.warn('⚠️ Canvas o contexto no disponible');
        return;
    }
    
    // Asegurar que el canvas tenga dimensiones apropiadas
    if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = canvas.offsetWidth || 800;
        canvas.height = canvas.offsetHeight || 400;
    }
    
    console.log('🎨 drawCircuit called. Canvas:', canvas.width, 'x', canvas.height, 'Components:', circuitComponents.length);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Dibujar instrucciones si no hay componentes
    if (circuitComponents.length === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👆 Click components on the left to add them', canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText('🖱️ Drag components to move them', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('⇧ Shift + Click to connect components', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('▶️ Click Simulate to test your circuit', canvas.width / 2, canvas.height / 2 + 50);
        console.log('📝 Instrucciones dibujadas (aún no hay componentes)');
        return;
    }
    
    console.log(`🎨 Drawing ${circuitComponents.length} components`);
    
    // Dibujar conexiones
    circuitConnections.forEach(conn => {
        const fromComp = circuitComponents.find(c => c.id === conn.from);
        const toComp = circuitComponents.find(c => c.id === conn.to);
        if (fromComp && toComp) {
            // Verificar si el mouse está sobre esta conexión
            const isHovered = getConnectionAtPosition(mousePos.x, mousePos.y) === conn;
            
            // Determine if signal is active
            const isActive = fromComp.state === 1;
            ctx.strokeStyle = isHovered ? '#fbbf24' : (isActive ? '#10b981' : '#a855f7');
            ctx.lineWidth = isHovered ? 5 : (isActive ? 4 : 3);
            
            // Dibujar línea de conexión
            ctx.beginPath();
            ctx.moveTo(fromComp.x, fromComp.y);
            ctx.lineTo(toComp.x, toComp.y);
            ctx.stroke();
            
            // Draw arrow at end
            const angle = Math.atan2(toComp.y - fromComp.y, toComp.x - fromComp.x);
            const arrowSize = 12;
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.moveTo(toComp.x, toComp.y);
            ctx.lineTo(
                toComp.x - arrowSize * Math.cos(angle - Math.PI / 6),
                toComp.y - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                toComp.x - arrowSize * Math.cos(angle + Math.PI / 6),
                toComp.y - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
            
            // Draw signal indicator dot
            if (isActive) {
                const midX = (fromComp.x + toComp.x) / 2;
                const midY = (fromComp.y + toComp.y) / 2;
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(midX, midY, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw hover indicator
            if (isHovered) {
                const midX = (fromComp.x + toComp.x) / 2;
                const midY = (fromComp.y + toComp.y) / 2;
                ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
                ctx.beginPath();
                ctx.arc(midX, midY, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
    
    // Dibujar marcadores de prueba PRIMERO para verificar que el canvas funciona
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(10, 10, 20, 20);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(canvas.width - 30, 10, 20, 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Components: ${circuitComponents.length}`, 40, 25);
    
    console.log('✅ Marcadores de prueba dibujados');
    
    // Draw hover tooltip
    const hoveredComp = getComponentAtPosition(mousePos.x, mousePos.y);
    const hoveredConn = getConnectionAtPosition(mousePos.x, mousePos.y);
    
    if (hoveredComp || hoveredConn) {
        const text = hoveredComp 
            ? `Right-click to delete ${hoveredComp.type.toUpperCase()}`
            : 'Right-click to delete connection';
        
        // Calcular dimensiones del tooltip
        const padding = 8;
        const fontSize = 12;
        const textWidth = text.length * 7;
        const tooltipWidth = textWidth + padding * 2;
        const tooltipHeight = 24;
        
        // Position tooltip away from cursor (offset more)
        let tooltipX = mousePos.x + 25;
        let tooltipY = mousePos.y - 40;
        
        // Mantener tooltip dentro de los límites del canvas
        if (tooltipX + tooltipWidth > canvas.width) {
            tooltipX = mousePos.x - tooltipWidth - 25;
        }
        if (tooltipY < 0) {
            tooltipY = mousePos.y + 25;
        }
        
        // Draw tooltip background with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
        ctx.fill();
        
        // Reiniciar shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw tooltip text
        ctx.fillStyle = '#ffffff';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, tooltipX + padding, tooltipY + tooltipHeight / 2);
    }
    
    // Dibujar componentes AL FINAL para que estén're on top
    console.log(`🎨 About to draw ${circuitComponents.length} components`);
    
    circuitComponents.forEach((comp, index) => {
        const def = COMPONENT_TYPES[comp.type];
        if (!def) {
            console.error('❌ No definition for component type:', comp.type);
            return;
        }
        
        const isActive = comp.state === 1;
        
        console.log(`🎨 Drawing component ${index}:`, comp.type, 'at', comp.x, comp.y, 'def:', def);
        
        // Calculate position
        const x = comp.x - def.width/2;
        const y = comp.y - def.height/2;
        
        console.log(`📐 Rectangle at (${x}, ${y}) size ${def.width}x${def.height}`);
        
        // Dibujar cuerpo del componente
        ctx.fillStyle = isActive ? '#10b981' : def.color;
        ctx.fillRect(x, y, def.width, def.height);
        console.log(`✅ Filled with color: ${ctx.fillStyle}`);
        
        // Draw border
        ctx.strokeStyle = comp === selectedComponent ? '#fbbf24' : '#ffffff';
        ctx.lineWidth = comp === selectedComponent ? 4 : 3;
        ctx.strokeRect(x, y, def.width, def.height);
        console.log(`✅ Stroked with color: ${ctx.strokeStyle}`);
        
        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.label, comp.x, comp.y);
        console.log(`✅ Drew label: ${def.label}`);
        
        // Draw state indicator for inputs
        if (comp.type === 'input') {
            ctx.fillStyle = isActive ? '#10b981' : '#ef4444';
            ctx.beginPath();
            ctx.arc(comp.x + def.width/2 + 10, comp.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
            console.log(`✅ Drew input indicator`);
        }
    });
    
    console.log('✅ Draw complete. Total components drawn:', circuitComponents.length);
}

// Simular circuito
function simulateCircuit() {
    if (circuitComponents.length === 0) {
        showToast('Add components first', 'warning');
        return;
    }
    
    isSimulating = !isSimulating;
    
    // Update UI
    const simulateBtn = document.getElementById('simulateBtn');
    const simulateBtnText = document.getElementById('simulateBtnText');
    const simulationStatus = document.getElementById('simulationStatus');
    
    if (isSimulating) {
        // Iniciar simulation
        propagateSignals();
        
        // Update button text only
        if (simulateBtnText) {
            simulateBtnText.textContent = 'Stop Simulation';
        }
        if (simulateBtn) {
            const icon = simulateBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-stop mr-2';
            }
        }
        
        // Mostrar status indicator
        if (simulationStatus) {
            simulationStatus.classList.remove('hidden');
        }
        
        showToast('Simulation started - Click inputs to toggle', 'success');
    } else {
        // Detener simulation
        
        // Update button text only
        if (simulateBtnText) {
            simulateBtnText.textContent = 'Start Simulation';
        }
        if (simulateBtn) {
            const icon = simulateBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-play mr-2';
            }
        }
        
        // Ocultar status indicator
        if (simulationStatus) {
            simulationStatus.classList.add('hidden');
        }
        
        showToast('Simulation stopped', 'info');
    }
    
    drawCircuit();
}

// Propagate signals
function propagateSignals() {
    circuitComponents.forEach(comp => {
        if (comp.type !== 'input') {
            comp.state = null;
        }
    });
    
    let changed = true;
    let iterations = 0;
    
    while (changed && iterations < 100) {
        changed = false;
        iterations++;
        
        circuitComponents.forEach(comp => {
            if (comp.type === 'input') return;
            
            const inputs = circuitConnections
                .filter(conn => conn.to === comp.id)
                .map(conn => {
                    const fromComp = circuitComponents.find(c => c.id === conn.from);
                    return fromComp ? fromComp.state : 0;
                })
                .filter(state => state !== null);
            
            if (inputs.length === 0) return;
            
            let newState = null;
            
            switch (comp.type) {
                case 'and':
                    newState = inputs.every(s => s === 1) ? 1 : 0;
                    break;
                case 'or':
                    newState = inputs.some(s => s === 1) ? 1 : 0;
                    break;
                case 'not':
                    newState = inputs[0] === 1 ? 0 : 1;
                    break;
                case 'xor':
                    newState = inputs.filter(s => s === 1).length % 2 === 1 ? 1 : 0;
                    break;
                case 'output':
                    newState = inputs[0];
                    break;
            }
            
            if (newState !== null && newState !== comp.state) {
                comp.state = newState;
                changed = true;
            }
        });
    }
    
    drawCircuit();
}

// Step simulation
function stepSimulation() {
    if (!isSimulating) {
        isSimulating = true;
    }
    propagateSignals();
    showToast('Step forward', 'info');
}

// Exportar circuito
function exportCircuit() {
    if (circuitComponents.length === 0) {
        showToast('No circuit to export', 'warning');
        return;
    }
    
    const data = {
        components: circuitComponents,
        connections: circuitConnections,
        metadata: {
            created: new Date().toISOString(),
            version: '1.0'
        }
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circuit_${Date.now()}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Circuit exported successfully', 'success');
}

// Inicializar on tab switch
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Diseñador de Circuitos: DOM cargado');
    
    // Try immediate initialization
    initCircuitCanvas();
    
    // Also try after delay
    setTimeout(() => {
        initCircuitCanvas();
    }, 1000);
    
    // Retry initialization when switching tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            console.log('📑 Tab switched to:', tab);
            if (tab === 'circuit-designer') {
                setTimeout(() => {
                    console.log('🔄 Re-inicializando canvas del circuito...');
                    initCircuitCanvas();
                    // Force a redraw
                    if (canvas && ctx) {
                        canvas.width = canvas.offsetWidth;
                        canvas.height = canvas.offsetHeight;
                        // Cargar ejemplo por defecto si no hay componentes
                        loadDefaultExample();
                        drawCircuit();
                    }
                }, 500);
            }
        });
    });
});

// Add window resize handler
window.addEventListener('resize', () => {
    if (canvas && ctx) {
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        if (oldWidth !== canvas.width || oldHeight !== canvas.height) {
            drawCircuit();
        }
    }
});

// Circuitos de ejemplo
const EXAMPLE_CIRCUITS = {
    halfAdder: {
        name: 'Half Adder',
        description: 'Adds two bits (A + B = Sum, Carry)',
        components: [
            { id: 1, type: 'input', x: 100, y: 100, state: 0 },
            { id: 2, type: 'input', x: 100, y: 200, state: 0 },
            { id: 3, type: 'xor', x: 250, y: 150, state: null },
            { id: 4, type: 'and', x: 250, y: 250, state: null },
            { id: 5, type: 'output', x: 400, y: 150, state: null },
            { id: 6, type: 'output', x: 400, y: 250, state: null }
        ],
        connections: [
            { id: 1, from: 1, to: 3, fromType: 'input', toType: 'xor' },
            { id: 2, from: 2, to: 3, fromType: 'input', toType: 'xor' },
            { id: 3, from: 1, to: 4, fromType: 'input', toType: 'and' },
            { id: 4, from: 2, to: 4, fromType: 'input', toType: 'and' },
            { id: 5, from: 3, to: 5, fromType: 'xor', toType: 'output' },
            { id: 6, from: 4, to: 6, fromType: 'and', toType: 'output' }
        ]
    },
    fullAdder: {
        name: 'Full Adder',
        description: 'Adds three bits (A + B + Cin = Sum, Cout)',
        components: [
            { id: 1, type: 'input', x: 80, y: 100, state: 0 },
            { id: 2, type: 'input', x: 80, y: 180, state: 0 },
            { id: 3, type: 'input', x: 80, y: 260, state: 0 },
            { id: 4, type: 'xor', x: 200, y: 140, state: null },
            { id: 5, type: 'xor', x: 320, y: 180, state: null },
            { id: 6, type: 'and', x: 200, y: 220, state: null },
            { id: 7, type: 'and', x: 320, y: 260, state: null },
            { id: 8, type: 'or', x: 440, y: 240, state: null },
            { id: 9, type: 'output', x: 560, y: 180, state: null },
            { id: 10, type: 'output', x: 560, y: 240, state: null }
        ],
        connections: [
            { id: 1, from: 1, to: 4, fromType: 'input', toType: 'xor' },
            { id: 2, from: 2, to: 4, fromType: 'input', toType: 'xor' },
            { id: 3, from: 4, to: 5, fromType: 'xor', toType: 'xor' },
            { id: 4, from: 3, to: 5, fromType: 'input', toType: 'xor' },
            { id: 5, from: 1, to: 6, fromType: 'input', toType: 'and' },
            { id: 6, from: 2, to: 6, fromType: 'input', toType: 'and' },
            { id: 7, from: 4, to: 7, fromType: 'xor', toType: 'and' },
            { id: 8, from: 3, to: 7, fromType: 'input', toType: 'and' },
            { id: 9, from: 6, to: 8, fromType: 'and', toType: 'or' },
            { id: 10, from: 7, to: 8, fromType: 'and', toType: 'or' },
            { id: 11, from: 5, to: 9, fromType: 'xor', toType: 'output' },
            { id: 12, from: 8, to: 10, fromType: 'or', toType: 'output' }
        ]
    },
    srLatch: {
        name: 'SR Latch',
        description: 'Set-Reset latch (basic memory)',
        components: [
            { id: 1, type: 'input', x: 100, y: 120, state: 0 },
            { id: 2, type: 'input', x: 100, y: 220, state: 0 },
            { id: 3, type: 'or', x: 250, y: 140, state: null },
            { id: 4, type: 'or', x: 250, y: 200, state: null },
            { id: 5, type: 'output', x: 400, y: 140, state: null },
            { id: 6, type: 'output', x: 400, y: 200, state: null }
        ],
        connections: [
            { id: 1, from: 1, to: 3, fromType: 'input', toType: 'or' },
            { id: 2, from: 2, to: 4, fromType: 'input', toType: 'or' },
            { id: 3, from: 4, to: 3, fromType: 'or', toType: 'or' },
            { id: 4, from: 3, to: 4, fromType: 'or', toType: 'or' },
            { id: 5, from: 3, to: 5, fromType: 'or', toType: 'output' },
            { id: 6, from: 4, to: 6, fromType: 'or', toType: 'output' }
        ]
    },
    mux2to1: {
        name: '2-to-1 Multiplexer',
        description: 'Selects between two inputs',
        components: [
            { id: 1, type: 'input', x: 80, y: 100, state: 0 },
            { id: 2, type: 'input', x: 80, y: 180, state: 0 },
            { id: 3, type: 'input', x: 80, y: 260, state: 0 },
            { id: 4, type: 'not', x: 200, y: 260, state: null },
            { id: 5, type: 'and', x: 320, y: 120, state: null },
            { id: 6, type: 'and', x: 320, y: 200, state: null },
            { id: 7, type: 'or', x: 460, y: 160, state: null },
            { id: 8, type: 'output', x: 580, y: 160, state: null }
        ],
        connections: [
            { id: 1, from: 3, to: 4, fromType: 'input', toType: 'not' },
            { id: 2, from: 1, to: 5, fromType: 'input', toType: 'and' },
            { id: 3, from: 4, to: 5, fromType: 'not', toType: 'and' },
            { id: 4, from: 2, to: 6, fromType: 'input', toType: 'and' },
            { id: 5, from: 3, to: 6, fromType: 'input', toType: 'and' },
            { id: 6, from: 5, to: 7, fromType: 'and', toType: 'or' },
            { id: 7, from: 6, to: 7, fromType: 'and', toType: 'or' },
            { id: 8, from: 7, to: 8, fromType: 'or', toType: 'output' }
        ]
    }
};

// Cargar circuito de ejemplo
function loadExample(exampleName) {
    const example = EXAMPLE_CIRCUITS[exampleName];
    if (!example) {
        showToast('Example not found', 'error');
        return;
    }
    
    // Limpiar circuito actual
    circuitComponents = [];
    circuitConnections = [];
    
    // Cargar componentes
    circuitComponents = example.components.map(comp => ({...comp}));
    
    // Cargar conexiones
    circuitConnections = example.connections.map(conn => ({...conn}));
    
    console.log(`📚 Loaded example: ${example.name}`);
    console.log(`📦 Components: ${circuitComponents.length}`);
    console.log(`🔗 Connections: ${circuitConnections.length}`);
    
    updateComponentCount();
    drawCircuit();
    
    showToast(`${example.name} loaded - ${example.description}`, 'success');
}

// Load default example on first load
function loadDefaultExample() {
    // Deshabilitado por defecto - let users read the instructions first
    // Los usuarios pueden cargar ejemplos manualmente usando los botones de Circuitos de Ejemplo
    console.log('📚 Diseñador de Circuitos listo - ¡Carga un ejemplo o empieza a construir!');
}

// Cargar datos del circuito (para carga desde la nube)
function loadCircuitData(data) {
    if (!data || !data.components) {
        showToast('Invalid circuit data', 'error');
        return;
    }
    
    // Limpiar circuito actual
    circuitComponents = [];
    circuitConnections = [];
    
    // Cargar componentes
    circuitComponents = data.components.map(comp => ({...comp}));
    
    // Cargar conexiones
    if (data.connections) {
        circuitConnections = data.connections.map(conn => ({...conn}));
    }
    
    console.log(`📂 Loaded circuit: ${circuitComponents.length} components, ${circuitConnections.length} connections`);
    
    updateComponentCount();
    drawCircuit();
    
    showToast('Circuit loaded successfully', 'success');
}

// Exportar funciones to global scope
window.addComponent = addComponent;
window.clearCanvas = clearCanvas;
window.simulateCircuit = simulateCircuit;
window.stepSimulation = stepSimulation;
window.exportCircuit = exportCircuit;
window.loadExample = loadExample;
window.loadCircuitData = loadCircuitData;

// Force initialization when script loads
if (document.readyState === 'complete') {
    setTimeout(initCircuitCanvas, 500);
}

console.log('✅ Script del Diseñador de Circuitos cargado');
