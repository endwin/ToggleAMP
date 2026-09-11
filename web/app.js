// nobreak Dashboard Frontend Client

const API_BASE = window.location.origin;

// Elements
const servicesContainer = document.getElementById('servicesContainer');
const serviceSummary = document.getElementById('serviceSummary');
const sitesTableBody = document.getElementById('sitesTableBody');
const packageList = document.getElementById('packageList');
const terminal = document.getElementById('terminal');
const selectLanguage = document.getElementById('selectLanguage');

// Switcher Controls
const btnSwitchNginx = document.getElementById('btnSwitchNginx');
const btnSwitchApache = document.getElementById('btnSwitchApache');
const selectPhpVersion = document.getElementById('selectPhpVersion');
const selectDbEngine = document.getElementById('selectDbEngine');

// Actions
const btnStartAll = document.getElementById('btnStartAll');
const btnStopAll = document.getElementById('btnStopAll');
const btnSyncVHosts = document.getElementById('btnSyncVHosts');
const btnOpenWww = document.getElementById('btnOpenWww');
const btnClearLogs = document.getElementById('btnClearLogs');
const btnOpenConfigModal = document.getElementById('btnOpenConfigModal');

// Site Modal Elements
const newSiteModal = document.getElementById('newSiteModal');
const btnNewSiteModal = document.getElementById('btnNewSiteModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelSite = document.getElementById('btnCancelSite');
const btnConfirmSite = document.getElementById('btnConfirmSite');
const siteNameInput = document.getElementById('siteNameInput');
const siteTemplateSelect = document.getElementById('siteTemplateSelect');

// Config Editor Modal Elements
const configModal = document.getElementById('configModal');
const btnCloseConfigModal = document.getElementById('btnCloseConfigModal');
const btnCancelConfigModal = document.getElementById('btnCancelConfigModal');
const btnSaveConfig = document.getElementById('btnSaveConfig');
const configFilePath = document.getElementById('configFilePath');
const configVersionBar = document.getElementById('configVersionBar');
const configContentTextarea = document.getElementById('configContentTextarea');
const configSaveStatus = document.getElementById('configSaveStatus');
const presetButtons = document.getElementById('presetButtons');
const configTabButtons = document.querySelectorAll('.config-tab-btn');

// State
const translations = {};
let currentConfig = null;
let lastServices = [];
let installedPhpVersions = [];
let installedDbVersions = [];
let activeConfigTab = 'php';
let activeConfigSubVersion = null; // e.g. '8.3' or 'mysql-8.0' or 'apache'
let isSwitching = false;

// Language Packs & i18n
let currentLang = localStorage.getItem('endserver_lang') || localStorage.getItem('nobreak_lang') || 'ko';
let langData = {};

// Helper: Translation lookup
function t(key, params = {}) {
    const parts = key.split('.');
    let cur = langData;
    for (const p of parts) {
        if (cur && cur[p] !== undefined) {
            cur = cur[p];
        } else {
            return key;
        }
    }
    if (typeof cur === 'string') {
        let result = cur;
        for (const [k, v] of Object.entries(params)) {
            result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
        return result;
    }
    return cur;
}

// Helper: Apply translations to all DOM elements with data-i18n
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated && translated !== key) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translated;
            } else {
                el.innerHTML = translated;
            }
        }
    });
}

