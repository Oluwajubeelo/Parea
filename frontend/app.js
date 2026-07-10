setTimeout(() => {
    const mottoStr = "think together. write together."
    const el = document.getElementById('motto-text')
    let i = 0;

    function typeWriter(){
        if(i<mottoStr.length){
            el.innerHTML += mottoStr.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    }
    typeWriter();
}, 3800);

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width, height;

function resizeCanvas(){
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]();:<>+=-*&%$#@!/?';
const particles = [];
const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 24000);
const mouse = {x: -1000, y: -1000, radius:120};

window.addEventListener('mousemove', (e)=>{
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseout', () =>{
    mouse.x = -1000;
    mouse.y = -1000;
});

class Partilcle{
    constructor(){
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.char = charSet[Math.floor(Math.random() * charSet.length)];
        this.size = Math.random() *12 + 10;
        this.baseVy = -(Math.random() * 0.4 + 0.1);
        this.vy = this.baseVy;
        this.vx=0;
    }

    update(activeForces){
        activeForces.forEach(force => {
            const dx = this.x - force.x;
            const dy = this.y - force.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if(dist < force.radius){
                const power = (force.radius - dist) / force.radius;
                this.vx += (dx / dist) * power * 1.5;
                this.vy += (dy / dist) * power * 1.5;
            }
        });

        this.vx *=0.92;
        this.vy = this.vy * 0.92 + this.baseVy * 0.08;

        this.x += this.vx;
        this.y += this.vy;

        if(this.y <-50){
            this.y = height + 50;
            this.x = Math.random() * width;
            this.vx = 0;
            this.vy = this.baseVy;
            this.char = charSet[Math.floor(Math.random() * charSet.length)];
        }
        if(this.x < -50) this.x = width + 50;
        if(this.x > width + 50) this.x = -50;
    }

    draw(){
        ctx.font = `bold ${this.size}px monospace`;
        ctx.fillStyle = `rgba(0,0,0,${particleOpacity})`;
        ctx.fillText(this.char, this.x, this.y);
    }
}

let activeForces = [];
let isConnected = false;
let particleOpacity = 0.35;

for(let i = 0; i < particleCount; i ++){
    particles.push(new Partilcle());
}

function animate(){
    ctx.clearRect(0, 0, width, height);

    if(isConnected){
        particleOpacity -= 0.01;
        if(particleOpacity > 0.85) particleOpacity = 0.85;
    }
    else{
        particleOpacity += 0.01;
        if(particleOpacity > 0.85) particleOpacity = 0.85;
    }

    activeForces = [];

    if(mouse.x > -1000){
        activeForces.push({x: mouse.x, y: mouse.y, radius: mouse.radius});
    }

    const uiElements= document.querySelectorAll('.btn, input[type="text"], input[type="password"], #document-editor');
    uiElements.forEach(el =>{
        const rect = el.getBoundingClientRect();
        if(rect.width > 0){
            activeForces.push({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                radius: Math.max(rect.width, rect.height) / 1.2
            });
        }
    });

    particles.forEach(p => {
        if(particleOpacity>0){
            p.update(activeForces);
            p.draw();
        }
    });
    requestAnimationFrame(animate);
}
animate();

function showToast(message){
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5300);
}

function formatText(command, value = null){
    document.execCommand(command, false, value);
    document.getElementById('document-editor').focus();

    if(ws && ws.readyState === WebSocket.OPEN){
        const message = {
            type: "TEXT_UPDATE",
            content: document.getElementById('document-editor').innerHTML,
            senderId: "CLIENT"
        };
        ws.send(JSON.stringify(message));
    }
}

