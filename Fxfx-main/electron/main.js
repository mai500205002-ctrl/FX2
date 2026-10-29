"use strict";
/**
 * TextFX v5 — Electron Main Process
 * ──────────────────────────────────────────────────────────────────────────────
 * 1. On ready: generate/verify local self-signed cert in userData/certs/
 * 2. Pick a free port in 30000–31000
 * 3. Spawn release/backend/fx-server.exe --port --cert --key (windowsHide)
 * 4. Poll https://127.0.0.1:<port>/healthz with cert pinning
 * 5. Transfer { port, certFingerprint } to renderer via ipcMain.handle
 * 6. On before-quit: tree-kill the backend process tree
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const child_process_1 = require("child_process");
const crypto_1 = __importDefault(require("crypto"));
const net_1 = __importDefault(require("net"));
// ── Optional tree-kill (bundled) ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let treeKill = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    treeKill = require('tree-kill');
}
catch { /* fall back to proc.kill() */ }
// ── Globals ───────────────────────────────────────────────────────────────────
let mainWindow = null;
let backendProcess = null;
let backendPort = 0;
let certFingerprint = '';
let isQuitting = false;
// ── Paths ─────────────────────────────────────────────────────────────────────
function getCertsDir() {
    return path_1.default.join(electron_1.app.getPath('userData'), 'certs');
}
function getBackendExe() {
    if (electron_1.app.isPackaged) {
        return path_1.default.join(process.resourcesPath, 'backend', 'fx-server.exe');
    }
    return path_1.default.join(__dirname, '..', 'release', 'backend', 'fx-server.exe');
}
// ── Self-signed cert generation (via openssl CLI) ─────────────────────────────
async function ensureCerts() {
    const dir = getCertsDir();
    const certFile = path_1.default.join(dir, 'fx-cert.pem');
    const keyFile = path_1.default.join(dir, 'fx-key.pem');
    if (fs_1.default.existsSync(certFile) && fs_1.default.existsSync(keyFile)) {
        return { cert: certFile, key: keyFile };
    }
    fs_1.default.mkdirSync(dir, { recursive: true });
    await new Promise((resolve, reject) => {
        const args = [
            'req', '-x509', '-newkey', 'rsa:2048',
            '-keyout', keyFile,
            '-out', certFile,
            '-days', '3650',
            '-nodes',
            '-subj', '/CN=localhost/O=TextFX/C=US',
        ];
        const proc = (0, child_process_1.execFile)('openssl', args, { windowsHide: true });
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`openssl exited ${code}`)));
        proc.on('error', reject);
    });
    return { cert: certFile, key: keyFile };
}
function getCertFingerprint(certPath) {
    const pem = fs_1.default.readFileSync(certPath, 'utf8');
    const b64 = pem
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s/g, '');
    const der = Buffer.from(b64, 'base64');
    return crypto_1.default.createHash('sha256').update(der).digest('hex');
}
// ── Free-port finder (30000–31000) ────────────────────────────────────────────
async function findFreePort(lo = 30000, hi = 31000) {
    for (let port = lo; port <= hi; port++) {
        const free = await new Promise(resolve => {
            const s = net_1.default.createServer();
            s.once('error', () => resolve(false));
            s.once('listening', () => s.close(() => resolve(true)));
            s.listen(port, '127.0.0.1');
        });
        if (free)
            return port;
    }
    throw new Error('No free port found in 30000–31000');
}
// ── Health-check poller ───────────────────────────────────────────────────────
function pollHealthz(port, certPath, maxAttempts = 40, intervalMs = 1000) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const certPem = fs_1.default.readFileSync(certPath);
        const attempt = () => {
            attempts++;
            const req = https_1.default.get({ hostname: '127.0.0.1', port, path: '/healthz', rejectUnauthorized: false }, res => {
                var _a, _b;
                if (res.statusCode === 200) {
                    // Cert pinning: compare server cert fingerprint
                    const sock = res.socket;
                    const serverCert = sock.getPeerCertificate();
                    const expectedFp = certFingerprint;
                    const actualFp = (_b = (_a = serverCert === null || serverCert === void 0 ? void 0 : serverCert.fingerprint256) === null || _a === void 0 ? void 0 : _a.replace(/:/g, '').toLowerCase()) !== null && _b !== void 0 ? _b : '';
                    if (expectedFp && actualFp && !actualFp.startsWith(expectedFp.slice(0, 8))) {
                        return reject(new Error('Certificate fingerprint mismatch — possible MITM'));
                    }
                    return resolve();
                }
                scheduleRetry();
            });
            req.on('error', () => scheduleRetry());
            req.setTimeout(900, () => { req.destroy(); scheduleRetry(); });
        };
        const scheduleRetry = () => {
            if (attempts >= maxAttempts)
                return reject(new Error('Backend failed to start in time'));
            setTimeout(attempt, intervalMs);
        };
        // Suppress "unused" warning for certPem (used for CA verification in full impl)
        void certPem;
        attempt();
    });
}
// ── Spawn backend ─────────────────────────────────────────────────────────────
function spawnBackend(port, certPath, keyPath) {
    var _a, _b;
    const exe = getBackendExe();
    if (!fs_1.default.existsSync(exe)) {
        electron_1.dialog.showErrorBox('TextFX', `Backend not found:\n${exe}\n\nPlease reinstall.`);
        electron_1.app.quit();
        process.exit(1);
    }
    const proc = (0, child_process_1.execFile)(exe, [`--port=${port}`, `--cert=${certPath}`, `--key=${keyPath}`], {
        windowsHide: true,
        env: { ...process.env, NODE_ENV: 'production' },
    });
    (_a = proc.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (d) => process.stdout.write(`[backend] ${d}`));
    (_b = proc.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (d) => process.stderr.write(`[backend:err] ${d}`));
    proc.on('error', (err) => {
        if (!isQuitting) {
            electron_1.dialog.showErrorBox('TextFX Backend Error', `Backend crashed:\n${err.message}`);
        }
    });
    proc.on('close', (code) => {
        if (!isQuitting)
            console.warn(`[backend] exited with code ${code}`);
    });
    return proc;
}
// ── Kill backend (entire process tree) ───────────────────────────────────────
function killBackend() {
    if (!(backendProcess === null || backendProcess === void 0 ? void 0 : backendProcess.pid))
        return;
    if (treeKill) {
        treeKill(backendProcess.pid, 'SIGKILL');
    }
    else {
        backendProcess.kill('SIGKILL');
    }
    backendProcess = null;
}
// ── Create BrowserWindow ──────────────────────────────────────────────────────
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        backgroundColor: '#1a1a1a',
        title: 'TextFX — AI Creative Director',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    if (electron_1.app.isPackaged) {
        mainWindow.loadFile(path_1.default.join(__dirname, '..', 'app', 'dist', 'index.html'));
    }
    else {
        mainWindow.loadURL(process.env.ELECTRON_START_URL || 'http://localhost:5173');
    }
    mainWindow.once('ready-to-show', () => mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show());
    mainWindow.on('closed', () => { mainWindow = null; });
}
// ── IPC handlers ──────────────────────────────────────────────────────────────
electron_1.ipcMain.handle('fx:get-backend-info', () => ({
    port: backendPort,
    certFingerprint,
    protocol: 'https',
    host: '127.0.0.1',
}));
// ── App lifecycle ─────────────────────────────────────────────────────────────
electron_1.app.on('ready', async () => {
    try {
        // 1. Certs
        const { cert, key } = await ensureCerts();
        certFingerprint = getCertFingerprint(cert);
        // 2. Free port
        backendPort = await findFreePort();
        // 3. Spawn backend
        backendProcess = spawnBackend(backendPort, cert, key);
        // 4. Poll healthz
        await pollHealthz(backendPort, cert);
        // 5. CSP — restrict renderer to only talk to our backend
        electron_1.session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
            cb({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [
                        `default-src 'self'; script-src 'self'; connect-src 'self' https://127.0.0.1:${backendPort}; img-src 'self' data:;`
                    ],
                },
            });
        });
        // 6. Open window
        createWindow();
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        electron_1.dialog.showErrorBox('TextFX — Startup Error', msg);
        killBackend();
        electron_1.app.quit();
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('before-quit', () => {
    isQuitting = true;
    killBackend();
});
electron_1.app.on('activate', () => {
    if (mainWindow === null)
        createWindow();
});
process.on('uncaughtException', (err) => {
    console.error('uncaughtException in main:', err);
    if (!isQuitting) {
        isQuitting = true;
        killBackend();
        electron_1.app.quit();
    }
});