// Helper: Toast Notifications
function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.className = `pointer-events-auto px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl border flex items-center space-x-2 transition-all duration-300 transform translate-y-4 opacity-0 ${
        isError
            ? 'bg-rose-950/90 text-rose-200 border-rose-600/60 shadow-rose-900/30'
            : 'bg-teal-950/90 text-teal-200 border-teal-600/60 shadow-teal-900/30'
    }`;

    toast.innerHTML = `
        <i class="fa-solid ${isError ? 'fa-triangle-exclamation text-rose-400' : 'fa-circle-check text-teal-400'} text-sm"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}
const broadcastToast = showToast;

// Helper: Load language file
async function loadLanguage(lang) {
    try {
        const res = await fetch(`language/${lang}.lang`);
        if (res.ok) {
            langData = await res.json();
            document.documentElement.lang = lang;
            applyTranslations();
        }
    } catch (e) {
        console.error('Failed to load language file:', lang, e);
    }
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
    if (selectLanguage) selectLanguage.value = currentLang;
    await loadLanguage(currentLang);

    fetchStatus();
    fetchSites();
    fetchPackages();
    connectLogStream();
    setInterval(fetchStatus, 3000);
    setInterval(fetchSites, 10000);
    setInterval(fetchPackages, 8000);

    setupEventListeners();
});

function setupEventListeners() {
    // Language Switcher
    if (selectLanguage) {
        selectLanguage.addEventListener('change', async (e) => {
            currentLang = e.target.value;
            localStorage.setItem('endserver_lang', currentLang);
            localStorage.setItem('nobreak_lang', currentLang);
            await loadLanguage(currentLang);
            if (lastServices.length) renderServices(lastServices);
            if (lastPackages) renderPackages(lastPackages);
            if (lastSites) renderSites(lastSites);
        });
    }

    // Helper: Check if any stack service is running
    const isStackRunning = () => (lastServices || []).some(s => s.state === 'running');

    // Web Server Switching (Optimistic update)
    btnSwitchNginx.addEventListener('click', async () => {
        if (isStackRunning()) {
            alert(t('alerts.locked_while_running'));
            return;
        }
        if (currentConfig?.webserver?.active === 'nginx') return;
        isSwitching = true;
        applyOptimisticWebServer('nginx');
        const res = await fetch(`${API_BASE}/api/webserver/switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ webserver: 'nginx' })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || t('alerts.webserver_switch_failed'));
        }
        isSwitching = false;
        setTimeout(fetchStatus, 300);
        setTimeout(fetchPackages, 400);
    });

    btnSwitchApache.addEventListener('click', async () => {
        if (isStackRunning()) {
            alert(t('alerts.locked_while_running'));
            return;
        }
        if (currentConfig?.webserver?.active === 'apache') return;
        isSwitching = true;
        applyOptimisticWebServer('apache');
        const res = await fetch(`${API_BASE}/api/webserver/switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ webserver: 'apache' })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || t('alerts.webserver_switch_failed'));
        }
        isSwitching = false;
        setTimeout(fetchStatus, 300);
        setTimeout(fetchPackages, 400);
    });

    // PHP Version Switching (Optimistic update + Legacy Auto-Pairing)
    selectPhpVersion.addEventListener('change', async (e) => {
        if (isStackRunning()) {
            alert(t('alerts.locked_while_running'));
            updateSwitchers(currentConfig);
            return;
        }
        const version = e.target.value;
        if (!version) return;
        isSwitching = true;
        applyOptimisticPhp(version);

        // Auto-pair Legacy Stack: PHP 5.2.9 <-> MySQL 5.1.33
        if (version === '5.2' && selectDbEngine.value !== 'mysql-5.1') {
            applyOptimisticDb('mysql', '5.1');
        }

        const res = await fetch(`${API_BASE}/api/php/switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || t('alerts.php_switch_failed'));
        }
        isSwitching = false;
        setTimeout(fetchStatus, 300);
        setTimeout(fetchPackages, 400);
    });

    // Database Engine Switching (Optimistic update + Legacy Auto-Pairing)
    selectDbEngine.addEventListener('change', async (e) => {
        if (isStackRunning()) {
            alert(t('alerts.locked_while_running'));
            updateSwitchers(currentConfig);
            return;
        }
        const val = e.target.value;
        if (!val) return;
        const parts = val.split('-');
        const engine = parts[0];
        const version = parts[1];
        isSwitching = true;
        applyOptimisticDb(engine, version);

        // Auto-pair Legacy Stack: MySQL 5.1.33 <-> PHP 5.2.9
        if (engine === 'mysql' && version === '5.1' && selectPhpVersion.value !== '5.2') {
            applyOptimisticPhp('5.2');
        }

        const res = await fetch(`${API_BASE}/api/database/switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ engine, version })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || t('alerts.db_switch_failed'));
        }
        isSwitching = false;
        setTimeout(fetchStatus, 300);
        setTimeout(fetchPackages, 400);
    });

    btnStartAll.addEventListener('click', async () => {
        btnStartAll.disabled = true;
        const origHtml = btnStartAll.innerHTML;
        btnStartAll.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-[10px]"></i> <span>Starting...</span>`;
        try {
            await fetch(`${API_BASE}/api/start-all`, { method: 'POST' });
        } catch (e) {
            console.error(e);
        }
        setTimeout(fetchStatus, 300);
        setTimeout(fetchStatus, 1000);
        setTimeout(() => {
            btnStartAll.disabled = false;
            btnStartAll.innerHTML = origHtml;
        }, 1200);
    });

    btnStopAll.addEventListener('click', async () => {
        btnStopAll.disabled = true;
        const origHtml = btnStopAll.innerHTML;
        btnStopAll.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-[10px]"></i> <span>Stopping...</span>`;
        try {
            await fetch(`${API_BASE}/api/stop-all`, { method: 'POST' });
        } catch (e) {
            console.error(e);
        }
        setTimeout(fetchStatus, 300);
        setTimeout(fetchStatus, 800);
        setTimeout(() => {
            btnStopAll.disabled = false;
            btnStopAll.innerHTML = origHtml;
        }, 1000);
    });

    btnSyncVHosts.addEventListener('click', async () => {
        await fetch(`${API_BASE}/api/vhosts/sync`, { method: 'POST' });
        fetchSites();
    });

    btnOpenWww.addEventListener('click', async () => {
        await fetch(`${API_BASE}/api/sites/open-folder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'www' })
        });
    });

    btnClearLogs.addEventListener('click', () => {
        terminal.innerHTML = '';
    });

    // Site Modal
    btnNewSiteModal.addEventListener('click', () => {
        siteNameInput.value = '';
        newSiteModal.classList.remove('hidden');
        siteNameInput.focus();
    });

    const closeSiteModal = () => newSiteModal.classList.add('hidden');
    btnCloseModal.addEventListener('click', closeSiteModal);
    btnCancelSite.addEventListener('click', closeSiteModal);

    btnConfirmSite.addEventListener('click', async () => {
        const name = siteNameInput.value.trim().toLowerCase();
        const template = siteTemplateSelect.value;
        if (!name) return;

        btnConfirmSite.disabled = true;
        await fetch(`${API_BASE}/api/sites/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, template })
        });
        btnConfirmSite.disabled = false;
        closeSiteModal();
        fetchSites();
    });

    // Config Modal Listeners
    btnOpenConfigModal.addEventListener('click', () => openConfigEditor('php'));
    const closeConfigModal = () => configModal.classList.add('hidden');
    btnCloseConfigModal.addEventListener('click', closeConfigModal);
    btnCancelConfigModal.addEventListener('click', closeConfigModal);

    configTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            openConfigEditor(tab);
        });
    });

    btnSaveConfig.addEventListener('click', saveActiveConfig);

    const btnElevateHosts = document.getElementById('btnElevateHosts');
    if (btnElevateHosts) {
        btnElevateHosts.addEventListener('click', async () => {
            btnElevateHosts.disabled = true;
            btnElevateHosts.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-[10px]"></i> <span>${t('vhosts.hosts_syncing')}</span>`;
            await fetch(`${API_BASE}/api/vhosts/sync`, { method: 'POST' });
            setTimeout(() => {
                btnElevateHosts.disabled = false;
                btnElevateHosts.innerHTML = `<i class="fa-solid fa-check text-[10px]"></i> <span>${t('vhosts.hosts_synced')}</span>`;
                setTimeout(() => {
                    btnElevateHosts.innerHTML = `<i class="fa-solid fa-shield-halved text-[10px]"></i> <span>${t('vhosts.btn_elevate_hosts')}</span>`;
                }, 3000);
            }, 1000);
        });
    }

    const btnOpenLogFolder = document.getElementById('btnOpenLogFolder');
    if (btnOpenLogFolder) {
        btnOpenLogFolder.addEventListener('click', () => {
            fetch(`${API_BASE}/api/logs/open-folder`, { method: 'POST' });
        });
    }

    const logFilePath = document.getElementById('logFilePath');
    if (logFilePath) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        logFilePath.textContent = `logs/activity/activity-${y}-${m}-${d}.log`;
    }

    const appVersionBadge = document.getElementById('appVersionBadge');
    if (appVersionBadge) {
        appVersionBadge.addEventListener('click', openVersionModal);
    }

    const btnCloseVersionModal = document.getElementById('btnCloseVersionModal');
    if (btnCloseVersionModal) {
        btnCloseVersionModal.addEventListener('click', closeVersionModal);
    }

    const btnDismissVersionModal = document.getElementById('btnDismissVersionModal');
    if (btnDismissVersionModal) {
        btnDismissVersionModal.addEventListener('click', closeVersionModal);
    }

    const btnCloseDeleteVHostModal = document.getElementById('btnCloseDeleteVHostModal');
    if (btnCloseDeleteVHostModal) {
        btnCloseDeleteVHostModal.addEventListener('click', closeDeleteVHostModal);
    }

    const btnCancelDeleteVHost = document.getElementById('btnCancelDeleteVHost');
    if (btnCancelDeleteVHost) {
        btnCancelDeleteVHost.addEventListener('click', closeDeleteVHostModal);
    }

    const btnConfirmDeleteVHost = document.getElementById('btnConfirmDeleteVHost');
    if (btnConfirmDeleteVHost) {
        btnConfirmDeleteVHost.addEventListener('click', executeDeleteVHost);
    }
}

// Version Modal Handlers
let latestVersionInfo = null;

async function openVersionModal() {
    const modal = document.getElementById('versionModal');
    if (!modal) return;

    const badge = document.getElementById('versionModalBadge');
    const statusBox = document.getElementById('versionModalStatusBox');
    const statusText = document.getElementById('versionModalStatusText');
    const codeTag = document.getElementById('versionModalCodeTag');
    const content = document.getElementById('versionChangelogContent');

    // Fetch localized version changelog according to active language (en, ko/kr, ja/jp)
    try {
        const lang = currentLang || 'en';
        const res = await fetch(`${API_BASE}/api/version?lang=${lang}`);
        if (res.ok) {
            latestVersionInfo = await res.json();
        }
    } catch {}

    if (latestVersionInfo) {
        if (badge) badge.textContent = 'v' + latestVersionInfo.version;
        if (codeTag) codeTag.textContent = `Code: v${latestVersionInfo.codeVersion}`;
        if (content) content.textContent = latestVersionInfo.changelog || 'No changelog available.';

        if (latestVersionInfo.isMismatch) {
            statusBox.className = 'p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-xs flex items-center justify-between font-mono text-rose-200';
            statusText.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-400 mr-2"></i> ${latestVersionInfo.mismatchMessage}`;
            codeTag.className = 'text-[11px] text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-600';
        } else {
            statusBox.className = 'p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between font-mono text-slate-300';
            statusText.innerHTML = `<i class="fa-solid fa-shield-halved text-teal-400 mr-2"></i> Version Integrity: Verified (Match)`;
            codeTag.className = 'text-[11px] text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800';
        }
    }

    modal.classList.remove('hidden');
}