function getCaretPosition(element){
    let caretOffset = 0;
    const doc = element.ownerDocument || element.document;
    const win = doc.defaultView || doc.parentWindow;
    const sel = win.getSelection();
    if (sel.rangeCount > 0){
        const range = win.getSelection().getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
}

function setCaretPosition(element, offset){
    const doc = element.ownerDocument || element.document;
    const win = doc.defaultView || doc.parentWindow;
    const sel = win.getSelection();
    const range = doc.createRange();

    let currentOffset = 0;
    let stop = false;

    function traverseNodes(node){
        if(stop) return;
        if(node.nodeType === 3){
            let nodeLength = node.length;
            if( currentOffset + nodeLength >= offset){
                range.setStart(node, offset - currentOffset);
                range.setEnd(node, offset - currentOffset);
            }
            else{
                currentOffset += nodeLength;
            }
        }
        else{
            for(let i = 0; i <node.childNodes.length; i++){
                traverseNodes(node.childNodes[i]);
            }
        }
    }
    traverseNodes(element);

    if(!stop){
        range.selectNodeContents(element);
        range.collapse(false);
    }

    sel.removeAllRanges();
    sel.addRange(range);
}

function applyOverwriteAndUnpack(rawHTML){
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHTML;
    const backupImg = tempDiv.querySelector('#parea-canvas-backup');

    if(backupImg){
        const img = new Image();
        img.onload = () =>{
            dCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            dCtx.drawImage(img, 0, 0);
        }
        img.src = backupImg.src;
        backupImg.remove();
    }

    const strippedText = tempDiv.innerHTML;

    if(document.activeElement === editor){
        const currentPos = getCaretPosition(editor);
        editor.innerHTML = strippedText;
        setCaretPosition(editor, currentPos);
    }
    else{
        editor.innerHTML = strippedText;
    }
}

const importBtn = document.getElementById('import-btn');
const fileInput = document.getElementById('file-import');
const importModal = document.getElementById('import-modal');
const importModalText = document.getElementById('import-modal-text');
const approveBtn = document.getElementById('approve-btn');
const denyBtn = document.getElementById('deny-btn');
const leaveBtn = document.getElementById('leave-btn');

let isHostUser = false;
let pendingImportText ="";
let myUsername = "";
let pendingGuestId = "";
let pendingFileName= "";
let isLastUser = false;
let currentRoomCode = "";
let typingTimeout = null;

importBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;

    const maxSize = 5 * 1024 * 1024;
    if(file.size > maxSize){
        showToast('⚠️ File is too large! Maximum limit is 5MB.');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        if(isHostUser){
            applyOverwriteAndUnpack(text);
            ws.send(JSON.stringify({type: "FORCE_OVERWRITE", content: text, fileName: file.name, senderName: myUsername, senderId: "HOST"}));
            showToast('📄 File imported succcessfully');
        }
        else{
            ws.send(JSON.stringify({type: "IMPORT_REQUEST", content: text, fileName: file.name, senderId: "CLIENT"}));
            showToast('⏳ Sent import request to the Host...')
        }
    };
    reader.readAsText(file);
    e.target.value='';
});

approveBtn.addEventListener('click', () => {
    importModal.style.opacity ='0';
    setTimeout(() => importModal.style.display = 'none' , 300);

    applyOverwriteAndUnpack(pendingImportText);
    ws.send(JSON.stringify({type: "FORCE_OVERWRITE", content: pendingImportText, fileName: pendingFileName, senderName: myUsername, senderId: "HOST"}));
    showToast('✅ Import approved and applied.')
});

denyBtn.addEventListener('click', () => {
    importModal.style.opacity = '0';
    setTimeout(() => importModal.style.display = 'none', 300);

    ws.send(JSON.stringify({type: "IMPORT_DENIED", content: "Host rejected the import.", senderId: pendingGuestId}));
})

leaveBtn.addEventListener('click', async () => {
    if(isLastUser){
        try{
            const backupHTML = editor.innerHTML + '<img id="parea-canvas-backup" src="' + drawingCanvas.toDataURL() + '" style="display:none;">';
            if(window.showSaveFilePicker){
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName:'Parea_Backup.html',
                    types: [{
                        description: 'HTML Document',
                        accept: {'text/html': ['.html']},
                    }],
                });
                const blob = new Blob([backupHTML],{type: 'text/html'});
                const url = URL.createdObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Parea_Backup.html'
                a.click();
                URL.revokeObjectURL(url);
            }
        }
        catch(error){
            if(error.name !== "AbortError"){
                showToast('❌ Failed to save backup.')
            }
        }
    }

    if(ws) ws.close();
    location.reload();
});

let ws = null;
let pingInterval;