function closeVersionModal() {
    const modal = document.getElementById('versionModal');
    if (modal) modal.classList.add('hidden');
}

// Optimistic UI updates
function applyOptimisticWebServer(target) {
    if (!currentConfig) currentConfig = { webserver: {} };
    currentConfig.webserver.active = target;
    updateSwitchers(currentConfig);

    const srv = lastServices.find(s => s.name === 'webserver');
    if (srv) {
        srv.engine = target;
        renderServices(lastServices);
    }
}

function applyOptimisticPhp(version) {
    if (!currentConfig) currentConfig = { php: {} };
    currentConfig.php.active_version = version;
    updateSwitchers(currentConfig);

    const srv = lastServices.find(s => s.name === 'php');
    if (srv) {
        srv.version = version;
        renderServices(lastServices);
    }
}

function applyOptimisticDb(engine, version) {
    if (!currentConfig) currentConfig = { database: {} };
    currentConfig.database.engine = engine;
    currentConfig.database.active_version = version;
    updateSwitchers(currentConfig);

    const srv = lastServices.find(s => s.name === 'database');
    if (srv) {
        srv.engine = engine;
        srv.version = version;
        renderServices(lastServices);
    }
}

// Fetch Services Status & Sync Controls
async function fetchStatus() {
    try {
        const lang = currentLang || 'en';
        const res = await fetch(`${API_BASE}/api/status?lang=${lang}`);
        if (!res.ok) return;
        const data = await res.json();
        currentConfig = data.config;
        lastServices = data.services || [];
        installedPhpVersions = data.installedPhp || [];
        installedDbVersions = data.installedDb || [];

        latestVersionInfo = data.versionInfo;
        const vInfo = data.versionInfo;
        const badge = document.getElementById('appVersionBadge');
        const mismatchBanner = document.getElementById('versionMismatchBanner');
        const mismatchText = document.getElementById('versionMismatchText');

        if (badge && vInfo) {
            badge.textContent = 'v' + vInfo.version;
            if (vInfo.isMismatch) {
                badge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500 font-semibold font-mono ring-2 ring-rose-500/50 cursor-pointer animate-pulse';
                badge.title = vInfo.mismatchMessage || 'Version Mismatch Warning!';
                if (mismatchBanner && mismatchText) {
                    mismatchText.textContent = `실제 시스템 버전: v${vInfo.codeVersion} ⇄ VERSION.txt: v${vInfo.fileVersion}`;
                    mismatchBanner.classList.remove('hidden');
                }
            } else {
                badge.className = 'text-xs px-2 py-0.5 rounded-full bg-teal-950 text-teal-400 border border-teal-800/60 font-semibold font-mono';
                badge.title = `nobreak v${vInfo.version}`;
                if (mismatchBanner) mismatchBanner.classList.add('hidden');
            }
        } else if (badge && data.config?.version) {
            badge.textContent = 'v' + data.config.version.replace(/^v/, '');
        }

        if (!isSwitching) {
            updateSwitchers(data.config);
            renderServices(lastServices);
        }
    } catch (e) {
        console.error('Error fetching status:', e);
    }
}

function updateSwitchers(cfg) {
    if (!cfg) return;

    // Web Server buttons
    if (cfg.webserver?.active === 'nginx') {
        btnSwitchNginx.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition bg-teal-500 text-slate-950 shadow-sm';
        btnSwitchApache.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-400 hover:text-white';
    } else {
        btnSwitchApache.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition bg-teal-500 text-slate-950 shadow-sm';
        btnSwitchNginx.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition bg-slate-800 text-slate-400 hover:text-white';
    }

    // Dynamic PHP Selector: ONLY show installed versions
    const currentPhpVal = selectPhpVersion.value || cfg.php?.active_version;
    const phpVersions = installedPhpVersions.length ? installedPhpVersions : [cfg.php?.active_version || '8.3'];
    
    // Check if options need rebuild
    const existingPhpOptions = Array.from(selectPhpVersion.options).map(o => o.value);
    const needRebuildPhp = phpVersions.length !== existingPhpOptions.length || phpVersions.some(v => !existingPhpOptions.includes(v));

    if (needRebuildPhp) {
        selectPhpVersion.innerHTML = '';
        phpVersions.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v === '5.2' ? 'PHP 5.2.9 (Legacy)' : `PHP ${v}`;
            selectPhpVersion.appendChild(opt);
        });
    }
    if (cfg.php?.active_version) {
        selectPhpVersion.value = cfg.php.active_version;
    }

    // Dynamic DB Selector: ONLY show installed engines/versions
    const dbList = installedDbVersions.length
        ? installedDbVersions
        : [{ engine: cfg.database?.engine || 'mariadb', version: cfg.database?.active_version || '11.4', key: `${cfg.database?.engine || 'mariadb'}-${cfg.database?.active_version || '11.4'}` }];
    
    const existingDbOptions = Array.from(selectDbEngine.options).map(o => o.value);
    const needRebuildDb = dbList.length !== existingDbOptions.length || dbList.some(d => !existingDbOptions.includes(d.key));

    if (needRebuildDb) {
        selectDbEngine.innerHTML = '';
        dbList.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.key;
            let engineName = d.engine === 'mariadb' ? 'MariaDB' : 'MySQL';

            let label = `${engineName} ${d.version}`;
            if (d.key === 'mysql-5.1') label = 'MySQL 5.1.33 (Legacy)';
            if (d.key === 'mariadb-11.4') label = 'MariaDB 11.4 LTS';
            if (d.key === 'mysql-8.4') label = 'MySQL 8.4 LTS';
            opt.textContent = label;
            selectDbEngine.appendChild(opt);
        });
    }

    if (cfg.database) {
        const activeKey = `${cfg.database.engine}-${cfg.database.active_version}`;
        selectDbEngine.value = activeKey;
    }

    // Dynamic phpMyAdmin highlighting based on PHP version
    const linkPmaLatest = document.getElementById('linkPhpMyAdminLatest');
    const linkPma3 = document.getElementById('linkPhpMyAdmin3');
    const wsPort = cfg.webserver?.port || 80;
    const portStr = wsPort === 80 ? '' : `:${wsPort}`;

    if (linkPmaLatest && linkPma3) {
        linkPmaLatest.href = `http://localhost${portStr}/myadmin/`;
        linkPma3.href = `http://localhost${portStr}/phpmyadmin/`;

        if (cfg.php?.active_version === '5.2') {
            linkPma3.className = 'flex items-center justify-between p-3 rounded-xl bg-amber-950/20 hover:bg-amber-950/30 border border-amber-500/40 transition group ring-1 ring-amber-500/30';
            linkPmaLatest.className = 'flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 transition group opacity-60';
        } else {
            linkPmaLatest.className = 'flex items-center justify-between p-3 rounded-xl bg-teal-950/20 hover:bg-teal-950/30 border border-teal-500/40 transition group ring-1 ring-teal-500/30';
            linkPma3.className = 'flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 transition group opacity-60';
        }
    }
}