const setupScreen = document.getElementById('setup-screen');
const editorScreen = document.getElementById('editor-screen');
const formatToolbar = document.getElementById('format-toolbar');
const createBtn = document.getElementById('create-room-btn');
const joinBtn = document.getElementById('join-room-btn');
const roomInput = document.getElementById('room-code-input');
const createUsernameInput = document.getElementById('create-username-input');
const createPasswordInput = document.getElementById('create-password-input');
const joinPasswordInput = document.getElementById('join-password-input');
const joinUsernameInput = document.getElementById('join-username-input');
const editor = document.getElementById('document-editor');
const roomDisplay = document.getElementById('room-display');
const roleDisplay = document.getElementById('role-display');
const usersListDisplay = document.getElementById('users-list');
const usersDisplay = document.getElementById('users-display');
const copyCodeBtn = document.getElementById('copy-code-btn');
const typingIndicator = document.getElementById('typing-indicator');
const toggleCreatePw = document.getElementById('toggle-create-pw');
const toggleJoinPw = document.getElementById('toggle-join-pw');
const modeSelector = document.getElementById('mode-selector');
const workspaceContainer = document.getElementById('workspace-container');
const drawingCanvas = document.getElementById('drawing-canvas');
const dCtx = drawingCanvas.getContext('2d');
const toggleChatBtn = document.getElementById('toggle-chat-btn');
const chatSidebar = document.getElementById('chat-sidebar');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');
let currentReplyContext = null;
const replyPreview = document.getElementById('reply-preview');
const replyPreviewSender = document.getElementById('reply-preview-sender');
const replyPreviewText = document.getElementById('reply-preview-text');
const cancelReplyBtn = document.getElementById('cancel-reply-btn');

if(cancelReplyBtn){
    cancelReplyBtn.addEventListener('click', () => {
        currentReplyContext = null;
        replyPreview.style.display = 'none';
    });
}

function setReplyContext(sender, text){
    currentReplyContext = {sender, text};
    replyPreviewSender.innerText = "Replying to " + sender;
    replyPreviewText.innerText = text;
    replyPreview.style.display = 'flex';
    chatInput.focus();
}

if(toggleChatBtn && chatSidebar){
    toggleChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = window.getComputedStyle(chatSidebar).display === 'none';
        if(isHidden){
            chatSidebar.style.display = 'flex';
        }
        else{
            chatSidebar.style.display = 'none';
        }
    });
}

function appendChatMessage(senderName, messageContent, replySender = null, replyText = null, isMe = false){
    if(!chatHistory) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message ' + (isMe ? 'msg-self' : 'msg-other');

    const replyBtn = document.createElement('button');
    replyBtn.className = 'reply-btn';
    replyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>`;
    replyBtn.title = 'Reply';
    replyBtn.onclick = () => setReplyContext(senderName, messageContent);
    msgDiv.appendChild(replyBtn);

    if(replySender && replyText){
        const quoteDiv = document.createElement('div');
        quoteDiv.className = 'quoted-reply';
        quoteDiv.innerHTML = `<strong style="color: var(--text-color);">${replySender}</strong><br>${replyText}`;
        msgDiv.appendChild(quoteDiv);
    }

    if(!isMe){
        const nameDiv = document.createElement('div');
        nameDiv.className = 'sender-name';
        nameDiv.innerText = senderName;
        msgDiv.appendChild(nameDiv);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerText = messageContent;
    msgDiv.appendChild(contentDiv);
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

if(chatInput){
    chatInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter'){
            e.preventDefault();
            const msg = chatInput.value.trim();
            if(msg && ws && ws.readyState === WebSocket.OPEN){
                appendChatMessage(myUsername, msg, currentReplyContext?.sender, currentReplyContext?.text, true);

                ws.send(JSON.stringify({
                    type: "CHAT_MESSAGE",
                    content: msg,
                    senderName: myUsername,
                    senderId: "CLIENT",
                    replyToSender: currentReplyContext ? currentReplyContext.sender : null,
                    replyToContent: currentReplyContext ? currentReplyContext.text : null
                }));
                chatInput.value = '';
                currentReplyContext = null;
                if (replyPreview) replyPreview.style.display = 'none';
            }
        }
    });
}

drawingCanvas.width = 1600;
drawingCanvas.height = 1200;

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let isEraser = false;
const penBtn = document.getElementById('pen-btn');
const eraserBtn = document.getElementById('eraser-btn');

let penSize = 4;
let eraserSize = 20;
const brushSizeInput = document.getElementById('brush-size');

brushSizeInput.addEventListener('input', (e) =>{
    if(isEraser){
        eraserSize = e.target.value;
    }
    else{
        penSize = e.target.value;
    }
});

penBtn.style.background = 'var(--text-color)';
penBtn.style.color = 'var(--bg-color)';

penBtn.addEventListener('click', () => {
    isEraser = false;
    drawingCanvas.style.cursor = 'crosshair';
    penBtn.style.background = 'var(--text-color)';
    penBtn.style.color = 'var(--bg-color)';
    eraserBtn.style.background = 'var(--bg-color)';
    eraserBtn.style.color = 'var(--text-color)';
    brushSizeInput.value = penSize;
});

eraserBtn.addEventListener('click', () => {
    isEraser = true;
    drawingCanvas.style.cursor = 'cell';
    eraserBtn.style.background = 'var(--text-color)';
    eraserBtn.style.color = 'var(--bg-color)';
    penBtn.style.background = 'var(--bg-color)';
    penBtn.style.color = 'var(--text-color)';
    brushSizeInput.value = eraserSize;
});

modeSelector.addEventListener('change', (e) => {
    const newMode = e.target.value;
    workspaceContainer.className = '';
    if(newMode === 'WRITING') workspaceContainer.classList.add('mode-writing');
    else if(newMode ==='DRAWING') workspaceContainer.classList.add('mode-drawing');
    else if(newMode === 'BOTH') workspaceContainer.classList.add('mode-both');

    if(ws && ws.readyState === WebSocket.OPEN){
        ws.send(JSON.stringify({type: "MODE_UPDATE", content: newMode, senderId: "HOST"}));
    }
});

function drawLine(x0, y0, x1, y1, color, isEraserMode, size, emit){
    dCtx.beginPath();
    dCtx.moveTo(x0, y0);
    dCtx.lineTo(x1, y1);

    if(isEraserMode){
        dCtx.globalCompositeOperation = 'destination-out';
        dCtx.lineWidth = size;
        dCtx.strokeStyle = 'rgba(0,0,0,1)';
    }
    else{
        dCtx.globalCompositeOperation = 'source-over';
        dCtx.lineWidth = size;
        dCtx.strokeStyle = color;
    }
    dCtx.lineCap = 'round';
    dCtx.stroke();
    dCtx.closePath();

    dCtx.globalCompositeOperation = 'source-over';

    if(emit && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: "DRAWING_UPDATE",
            content: JSON.stringify({x0, y0, x1, y1, color, isEraserMode, size}),
            senderId: "CLIENT"
        }));
    }
}

drawingCanvas.addEventListener('mousedown', (e) =>{
    isDrawing = true;
    const rect = drawingCanvas.getBoundingClientRect();
    const scaleX = drawingCanvas.width / rect.width;
    const scaleY = drawingCanvas.height / rect.height;
    lastX = (e.clientX - rect.left) * scaleX;
    lastY = (e.clientY - rect.top) * scaleY;
});

drawingCanvas.addEventListener('mousemove', (e) =>{
    if(!isDrawing) return;
    const rect = drawingCanvas.getBoundingClientRect();
    const scaleX = drawingCanvas.width / rect.width;
    const scaleY = drawingCanvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const color = document.getElementById('color-picker').value || '#000000';
    const currentSize = isEraser ? eraserSize : penSize;
    drawLine(lastX, lastY, currentX, currentY, color, isEraser, currentSize, true);
    lastX = currentX;
    lastY = currentY;
});

window.addEventListener('mouseup', () =>{
    isDrawing = false;
})

const eyeOpenSVG = `<svg xmlns="http://www/w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

function setupPasswordToggle(toggleBtn, inputEl){
    toggleBtn.addEventListener('click', () => {
        if(inputEl.type === 'password'){
            inputEl.type='text';
            toggleBtn.innerHTML = eyeClosedSVG;
        }
        else{
            inputEl.type = 'password';
            toggleBtn.innerHTML = eyeOpenSVG;
        }
    });
}

setupPasswordToggle(toggleCreatePw, createPasswordInput);
setupPasswordToggle(toggleJoinPw, joinPasswordInput);

copyCodeBtn.addEventListener('click', () => {
    if(currentRoomCode){
        const tempInput = document.createElement("input");
        tempInput.value = currentRoomCode;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        showToast('📋 Room code copied to clipboard!')
    }
});

createBtn.addEventListener('click', async() => {
    myUsername = createUsernameInput.value.trim();
    const myPassword = createPasswordInput.value.trim();

    if(!myUsername){
        showToast('⚠️ PLEASE ENTER A USERNAME');
        return;
    }

    try{
        const response = await fetch ('/api/create-room', {
            method: 'POST',
            headers: { 'Content-Type' : 'application/json'},
            body: JSON.stringify({ password: myPassword})
        });
        if(!response.ok) throw new Error("Server rejected request");
        const data = await response.json();
        connectToRoom(data.roomCode);
    }
    catch(error){
        showToast('⚠️ SERVER ERROR: Is the Java backend even running?');
    }
});

joinBtn.addEventListener('click', () => {
    myUsername = joinUsernameInput.value.trim();
    const myPassword = joinPasswordInput.value.trim();

    if(!myUsername){
        showToast('⚠️ PLEASE ENTER A USERNAME');
        return;
    }

    const code = roomInput.value.trim().toUpperCase();
    if(code.length === 6){
        connectToRoom(code, myPassword);
    }
    else{
        showToast('⚠️ Room code must be 6 characters')
    }
});

function connectToRoom(roomCode, password = "") {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    let wsUrl = protocol + window.location.host + '/ws/' + roomCode + '/' + encodeURIComponent(myUsername);

    if(password){
        wsUrl += '?password=' + encodeURIComponent(password);
    }

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        isConnected = true;

        currentRoomCode = roomCode;
        pingInterval = setInterval(() =>{
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "PING", content: "", senderId: "CLIENT"}));
            }
        }, 30000);
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        switch(msg.type){
            case "ROOM_JOINED":
                setupScreen.style.display='none';
                editorScreen.style.display = 'block';
                editorScreen.classList.add('stagger-1');
                formatToolbar.style.display='flex';
                roomDisplay.innerText='ROOM: ' + currentRoomCode;
                copyCodeBtn.style.display='inline-block';

                showToast('Connected to server');

                editor.innerHTML = msg.content;
                editor.setAttribute('contenteditable', 'true');

                isHostUser = (msg.senderId === "true");
                roleDisplay.innerText = isHostUser ? "👑 HOST" : "👤 GUEST";

                if(isHostUser){
                    modeSelector.disabled = false;
                    modeSelector.style.display = 'inline-block';
                }
                else{
                    modeSelector.style.display = 'none';
                }

                if(msg.currentMode){
                    workspaceContainer.className = '';
                    if(msg.currentMode === 'WRITING') workspaceContainer.classList.add('mode-writing');
                    else if(msg.currentMode === 'DRAWING') workspaceContainer.classList.add('mode-drawing');
                    else if(msg.currentMode === 'BOTH') workspaceContainer.classList.add('mode-both');
                    modeSelector.value = msg.currentMode;
                }

                if(!isHostUser){
                    ws.send(JSON.stringify({type: "REQUEST_CANVAS", senderId: "CLIENT"}));
                }
                break;

            case "CHAT_MESSAGE":
                appendChatMessage(msg.senderName, msg.content, msg.replyToSender, msg.replyToContent, msg.senderName === myUsername);
                break;    

            case "MODE_UPDATE":
                workspaceContainer.className = '';
                const newMode = msg.content;
                if (newMode === 'WRITING') workspaceContainer.classList.add('mode-writing');
                else if (newMode === 'DRAWING') workspaceContainer.classList.add('mode-drawing');
                else if(newMode === 'BOTH')workspaceContainer.classList.add('mode-both');
                modeSelector.value = newMode;
                break;

            case "DRAWING_UPDATE":
                const data = JSON.parse(msg.content);
                drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.isEraserMode, data.size || (data.isEraserMode ? 20 : 4), false);
                break;

            case "REQUEST_CANVAS":
                if(isHostUser){
                    const dataUrl = drawingCanvas.toDataURL();
                    ws.send(JSON.stringify({
                        type: "CANVAS_SYNC",
                        content: dataUrl,
                        fileName: msg.senderId,
                        senderId: "HOST"
                    }));
                }
                break;

            case "CANVAS_SYNC":
                const img = new Image();
                img.onload = () => {
                    dCtx.drawImage(img, 0, 0);
                };
                img.src = msg.content;
                break;

            case "CURSOR_MOVE":
                if(msg.senderName !== myUsername){
                    const coords = JSON.parse(msg.content);
                    updateRemoteCursor(msg.senderName, coords.x, coords.y);
                }
                break;

            case "TYPING":
                typingIndicator.innerText = msg.senderName + "is typing...";
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    typingIndicator.innerText = "";
                }, 2000);
                break;

            case "USER_LIST_UPDATE":
                const users = JSON.parse(msg.content);
                usersDisplay.innerText = "USERS: " + users.length + " ▼";

                if(users.length > 1){
                    isLastUser = false;
                }

                usersListDisplay.innerHTML = "";

                const activeUsernames = [];

                users.forEach(u =>{
                    const userDiv = document.createElement("div");
                    userDiv.className = "dropdown-user";
                    userDiv.innerText = u.username + (u.isHost ? " (HOST)" : " (GUEST)");
                    usersListDisplay.appendChild(userDiv);
                });

                document.querySelectorAll('.remove-cursor').forEach(el => {
                    const name = el.id.replace('cursor-', '');
                    if(!activeUsernames.includes(name)){
                        el.remove();
                    }
                });
                break;

            case "NOTIFICATION":
                showToast('📢 ' + msg.content);
                break;

            case "TEXT_UPDATE":
                if(document.activeElement === editor){
                    const currentPos = getCaretPosition(editor);
                    editor.innerHTML = msg.content;
                    setCaretPosition(editor, currentPos);
                }
                else{
                    editor.innerHTML = msg.content;
                }
                break;

            case "FORCE_OVERWRITE":
                applyOverwriteAndUnpack(msg.content);
                break;

            case "PROMOTED_TO_HOST":
                isHostUser = true;
                modeSelector.disabled = false;
                modeSelector.style.display = 'inline-block';
                roleDisplay.innerText = "👑 HOST";

                showToast('👑 ' + msg.content);
                break;

            case "LAST_USER_WARNING":
                isLastUser = true;
                showToast('⚠️ You are the last user. Click "Leave" to save a backup.');
                break;

            case "IMPORT_REQUEST":
                pendingImportText = msg.content;
                pendingGuestId = msg.senderId;
                pendingFileName = msg.fileName;
                importModalText.innerText = `Guest ${msg.senderName} wants to import '${msg.fileName}'.`;
                importModal.style.display = 'flex';
                setTimeout(() => importModal.style.opacity = '1', 10);
                break;

            case "IMPORT_DENIED":
                showToast('❌ ' + msg.content);
                break;
        }
    };

    ws.onclose=(event) => {
        isConnected= false;
        editor.setAttribute('contenteditable', 'false');
        formatToolbar.style.display = 'none';
        modeSelector.style.display = 'none';
        modeSelector.disabled = true;

        clearInterval(pingInterval);
        if(event.code === 1008 && event.reason === "INVALID_PASSWORD"){
            showToast('🔒 Incorrect Password! Access Denied.');
        }
        else if(event.code ===1008){
            showToast('⚠️ Room does not exist or expired.');
            setTimeout(() => location.reload(), 2000);
        }
        else{
            showToast('🔌 Disconnected from the server.')
        }
    };
}