function renderServices(services) {
    let runningCount = 0;
    servicesContainer.innerHTML = '';

    const iconMap = {
        webserver: 'fa-globe text-teal-400',
        php: 'fa-code text-indigo-400',
        database: 'fa-database text-sky-400',
        redis: 'fa-bolt text-rose-400',
        mailpit: 'fa-envelope text-amber-400',
    };

    services.forEach(srv => {
        const isRunning = srv.state === 'running';
        if (isRunning) runningCount++;

        let displayName = srv.name.toUpperCase();
        let subtitle = `Port: ${srv.port}`;
        let configTab = null;
        let configSub = null;

        if (srv.name === 'webserver') {
            const activeEngine = srv.engine || currentConfig?.webserver?.active || 'nginx';
            displayName = activeEngine.toUpperCase();
            configTab = 'webserver';
            configSub = activeEngine;
        } else if (srv.name === 'php') {
            const activeVer = srv.version || currentConfig?.php?.active_version || '';
            displayName = `PHP ${activeVer}`;
            configTab = 'php';
            configSub = activeVer;
        } else if (srv.name === 'database') {
            const activeEngine = (srv.engine || currentConfig?.database?.engine || 'DB').toUpperCase();
            const activeVer = srv.version || currentConfig?.database?.active_version || '';
            displayName = `${activeEngine} ${activeVer}`;
            configTab = 'mysql';
            configSub = `${(srv.engine || currentConfig?.database?.engine || 'mysql')}-${activeVer}`;
        }

        const configBtnHtml = configTab
            ? `<button onclick="openConfigEditor('${configTab}', '${configSub}')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-950/60 hover:text-indigo-300 text-slate-400 border border-slate-700 text-xs transition" title="설정 편집 / Edit Config"><i class="fa-solid fa-sliders text-xs"></i></button>`
            : '';

        const card = document.createElement('div');
        card.className = `bg-dark-card border ${isRunning ? 'border-teal-500/40 bg-teal-950/10' : 'border-dark-border'} rounded-2xl p-4 flex flex-col justify-between transition hover:border-slate-600 shadow-sm`;

        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2.5">
                        <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm">
                            <i class="fa-solid ${iconMap[srv.name] || 'fa-gear text-slate-400'}"></i>
                        </div>
                        <div>
                            <div class="font-bold text-xs text-white tracking-wider">${displayName}</div>
                            <div class="text-[10px] text-slate-400 font-mono">${subtitle}</div>
                        </div>
                    </div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isRunning ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-400'
                    }">
                        <span class="w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-teal-400 animate-pulse mr-1.5' : 'bg-slate-500 mr-1.5'}"></span>
                        ${srv.state}
                    </span>
                </div>
                ${srv.uptime ? `<div class="text-[10px] text-slate-400 font-mono mb-2">${t('services.uptime', { time: srv.uptime })}</div>` : ''}
            </div>

            <div class="flex items-center space-x-1.5 mt-2 pt-3 border-t border-dark-border/50">
                ${
                    isRunning
                    ? `<button onclick="stopService('${srv.name}')" class="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-300 border border-slate-700 text-xs font-semibold transition">${t('services.btn_stop')}</button>
                       <button onclick="restartService('${srv.name}')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition" title="${t('services.btn_restart')}"><i class="fa-solid fa-arrow-rotate-right"></i></button>
                       ${configBtnHtml}`
                    : `<button onclick="startService('${srv.name}')" class="flex-1 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition">${t('services.btn_start')}</button>
                       ${configBtnHtml}`
                }
            </div>
        `;
        servicesContainer.appendChild(card);
    });

    serviceSummary.textContent = t('services.active_count', { count: runningCount, total: services.length });

    // Disable Top Switchers when services are running
    const anyRunning = runningCount > 0;
    const lockTitle = anyRunning ? t('alerts.locked_while_running') : '';

    btnSwitchNginx.disabled = anyRunning;
    btnSwitchApache.disabled = anyRunning;
    selectPhpVersion.disabled = anyRunning;
    selectDbEngine.disabled = anyRunning;

    btnSwitchNginx.title = lockTitle;
    btnSwitchApache.title = lockTitle;
    selectPhpVersion.title = lockTitle;
    selectDbEngine.title = lockTitle;

    if (anyRunning) {
        selectPhpVersion.classList.add('opacity-50', 'cursor-not-allowed');
        selectDbEngine.classList.add('opacity-50', 'cursor-not-allowed');
        btnSwitchNginx.classList.add('opacity-50', 'cursor-not-allowed');
        btnSwitchApache.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        selectPhpVersion.classList.remove('opacity-50', 'cursor-not-allowed');
        selectDbEngine.classList.remove('opacity-50', 'cursor-not-allowed');
        btnSwitchNginx.classList.remove('opacity-50', 'cursor-not-allowed');
        btnSwitchApache.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // Dynamic Visual Distinction for Start All & Stop All
    if (runningCount > 0) {
        // Running: Start All is disabled, Stop All is active & highlighted
        btnStartAll.disabled = true;
        btnStartAll.className = 'px-3.5 py-1.5 rounded-lg bg-slate-800/40 text-slate-500 border border-slate-700/40 font-bold text-xs flex items-center space-x-1.5 transition opacity-40 cursor-not-allowed';

        btnStopAll.disabled = false;
        btnStopAll.className = 'px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-lg shadow-rose-600/40 active:scale-95 cursor-pointer ring-2 ring-rose-500/50';
    } else {
        // Stopped: Start All is active & highlighted, Stop All is disabled
        btnStartAll.disabled = false;
        btnStartAll.className = 'px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-md shadow-teal-500/20 active:scale-95 cursor-pointer ring-2 ring-teal-400/50';

        btnStopAll.disabled = true;
        btnStopAll.className = 'px-3.5 py-1.5 rounded-lg bg-slate-800/40 text-slate-500 border border-slate-700/40 font-bold text-xs flex items-center space-x-1.5 transition opacity-40 cursor-not-allowed';
    }
}

async function startService(name) {
    await fetch(`${API_BASE}/api/service/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    fetchStatus();
}

async function stopService(name) {
    await fetch(`${API_BASE}/api/service/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    fetchStatus();
}

async function restartService(name) {
    await fetch(`${API_BASE}/api/service/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    fetchStatus();
}

let lastSites = [];
let lastPackages = {};

// Fetch Sites
async function fetchSites() {
    try {
        const res = await fetch(`${API_BASE}/api/sites`);
        if (!res.ok) return;
        const sites = await res.json();
        lastSites = sites || [];
        renderSites(lastSites);
    } catch (e) {
        console.error('Error fetching sites:', e);
    }
}

function renderSites(sites) {
    sitesTableBody.innerHTML = '';
    if (sites.length === 0) {
        sitesTableBody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-slate-500 text-xs">${t('vhosts.empty')}</td></tr>`;
        return;
    }

    sites.forEach(site => {
        const isDefault = site.name.toLowerCase() === 'default';
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-800/40 transition border-b border-dark-border/40';
        row.innerHTML = `
            <td class="px-4 py-3 font-semibold text-white">
                <div class="flex items-center space-x-1.5">
                    <span>${site.name}</span>
                    ${isDefault ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">System</span>` : ''}
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center space-x-2">
                    <a href="${site.url}" target="_blank" class="text-teal-400 hover:text-teal-300 font-mono text-xs hover:underline flex items-center space-x-1" title="${t('vhosts.btn_open_browser')}">
                        <span>${site.domain}</span>
                        <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    </a>
                    <a href="${site.local_url || `http://localhost/${site.name}`}" target="_blank" class="text-slate-400 hover:text-slate-200 font-mono text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 hover:border-slate-500 transition" title="Direct Localhost URL">
                        <span>localhost/${site.name}</span>
                    </a>
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">${site.type}</span>
            </td>
            <td class="px-4 py-3 text-slate-400 font-mono text-xs">${site.rel_doc_root}</td>
            <td class="px-4 py-3 text-right space-x-1.5">
                <button onclick="openSiteFolder('${site.rel_doc_root}')" class="p-1 text-slate-400 hover:text-white transition" title="${t('vhosts.btn_open_folder')}"><i class="fa-solid fa-folder-open"></i></button>
                <a href="${site.url}" target="_blank" class="p-1 text-slate-400 hover:text-teal-400 transition" title="${t('vhosts.btn_open_browser')}"><i class="fa-solid fa-globe"></i></a>
                ${!isDefault ? `
                <button onclick="confirmDeleteVHost('${site.name}', '${site.domain}', '${site.rel_doc_root}')" class="p-1 text-slate-500 hover:text-rose-400 transition" title="${t('vhosts.btn_delete')}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>` : ''}
            </td>
        `;
        sitesTableBody.appendChild(row);
    });
}

function openSiteFolder(path) {
    fetch(`${API_BASE}/api/sites/open-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
    });
}

let pendingDeleteVHostName = null;

function confirmDeleteVHost(name, domain, path) {
    pendingDeleteVHostName = name;
    const modal = document.getElementById('deleteVHostModal');
    if (!modal) return;

    const nameEl = document.getElementById('deleteVHostName');
    const domainEl = document.getElementById('deleteVHostDomain');
    const pathEl = document.getElementById('deleteVHostPath');

    if (nameEl) nameEl.textContent = name;
    if (domainEl) domainEl.textContent = domain;
    if (pathEl) pathEl.textContent = path;

    modal.classList.remove('hidden');
}

function closeDeleteVHostModal() {
    pendingDeleteVHostName = null;
    const modal = document.getElementById('deleteVHostModal');
    if (modal) modal.classList.add('hidden');
}

async function executeDeleteVHost() {
    if (!pendingDeleteVHostName) return;
    const name = pendingDeleteVHostName;
    const btn = document.getElementById('btnConfirmDeleteVHost');
    const btnText = document.getElementById('deleteVHostBtnText');

    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = t('modal.deleting') || 'Deleting...';

    try {
        const res = await fetch(`${API_BASE}/api/sites/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        let data = {};
        const text = await res.text();
        try {
            data = JSON.parse(text);
        } catch {
            data = { error: text || `HTTP ${res.status} ${res.statusText}` };
        }

        if (res.ok && data.success) {
            closeDeleteVHostModal();
            await fetchSites();
            broadcastToast(t('alerts.vhost_deleted') || `Virtual host and files for '${name}' deleted.`);
        } else {
            alert((t('alerts.delete_req_error') || 'Error: ') + (data.error || 'Server error occurred'));
        }
    } catch (e) {
        alert((t('alerts.delete_req_error') || 'Error: ') + e.message);
    } finally {
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = t('modal.delete_vhost_confirm_btn') || 'Confirm Permanent Delete';
    }
}

// Fetch Available Packages & Status
async function fetchPackages() {
    try {
        const res = await fetch(`${API_BASE}/api/packages`);
        if (!res.ok) return;
        const pkgs = await res.json();
        lastPackages = pkgs || {};
        renderPackages(lastPackages);
    } catch (e) {
        console.error('Error fetching packages:', e);
    }
}

function renderPackages(pkgs) {
    packageList.innerHTML = '';

    const categoryBadges = {
        webserver: 'bg-teal-950/60 text-teal-400 border-teal-800/50',
        php: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/50',
        database: 'bg-sky-950/60 text-sky-400 border-sky-800/50',
        utility: 'bg-amber-950/60 text-amber-400 border-amber-800/50'
    };

    const isStackRunning = (lastServices || []).some(s => s.state === 'running');

    for (const [key, pkg] of Object.entries(pkgs)) {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between text-xs py-1.5 px-1 border-b border-slate-800/50 hover:bg-slate-800/30 rounded transition text-slate-300';
        
        const catBadge = `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono border ${categoryBadges[pkg.category] || 'bg-slate-800 text-slate-400'}">${pkg.category}</span>`;
        const isCoreProtected = (key === 'php-5.2' || key === 'mysql-5.1');

        let actionHtml = '';
        if (pkg.installed) {
            if (pkg.isActive) {
                actionHtml = `
                    <div class="flex items-center space-x-1.5">
                        <span class="px-2 py-0.5 rounded bg-teal-500 text-slate-950 text-[10px] font-bold shadow-sm flex items-center space-x-1" title="${t('packages.active_tooltip')}">
                            <i class="fa-solid fa-check text-[9px]"></i>
                            <span>${t('packages.badge_active')}</span>
                        </span>
                    </div>
                `;
            } else {
                actionHtml = `
                    <div class="flex items-center space-x-1">
                        <button onclick="activatePackage('${key}')" ${isStackRunning ? `disabled title="${t('alerts.locked_while_running')}"` : `title="${t('packages.apply_tooltip')}"`} class="px-2 py-0.5 rounded ${isStackRunning ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-teal-600/20 hover:bg-teal-500 hover:text-slate-950 text-teal-300 border border-teal-500/40 cursor-pointer'} text-[10px] font-bold transition">${t('packages.btn_apply')}</button>
                        ${isCoreProtected ? `
                            <span class="px-2 py-0.5 rounded bg-slate-800/90 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center space-x-1" title="ToggleAMP 필수 레거시 기본 패키지 (삭제 불가)">
                                <i class="fa-solid fa-lock text-[9px]"></i>
                                <span>${t('packages.core_protected') || '기본 내장'}</span>
                            </span>
                        ` : `
                            <button onclick="uninstallPackage('${key}', '${pkg.name}')" ${isStackRunning ? `disabled title="${t('alerts.locked_while_running')}"` : `title="${t('packages.delete_tooltip')}"`} class="px-2 py-0.5 rounded ${isStackRunning ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/40 cursor-pointer'} text-[10px] font-bold transition flex items-center space-x-1"><i class="fa-solid fa-trash-can text-[9px]"></i> <span>${t('packages.btn_delete')}</span></button>
                        `}
                    </div>
                `;
            }
        } else {
            actionHtml = `
                <div class="flex items-center space-x-1">
                    <button onclick="installPackage('${key}', false)" class="px-2.5 py-0.5 rounded bg-teal-600/20 hover:bg-teal-500 hover:text-slate-950 text-teal-300 border border-teal-500/40 text-[10px] font-bold transition flex items-center space-x-1" title="${t('packages.install_tooltip')}">
                        <i class="fa-solid fa-download text-[9px]"></i>
                        <span>${t('packages.btn_install')}</span>
                    </button>
                </div>
            `;
        }

        item.innerHTML = `
            <div class="flex items-center space-x-2">
                ${catBadge}
                <div>
                    <span class="font-semibold text-slate-200">${pkg.name}</span>
                    <span class="text-[10px] text-slate-500 font-mono ml-1">v${pkg.version}</span>
                </div>
            </div>
            <div>
                ${actionHtml}
            </div>
        `;
        packageList.appendChild(item);
    }
}

async function activatePackage(key) {
    if ((lastServices || []).some(s => s.state === 'running')) {
        alert(t('alerts.locked_while_running'));
        return;
    }
    const res = await fetch(`${API_BASE}/api/packages`);
    if (!res.ok) return;
    const pkgs = await res.json();
    const pkg = pkgs[key];
    if (!pkg) return;

    if (pkg.category === 'webserver') {
        const target = key.includes('apache') ? 'apache' : 'nginx';
        applyOptimisticWebServer(target);
        await fetch(`${API_BASE}/api/webserver/switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ webserver: target })
        });
    } else if (pkg.category === 'php') {
        const ver = key.replace('php-', '');
        applyOptimisticPhp(ver);
        if (ver === '5.2') applyOptimisticDb('mysql', '5.1');
        await fetch(`${API_BASE}/api/php/switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version: ver })
        });
    } else if (pkg.category === 'database') {
        const parts = key.split('-');
        applyOptimisticDb(parts[0], parts[1]);
        if (parts[0] === 'mysql' && parts[1] === '5.1') applyOptimisticPhp('5.2');
        await fetch(`${API_BASE}/api/database/switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ engine: parts[0], version: parts[1] })
        });
    }

    setTimeout(fetchStatus, 300);
    setTimeout(fetchPackages, 400);
}

async function installPackage(key, autoActivate) {
    const btn = event?.currentTarget;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin text-[9px]"></i> <span>${t('packages.btn_installing')}</span>`;
    }
    try {
        await fetch(`${API_BASE}/api/packages/install`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, autoActivate })
        });
    } catch (e) {
        console.error(e);
    }
    setTimeout(fetchStatus, 1500);
    setTimeout(fetchPackages, 1500);
}