editor.addEventListener('input', (e) => {
    if(ws && ws.readyState === WebSocket.OPEN){
        const message = {
            type: "TEXT_UPDATE",
            content: editor.innerHTML,
            senderId: "CLIENT"
        };
        ws.send(JSON.stringify(message));

        ws.send(JSON.stringify({ type: "TYPING", senderName: myUsername, senderId: "CLIENT"}));
    }
});

let lastCursorSendTime = 0;
const cursorThrottleMS = 50;

window.addEventListener('mousemove', (e) => {
    if(!isConnected || !ws || ws.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    if(now - lastCursorSendTime > cursorThrottleMS){
        const xPercent = (e.clientX / window.innerWidth) * 100;
        const yPercent = (e.clientY / window.innerHeight) * 100;

        ws.send(JSON.stringify({
            type: "CURSOR_MOVE",
            content: JSON.stringify({ x: xPercent, y: yPercent }),
            senderName: myUsername,
            senderId: "CLIENT"
        }));

        lastCursorSendTime = now;
    }
});

function updateRemoteCursor(username, xPercent, yPercent){
    const cursorId = 'cursor-' + username;
    let cursorEl = document.getElementById(cursorId);
    
    if (!cursorEl){
        cursorEl = document.createElement('div');
        cursorEl.id = cursorId;
        cursorEl.className = 'remote-cursor';

        cursorEl.innerHTML = `
            <svg xmlns="http://www.w3/org/2000/svg" viewBox="0 0 24 24">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
            </svg>
            <div class="cursor-name">${username}</div>
            `;
            document.body.appendChild(cursorEl);
    }

    const pixelX = (xPercent / 100) * window.innerWidth;
    const pixelY = (yPercent / 100) * window.innerHeight;

    cursorEl.style.transform = `translate(${pixelX}px, ${pixelY}px)`;
}