async function uninstallPackage(key, name) {
    if (key === 'php-5.2' || key === 'mysql-5.1') {
        alert(t('alerts.core_pkg_cannot_delete') || 'PHP 5.2.9 및 MySQL 5.1.33은 ToggleAMP 필수 레거시 기본 패키지이므로 삭제할 수 없습니다.');
        return;
    }
    if ((lastServices || []).some(s => s.state === 'running')) {
        alert(t('alerts.locked_while_running'));
        return;
    }
    if (!confirm(t('alerts.confirm_delete_pkg', { name: name || key }))) return;

    try {
        const res = await fetch(`${API_BASE}/api/packages/uninstall`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || t('alerts.delete_pkg_failed'));
        } else {
            fetchStatus();
            fetchPackages();
        }
    } catch (e) {
        alert(t('alerts.delete_req_error') + e.message);
    }
}

// Configuration Editor Modal Logic (Version-Specific)
async function openConfigEditor(tab = 'php', subParam = null) {
    if (tab === 'webserver') {
        tab = subParam || currentConfig?.webserver?.active || 'nginx';
    }
    activeConfigTab = tab;
    configModal.classList.remove('hidden');
    configSaveStatus.classList.add('hidden');

    // Update active tab button style
    configTabButtons.forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.className = 'config-tab-btn flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition bg-teal-500 text-slate-950 shadow-sm flex items-center justify-center space-x-1.5';
        } else {
            btn.className = 'config-tab-btn flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center space-x-1.5';
        }
    });

    await renderVersionSubBar(tab, subParam);
}

async function renderVersionSubBar(tab, subParam) {
    configVersionBar.innerHTML = '';
    let filesData = null;

    try {
        const res = await fetch(`${API_BASE}/api/config/files`);
        if (res.ok) filesData = await res.json();
    } catch {}

    if (tab === 'php') {
        const versions = filesData?.php?.versions || installedPhpVersions || ['8.3'];
        const activeVer = filesData?.php?.active || currentConfig?.php?.active_version || versions[0];
        activeConfigSubVersion = subParam || activeVer;

        configVersionBar.innerHTML = `<span class="text-[11px] text-slate-400 font-semibold mr-1 flex items-center"><i class="fa-solid fa-code mr-1 text-indigo-400"></i>PHP 버전 선택:</span>`;
        versions.forEach(v => {
            const isSelected = v === activeConfigSubVersion;
            const isActive = v === activeVer;
            const btn = document.createElement('button');
            btn.className = `px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition flex items-center space-x-1 ${
                isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`;
            btn.innerHTML = `<span>PHP ${v}</span>${isActive ? '<span class="text-[9px] px-1 py-0.2 bg-teal-400/30 text-teal-200 rounded ml-1">Active</span>' : ''}`;
            btn.addEventListener('click', () => {
                activeConfigSubVersion = v;
                renderVersionSubBar('php', v);
            });
            configVersionBar.appendChild(btn);
        });

        renderPresetsForVersion('php', activeConfigSubVersion);
        await loadConfigContent('php', { version: activeConfigSubVersion });

    } else if (tab === 'mysql' || tab === 'database') {
        const engines = filesData?.database?.engines || [{ key: 'mariadb-11.4', engine: 'mariadb', version: '11.4', title: 'MariaDB 11.4' }];
        const activeKey = filesData?.database?.active || `${currentConfig?.database?.engine}-${currentConfig?.database?.active_version}`;
        activeConfigSubVersion = subParam || activeKey;

        configVersionBar.innerHTML = `<span class="text-[11px] text-slate-400 font-semibold mr-1 flex items-center"><i class="fa-solid fa-database mr-1 text-sky-400"></i>DB 선택:</span>`;
        engines.forEach(d => {
            const isSelected = d.key === activeConfigSubVersion;
            const isActive = d.key === activeKey;
            const btn = document.createElement('button');
            btn.className = `px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition flex items-center space-x-1 ${
                isSelected ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`;
            btn.innerHTML = `<span>${d.title}</span>${isActive ? '<span class="text-[9px] px-1 py-0.2 bg-teal-400/30 text-teal-200 rounded ml-1">Active</span>' : ''}`;
            btn.addEventListener('click', () => {
                activeConfigSubVersion = d.key;
                renderVersionSubBar('mysql', d.key);
            });
            configVersionBar.appendChild(btn);
        });

        const parts = (activeConfigSubVersion || 'mariadb-11.4').split('-');
        renderPresetsForVersion('mysql', parts[1], parts[0]);
        await loadConfigContent('mysql', { engine: parts[0], version: parts[1] });

    } else if (tab === 'webserver' || tab === 'nginx' || tab === 'apache') {
        const targetServer = (tab === 'nginx' || tab === 'apache') ? tab : (subParam || currentConfig?.webserver?.active || 'nginx');
        activeConfigTab = targetServer;
        activeConfigSubVersion = targetServer;

        configTabButtons.forEach(btn => {
            if (btn.dataset.tab === targetServer) {
                btn.className = 'config-tab-btn flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition bg-teal-500 text-slate-950 shadow-sm flex items-center justify-center space-x-1.5';
            } else {
                btn.className = 'config-tab-btn flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center space-x-1.5';
            }
        });

        const servers = filesData?.webserver?.servers || [
            { server: 'nginx', title: 'Nginx', fileName: 'nginx.conf' },
            { server: 'apache', title: 'Apache', fileName: 'httpd.conf' }
        ];
        const activeServer = filesData?.webserver?.active || currentConfig?.webserver?.active || 'nginx';

        configVersionBar.innerHTML = `<span class="text-[11px] text-slate-400 font-semibold mr-1 flex items-center"><i class="fa-solid fa-globe mr-1 text-teal-400"></i>웹서버 설정:</span>`;
        servers.forEach(s => {
            const isSelected = s.server === targetServer;
            const isActive = s.server === activeServer;
            const btn = document.createElement('button');
            btn.className = `px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition flex items-center space-x-1 ${
                isSelected ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`;
            btn.innerHTML = `<span>${s.title} (${s.fileName})</span>${isActive ? '<span class="text-[9px] px-1 py-0.2 bg-teal-400/30 text-teal-200 rounded ml-1">Active</span>' : ''}`;
            btn.addEventListener('click', () => {
                openConfigEditor(s.server);
            });
            configVersionBar.appendChild(btn);
        });

        renderPresetsForVersion(targetServer);
        await loadConfigContent(targetServer);

    } else {
        // ToggleAMP
        configVersionBar.innerHTML = `<span class="text-[11px] text-slate-400 font-mono"><i class="fa-solid fa-bolt mr-1 text-amber-400"></i>ToggleAMP Global Settings (config/ToggleAMP.json)</span>`;
        renderPresetsForVersion('ToggleAMP');
        await loadConfigContent('ToggleAMP');
    }
}

function renderPresetsForVersion(category, version = null, engine = null) {
    presetButtons.innerHTML = '';

    const presets = {
        php_legacy: [
            { label: 'Zend Optimizer On', apply: (txt) => {
                if (txt.includes('zend_extension_ts') || txt.includes('[Zend]')) return txt;
                return txt + `\n[Zend]\nzend_optimizer.optimization_level = 15\nzend_optimizer.enable_loader = 1\n`;
            }},
            { label: 'Memory 256M', apply: (txt) => txt.replace(/memory_limit\s*=\s*[\w\d]+/g, 'memory_limit = 256M') },
            { label: 'Upload 32M', apply: (txt) => txt.replace(/upload_max_filesize\s*=\s*[\w\d]+/g, 'upload_max_filesize = 32M').replace(/post_max_size\s*=\s*[\w\d]+/g, 'post_max_size = 32M') },
            { label: 'Upload 64M', apply: (txt) => txt.replace(/upload_max_filesize\s*=\s*[\w\d]+/g, 'upload_max_filesize = 64M').replace(/post_max_size\s*=\s*[\w\d]+/g, 'post_max_size = 64M') },
            { label: 'Upload 128M', apply: (txt) => txt.replace(/upload_max_filesize\s*=\s*[\w\d]+/g, 'upload_max_filesize = 128M').replace(/post_max_size\s*=\s*[\w\d]+/g, 'post_max_size = 128M') },
            { label: 'Short Open Tag On', apply: (txt) => txt.replace(/short_open_tag\s*=\s*\w+/g, 'short_open_tag = On') },
            { label: 'Errors On', apply: (txt) => txt.replace(/display_errors\s*=\s*\w+/g, 'display_errors = On') },
            { label: 'Timezone Seoul', apply: (txt) => txt.replace(/date\.timezone\s*=\s*[\w\/]+/g, 'date.timezone = Asia/Seoul') }
        ],
        php_modern: [
            { label: 'Memory 512M', apply: (txt) => txt.replace(/memory_limit\s*=\s*[\w\d]+/g, 'memory_limit = 512M') },
            { label: 'Memory 1G', apply: (txt) => txt.replace(/memory_limit\s*=\s*[\w\d]+/g, 'memory_limit = 1G') },
            { label: 'Upload 128M', apply: (txt) => txt.replace(/upload_max_filesize\s*=\s*[\w\d]+/g, 'upload_max_filesize = 128M').replace(/post_max_size\s*=\s*[\w\d]+/g, 'post_max_size = 128M') },
            { label: 'Upload 256M', apply: (txt) => txt.replace(/upload_max_filesize\s*=\s*[\w\d]+/g, 'upload_max_filesize = 256M').replace(/post_max_size\s*=\s*[\w\d]+/g, 'post_max_size = 256M') },
            { label: 'Upload 512M', apply: (txt) => txt.replace(/upload_max_filesize\s*=\s*[\w\d]+/g, 'upload_max_filesize = 512M').replace(/post_max_size\s*=\s*[\w\d]+/g, 'post_max_size = 512M') },
            { label: 'Upload 1G', apply: (txt) => txt.replace(/upload_max_filesize\s*=\s*[\w\d]+/g, 'upload_max_filesize = 1024M').replace(/post_max_size\s*=\s*[\w\d]+/g, 'post_max_size = 1024M').replace(/memory_limit\s*=\s*[\w\d]+/g, (m) => m.includes('1G') || m.includes('2G') ? m : 'memory_limit = 1G') },
            { label: 'Errors On', apply: (txt) => txt.replace(/display_errors\s*=\s*\w+/g, 'display_errors = On') },
            { label: 'Errors Off', apply: (txt) => txt.replace(/display_errors\s*=\s*\w+/g, 'display_errors = Off') },
            { label: 'Timezone Seoul', apply: (txt) => txt.replace(/date\.timezone\s*=\s*[\w\/]+/g, 'date.timezone = Asia/Seoul') }
        ],
        mysql: [
            { label: 'UTF8mb4', apply: (txt) => txt.replace(/character-set-server\s*=\s*[\w\d]+/g, 'character-set-server=utf8mb4').replace(/collation-server\s*=\s*[\w\d_]+/g, 'collation-server=utf8mb4_unicode_ci') },
            { label: 'EUC-KR', apply: (txt) => txt.replace(/character-set-server\s*=\s*[\w\d]+/g, 'character-set-server=euckr').replace(/collation-server\s*=\s*[\w\d_]+/g, 'collation-server=euckr_korean_ci') },
            { label: 'Max Packet 128M', apply: (txt) => txt.replace(/max_allowed_packet\s*=\s*[\w\d]+/g, 'max_allowed_packet=128M') }
        ],
        nginx: [
            { label: 'Gzip On', apply: (txt) => txt.includes('gzip on;') ? txt : txt.replace('http {', 'http {\n    gzip on;\n    gzip_types text/plain text/css application/json application/javascript;') },
            { label: 'KeepAlive 120s', apply: (txt) => txt.replace(/keepalive_timeout\s+\d+;/g, 'keepalive_timeout  120;') },
            { label: 'Client Max 128M', apply: (txt) => txt.includes('client_max_body_size') ? txt.replace(/client_max_body_size\s+[^;]+;/g, 'client_max_body_size 128M;') : txt.replace('http {', 'http {\n    client_max_body_size 128M;') },
            { label: 'Client Max 500M', apply: (txt) => txt.includes('client_max_body_size') ? txt.replace(/client_max_body_size\s+[^;]+;/g, 'client_max_body_size 500M;') : txt.replace('http {', 'http {\n    client_max_body_size 500M;') }
        ],
        apache: [
            { label: 'KeepAlive On', apply: (txt) => txt.includes('KeepAlive On') ? txt : txt + '\nKeepAlive On\nMaxKeepAliveRequests 100\n' },
            { label: 'LimitRequest 128M', apply: (txt) => txt.includes('LimitRequestBody') ? txt.replace(/LimitRequestBody\s+\d+/g, 'LimitRequestBody 134217728') : txt + '\nLimitRequestBody 134217728\n' },
            { label: 'LimitRequest 500M', apply: (txt) => txt.includes('LimitRequestBody') ? txt.replace(/LimitRequestBody\s+\d+/g, 'LimitRequestBody 524288000') : txt + '\nLimitRequestBody 524288000\n' }
        ],
        ToggleAMP: [],
        nobreak: []
    };

    let tabPresets = [];
    if (category === 'php') {
        tabPresets = version === '5.2' ? presets.php_legacy : presets.php_modern;
    } else if (category === 'mysql' || category === 'database') {
        tabPresets = presets.mysql;
    } else if (category === 'nginx') {
        tabPresets = presets.nginx;
    } else if (category === 'apache') {
        tabPresets = presets.apache;
    }

    if (tabPresets.length === 0) {
        presetButtons.innerHTML = `<span class="text-[11px] text-slate-500">기본 설정 파일이 로드되었습니다.</span>`;
        return;
    }

    tabPresets.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-semibold transition';
        btn.textContent = p.label;
        btn.addEventListener('click', () => {
            configContentTextarea.value = p.apply(configContentTextarea.value);
            configSaveStatus.classList.remove('hidden');
            configSaveStatus.innerHTML = `<span class="text-amber-400 text-[11px]">템플릿 적용됨 (저장 버튼을 누르면 반영됩니다)</span>`;
        });
        presetButtons.appendChild(btn);
    });
}

async function loadConfigContent(type, params = {}) {
    configContentTextarea.value = 'Loading configuration...';
    try {
        const query = new URLSearchParams({ type, ...params });
        const res = await fetch(`${API_BASE}/api/config/read?${query.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        configFilePath.textContent = data.relPath || data.path;
        configContentTextarea.value = data.content;
    } catch (e) {
        configContentTextarea.value = `Error loading configuration: ${e.message}`;
    }
}

async function saveActiveConfig() {
    btnSaveConfig.disabled = true;
    const content = configContentTextarea.value;

    let payload = { type: activeConfigTab, content };
    if (activeConfigTab === 'php') {
        payload.version = activeConfigSubVersion;
    } else if (activeConfigTab === 'mysql' || activeConfigTab === 'database') {
        const parts = (activeConfigSubVersion || 'mariadb-11.4').split('-');
        payload.engine = parts[0];
        payload.version = parts[1];
    } else if (activeConfigTab === 'webserver') {
        payload.server = activeConfigSubVersion;
    } else if (activeConfigTab === 'nginx') {
        payload.server = 'nginx';
    } else if (activeConfigTab === 'apache') {
        payload.server = 'apache';
    }

    try {
        const res = await fetch(`${API_BASE}/api/config/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            configSaveStatus.classList.remove('hidden');
            if (data.warning) {
                configSaveStatus.innerHTML = `<div class="flex items-start space-x-1.5 text-amber-300"><i class="fa-solid fa-triangle-exclamation mt-0.5 text-amber-400"></i> <span class="whitespace-pre-wrap font-mono text-[11px]">${data.message}</span></div>`;
            } else {
                configSaveStatus.innerHTML = `<div class="flex items-center space-x-1.5 text-emerald-300"><i class="fa-solid fa-circle-check text-emerald-400"></i> <span class="font-semibold text-[11px]">${data.message || '저장 및 자동 적용 완료!'}</span></div>`;
                setTimeout(() => configSaveStatus.classList.add('hidden'), 4000);
            }
            fetchStatus();
        } else {
            alert(`저장 실패: ${data.error}`);
        }
    } catch (e) {
        alert(`저장 중 오류: ${e.message}`);
    } finally {
        btnSaveConfig.disabled = false;
    }
}

// Real-time EventSource Log Stream & Filtering
let currentLogFilter = 'all';
const allLogItems = [];

function connectLogStream() {
    // 1. Initial REST fetch for instant display of historical logs
    fetch(`${API_BASE}/api/logs`)
        .then(r => r.json())
        .then(data => {
            if (data && data.success && Array.isArray(data.logs)) {
                allLogItems.length = 0;
                terminal.innerHTML = '';
                data.logs.forEach(msg => {
                    allLogItems.push(msg);
                });
                renderFilteredLogs();
            }
        })
        .catch(() => {});

    // 2. Real-time SSE Stream
    const sse = new EventSource(`${API_BASE}/api/logs/stream`);

    sse.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            allLogItems.push(msg);
            if (allLogItems.length > 2000) allLogItems.shift();
            
            const logCountBadge = document.getElementById('logCountBadge');
            if (logCountBadge) logCountBadge.textContent = `${allLogItems.length} logs`;

            if (isLogVisible(msg, currentLogFilter)) {
                renderSingleLog(msg);
                terminal.scrollTop = terminal.scrollHeight;
            }
        } catch (e) {
            console.error(e);
        }
    };

    sse.onerror = () => {
        sse.close();
        setTimeout(connectLogStream, 3000);
    };

    // 3. Setup Filter Buttons
    document.querySelectorAll('.log-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.log-filter-btn').forEach(b => {
                b.classList.remove('bg-teal-500/20', 'text-teal-300', 'border', 'border-teal-500/30');
                if (b.dataset.filter === 'error') {
                    b.classList.add('text-rose-400');
                } else {
                    b.classList.add('text-slate-400');
                }
            });
            btn.classList.add('bg-teal-500/20', 'text-teal-300', 'border', 'border-teal-500/30');
            btn.classList.remove('text-slate-400');
            currentLogFilter = btn.dataset.filter;
            renderFilteredLogs();
        });
    });
}

function isLogVisible(msg, filter) {
    if (filter === 'all') return true;
    if (filter === 'error') {
        return (msg.service && msg.service.includes('error')) ||
               (msg.message && (msg.message.toLowerCase().includes('error') || msg.message.toLowerCase().includes('failed') || msg.message.toLowerCase().includes('fatal')));
    }
    return msg.service === filter || (msg.service && msg.service.startsWith(filter));
}

function renderFilteredLogs() {
    terminal.innerHTML = '';
    const visibleLogs = allLogItems.filter(item => isLogVisible(item, currentLogFilter));
    if (visibleLogs.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'text-slate-500 italic py-2';
        empty.textContent = `[${currentLogFilter.toUpperCase()}] 표시할 로그가 없습니다.`;
        terminal.appendChild(empty);
    } else {
        visibleLogs.slice(-500).forEach(msg => {
            renderSingleLog(msg);
        });
    }
    terminal.scrollTop = terminal.scrollHeight;
    const logCountBadge = document.getElementById('logCountBadge');
    if (logCountBadge) logCountBadge.textContent = `${allLogItems.length} logs`;
}

function renderSingleLog(msg) {
    const line = document.createElement('div');
    line.className = 'terminal-line flex items-baseline space-x-2 py-0.5 hover:bg-slate-900/50 rounded px-1 transition';

    let srvColor = 'text-teal-400';
    if (msg.service === 'system') srvColor = 'text-sky-400';
    else if (msg.service === 'webserver') srvColor = 'text-indigo-400';
    else if (msg.service === 'php') srvColor = 'text-purple-400';
    else if (msg.service === 'database') srvColor = 'text-amber-400';
    else if (msg.service && msg.service.includes('error')) srvColor = 'text-rose-400';
    else if (msg.service === 'downloader') srvColor = 'text-emerald-400';

    let msgColor = 'text-slate-200';
    const lower = (msg.message || '').toLowerCase();
    if (lower.includes('error') || lower.includes('failed') || lower.includes('fatal')) {
        msgColor = 'text-rose-300 font-medium';
    } else if (lower.includes('running') || lower.includes('started') || lower.includes('success')) {
        msgColor = 'text-emerald-300';
    }

    line.innerHTML = `
        <span class="text-slate-500 font-mono text-[11px] shrink-0">[${escapeHtml(msg.timestamp || '')}]</span>
        <span class="${srvColor} font-bold font-mono text-xs shrink-0">[${escapeHtml(msg.service || '')}]</span>
        <span class="${msgColor} break-all flex-1">${escapeHtml(msg.message || '')}</span>
    `;
    terminal.appendChild(line);
}

function appendLog(timestamp, service, message) {
    allLogItems.push({ timestamp, service, message });
    if (isLogVisible({ timestamp, service, message }, currentLogFilter)) {
        renderSingleLog({ timestamp, service, message });
        terminal.scrollTop = terminal.scrollHeight;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}
