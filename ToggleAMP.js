#!/usr/bin/env node

/**
 * ToggleAMP — Modern Portable Local Development Environment
 * Features:
 * - Multi-Webserver: Nginx ⇄ Apache (HTTPD) toggle with zero configuration
 * - Multi-PHP: PHP 8.4, 8.3, 8.2, 8.1, 7.4 with instant FastCGI auto-switching
 * - Multi-DB: MariaDB (11.4, 10.11) & MySQL (8.4, 8.0) with auto-initialization
 * - Auto Virtual Hosts (*.test) with HTTPS SSL & Windows hosts file sync
 * - Modern Web Dashboard & Real-Time Log Streamer
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { spawn, spawnSync, exec, execSync } = require('child_process');

const ROOT_DIR = __dirname;
const CONFIG_DIR = path.join(ROOT_DIR, 'config');
const BIN_DIR = path.join(ROOT_DIR, 'bin');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const WWW_DIR = path.join(ROOT_DIR, 'www');
const WEB_DIR = path.join(ROOT_DIR, 'web');

// Ensure base folders
[
    CONFIG_DIR, BIN_DIR, DATA_DIR, LOGS_DIR, WWW_DIR,
    path.join(LOGS_DIR, 'nginx'), path.join(LOGS_DIR, 'apache'),
    path.join(LOGS_DIR, 'php'), path.join(LOGS_DIR, 'mysql'),
    path.join(DATA_DIR, 'ssl'), path.join(DATA_DIR, 'mysql'), path.join(DATA_DIR, 'db'),
    path.join(BIN_DIR, 'php'), path.join(BIN_DIR, 'db'),
    path.join(BIN_DIR, 'nginx', 'temp')
].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Version Management & Integrity Verification
const CODE_VERSION = '1.3.0';

function getVersionInfo(lang = 'en') {
    const masterVersionFile = path.join(ROOT_DIR, 'VERSION.txt');
    const versionHistoryDir = path.join(ROOT_DIR, 'version');

    // 1. Master Version is always checked from root VERSION.txt
    let fileVersion = null;
    if (fs.existsSync(masterVersionFile)) {
        try {
            const raw = fs.readFileSync(masterVersionFile, 'utf8');
            const lines = raw.split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    fileVersion = trimmed.replace(/^v/, '');
                    break;
                }
            }
        } catch {}
    }

    // 2. Load localized changelog / history archive from version/ folder
    const langMap = {
        'ko': 'version_kr.txt',
        'kr': 'version_kr.txt',
        'ja': 'version_jp.txt',
        'jp': 'version_jp.txt',
        'en': 'version_en.txt'
    };
    const targetHistoryFile = langMap[String(lang).toLowerCase()] || 'version_en.txt';
    const historyFilePath = path.join(versionHistoryDir, targetHistoryFile);

    let changelog = '';
    if (fs.existsSync(historyFilePath)) {
        try {
            changelog = fs.readFileSync(historyFilePath, 'utf8');
        } catch {}
    } else if (fs.existsSync(masterVersionFile)) {
        try {
            changelog = fs.readFileSync(masterVersionFile, 'utf8');
        } catch {}
    }

    const activeVersion = fileVersion || CODE_VERSION;
    const isMismatch = Boolean(fileVersion && fileVersion !== CODE_VERSION);

    return {
        version: activeVersion,
        codeVersion: CODE_VERSION,
        fileVersion: fileVersion,
        isMismatch: isMismatch,
        mismatchMessage: isMismatch
            ? `⚠️ 버전 불일치 감지: 시스템 코드 버전(v${CODE_VERSION})과 VERSION.txt(v${fileVersion})가 다릅니다.`
            : null,
        changelog: changelog,
        lang: lang,
        masterFile: 'VERSION.txt',
        historyDir: 'version'
    };
}

function getVersion(lang = 'en') {
    return getVersionInfo(lang).version;
}

// Default Configuration
const DEFAULT_CONFIG = {
    name: 'ToggleAMP',
    version: getVersion(),
    app_port: 4000,
    domain_suffix: 'test',
    auto_vhost: true,
    auto_ssl: true,
    auto_start: false,
    webserver: {
        active: 'nginx', // 'nginx' | 'apache'
        port: 80,
        ssl_port: 443
    },
    php: {
        active_version: '8.4',
        port: 9000
    },
    database: {
        engine: 'mariadb', // 'mariadb' | 'mysql'
        active_version: '11.4',
        port: 3306
    },
    redis: { enabled: true, version: '5.0.14', port: 6379 },
    mailpit: { enabled: true, web_port: 8025, smtp_port: 1025 }
};

function loadConfig() {
    const toggleAmpCfgPath = path.join(CONFIG_DIR, 'ToggleAMP.json');
    const endServerCfgPath = path.join(CONFIG_DIR, 'end-server.json');
    const nobreakCfgPath = path.join(CONFIG_DIR, 'nobreak.json');
    const cfgPath = fs.existsSync(toggleAmpCfgPath)
        ? toggleAmpCfgPath
        : (fs.existsSync(endServerCfgPath) ? endServerCfgPath : nobreakCfgPath);

    let loaded = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    if (fs.existsSync(cfgPath)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
            loaded = { ...DEFAULT_CONFIG, ...parsed };
        } catch {}
    }
    // Always sync with current VERSION.txt
    loaded.version = getVersion();
    loaded.name = 'ToggleAMP';
    if (loaded.developer) {
        delete loaded.developer.website;
        delete loaded.developer.github;
    }

    // Migration safety
    if (!loaded.webserver || !loaded.webserver.active) {
        loaded.webserver = { active: 'nginx', port: 80, ssl_port: 443 };
    }
    if (!loaded.php) loaded.php = {};
    if (!loaded.php.active_version) {
        loaded.php.active_version = loaded.php.version ? loaded.php.version.substring(0, 3) : '8.4';
    }
    if (!loaded.php.port) loaded.php.port = 9000;

    if (!loaded.database || !loaded.database.engine) {
        loaded.database = { engine: 'mariadb', active_version: '11.4', port: 3306 };
    }
    saveConfig(loaded);
    return loaded;
}

function saveConfig(cfg) {
    const toggleAmpCfgPath = path.join(CONFIG_DIR, 'ToggleAMP.json');
    const endServerCfgPath = path.join(CONFIG_DIR, 'end-server.json');
    const nobreakCfgPath = path.join(CONFIG_DIR, 'nobreak.json');
    const jsonStr = JSON.stringify(cfg, null, 2);
    try { fs.writeFileSync(toggleAmpCfgPath, jsonStr); } catch {}
    try { fs.writeFileSync(endServerCfgPath, jsonStr); } catch {}
    try { fs.writeFileSync(nobreakCfgPath, jsonStr); } catch {}
}

let config = loadConfig();

// Downloadable Packages Catalog
const PACKAGES = {
    // Web Servers
    'nginx': {
        category: 'webserver',
        name: 'Nginx',
        version: '1.26.1',
        url: 'https://nginx.org/download/nginx-1.26.1.zip',
        dest: path.join(BIN_DIR, 'nginx'),
        type: 'zip'
    },
    'apache': {
        category: 'webserver',
        name: 'Apache HTTPD',
        version: '2.4.68',
        url: 'https://www.apachelounge.com/download/VS18/binaries/httpd-2.4.68-260827-Win64-VS18.zip',
        dest: path.join(BIN_DIR, 'apache'),
        type: 'zip',
        stripPrefix: 'Apache24'
    },

    // PHP Versions
    'php-8.4': {
        category: 'php',
        name: 'PHP 8.4',
        version: '8.4.25',
        url: 'https://downloads.php.net/~windows/releases/php-8.4.25-nts-Win32-vs17-x64.zip',
        dest: path.join(BIN_DIR, 'php', 'php-8.4'),
        type: 'zip'
    },
    'php-8.3': {
        category: 'php',
        name: 'PHP 8.3',
        version: '8.3.33',
        url: 'https://downloads.php.net/~windows/releases/php-8.3.33-nts-Win32-vs16-x64.zip',
        dest: path.join(BIN_DIR, 'php', 'php-8.3'),
        type: 'zip'
    },
    'php-8.2': {
        category: 'php',
        name: 'PHP 8.2',
        version: '8.2.33',
        url: 'https://downloads.php.net/~windows/releases/php-8.2.33-nts-Win32-vs16-x64.zip',
        dest: path.join(BIN_DIR, 'php', 'php-8.2'),
        type: 'zip'
    },
    'php-8.1': {
        category: 'php',
        name: 'PHP 8.1',
        version: '8.1.34',
        url: 'https://downloads.php.net/~windows/releases/php-8.1.34-nts-Win32-vs16-x64.zip',
        dest: path.join(BIN_DIR, 'php', 'php-8.1'),
        type: 'zip'
    },
    'php-7.4': {
        category: 'php',
        name: 'PHP 7.4',
        version: '7.4.33',
        url: 'https://downloads.php.net/~windows/releases/php-7.4.33-nts-Win32-vc15-x64.zip',
        dest: path.join(BIN_DIR, 'php', 'php-7.4'),
        type: 'zip'
    },
    'php-5.2': {
        category: 'php',
        name: 'PHP 5.2 (Legacy)',
        version: '5.2.9',
        url: 'https://museum.php.net/php5/php-5.2.9-Win32.zip',
        dest: path.join(BIN_DIR, 'php', 'php-5.2'),
        type: 'zip'
    },

    // Databases
    'mariadb-11.4': {
        category: 'database',
        name: 'MariaDB 11.4 LTS',
        version: '11.4.2',
        url: 'https://archive.mariadb.org/mariadb-11.4.2/winx64-packages/mariadb-11.4.2-winx64.zip',
        dest: path.join(BIN_DIR, 'db', 'mariadb-11.4'),
        type: 'zip'
    },
    'mariadb-10.11': {
        category: 'database',
        name: 'MariaDB 10.11 LTS',
        version: '10.11.8',
        url: 'https://archive.mariadb.org/mariadb-10.11.8/winx64-packages/mariadb-10.11.8-winx64.zip',
        dest: path.join(BIN_DIR, 'db', 'mariadb-10.11'),
        type: 'zip'
    },
    'mysql-8.4': {
        category: 'database',
        name: 'MySQL 8.4 LTS',
        version: '8.4.0',
        url: 'https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.0-winx64.zip',
        dest: path.join(BIN_DIR, 'db', 'mysql-8.4'),
        type: 'zip'
    },
    'mysql-8.0': {
        category: 'database',
        name: 'MySQL 8.0',
        version: '8.0.36',
        url: 'https://cdn.mysql.com/archives/mysql-8.0/mysql-8.0.36-winx64.zip',
        dest: path.join(BIN_DIR, 'db', 'mysql-8.0'),
        type: 'zip'
    },
    'mysql-5.1': {
        category: 'database',
        name: 'MySQL 5.1 (Legacy)',
        version: '5.1.33',
        url: 'https://cdn.mysql.com/archives/mysql-5.1/mysql-noinstall-5.1.33-win32.zip',
        dest: path.join(BIN_DIR, 'db', 'mysql-5.1'),
        type: 'zip'
    },

    // Utilities
    'composer': {
        category: 'utility',
        name: 'Composer',
        version: '2.7.7',
        url: 'https://getcomposer.org/composer-stable.phar',
        dest: path.join(BIN_DIR, 'composer', 'composer.phar'),
        type: 'file'
    },
    'redis': {
        category: 'utility',
        name: 'Redis Cache Server',
        version: '5.0.14',
        url: 'https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip',
        dest: path.join(BIN_DIR, 'redis'),
        type: 'zip'
    },
    'mailpit': {
        category: 'utility',
        name: 'Mailpit',
        version: '1.18.0',
        url: 'https://github.com/axllent/mailpit/releases/download/v1.18.0/mailpit-windows-amd64.zip',
        dest: path.join(BIN_DIR, 'mailpit'),
        type: 'zip'
    }
};

// Log Broadcaster & File Logger
const logListeners = [];
const logHistory = [];

function broadcastLog(service, message) {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const dateStr = `${YYYY}-${MM}-${DD}`;
    const timeStr = `${hh}:${mm}:${ss}`;
    const fullDateTime = `${dateStr} ${timeStr}`;

    const logItem = { timestamp: fullDateTime, timeOnly: timeStr, service, message };
    logHistory.push(logItem);
    if (logHistory.length > 500) logHistory.shift();

    const formattedConsole = `[${fullDateTime}] [\x1b[36m${service}\x1b[0m] ${message}`;
    console.log(formattedConsole);

    // Save to daily log file: logs/activity/activity-YYYY-MM-DD.log & logs/activity.log
    const activityLogDir = path.join(LOGS_DIR, 'activity');
    if (!fs.existsSync(activityLogDir)) fs.mkdirSync(activityLogDir, { recursive: true });

    const fileLogLine = `[${fullDateTime}] [${service}] ${message}\n`;
    try {
        fs.appendFileSync(path.join(activityLogDir, `activity-${dateStr}.log`), fileLogLine, 'utf8');
        fs.appendFileSync(path.join(LOGS_DIR, 'activity.log'), fileLogLine, 'utf8');
    } catch {}

    const sseData = `data: ${JSON.stringify(logItem)}\n\n`;
    logListeners.forEach(res => {
        try { res.write(sseData); } catch {}
    });
}

// Pre-load recent logs into memory on startup
function initLogHistory() {
    try {
        const logFile = path.join(LOGS_DIR, 'activity.log');
        if (fs.existsSync(logFile)) {
            const stat = fs.statSync(logFile);
            const readSize = Math.min(stat.size, 65536);
            const start = Math.max(0, stat.size - readSize);
            const fd = fs.openSync(logFile, 'r');
            const buf = Buffer.alloc(readSize);
            fs.readSync(fd, buf, 0, readSize, start);
            fs.closeSync(fd);
            const text = buf.toString('utf8');
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            const recentLines = lines.slice(-100);
            recentLines.forEach(line => {
                const match = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/);
                if (match) {
                    const ts = match[1];
                    const srv = match[2];
                    const msg = match[3];
                    logHistory.push({
                        timestamp: ts,
                        timeOnly: ts.includes(' ') ? ts.split(' ')[1] : ts,
                        service: srv,
                        message: msg
                    });
                }
            });
        }
    } catch (e) {}
}
initLogHistory();

// Background Watcher for Service Error Logs (PHP, Apache, Nginx)
const errorLogWatchers = {};
function watchServiceErrorLogs() {
    const errorLogs = [
        { service: 'php-error', file: path.join(LOGS_DIR, 'php', `php_${config.php.active_version}_errors.log`) },
        { service: 'php-error', file: path.join(LOGS_DIR, 'php', 'php_errors.log') },
        { service: 'web-error', file: path.join(LOGS_DIR, 'apache', 'error.log') },
        { service: 'web-error', file: path.join(LOGS_DIR, 'nginx', 'error.log') }
    ];

    errorLogs.forEach(target => {
        try {
            if (fs.existsSync(target.file) && !errorLogWatchers[target.file]) {
                let lastPos = fs.statSync(target.file).size;
                const interval = setInterval(() => {
                    try {
                        if (!fs.existsSync(target.file)) return;
                        const curStat = fs.statSync(target.file);
                        if (curStat.size > lastPos) {
                            const fd = fs.openSync(target.file, 'r');
                            const toRead = curStat.size - lastPos;
                            const buf = Buffer.alloc(toRead);
                            fs.readSync(fd, buf, 0, toRead, lastPos);
                            fs.closeSync(fd);
                            lastPos = curStat.size;
                            const lines = buf.toString('utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
                            lines.forEach(l => broadcastLog(target.service, l.trim()));
                        } else if (curStat.size < lastPos) {
                            lastPos = curStat.size;
                        }
                    } catch {}
                }, 1000);
                interval.unref();
                errorLogWatchers[target.file] = interval;
            }
        } catch {}
    });
}

// Managed Service State
const services = {
    webserver: { name: 'webserver', engine: config.webserver.active, port: config.webserver.port, state: 'stopped', process: null, startTime: null },
    php: { name: 'php', version: config.php.active_version, port: config.php.port, state: 'stopped', process: null, startTime: null },
    database: { name: 'database', engine: config.database.engine, version: config.database.active_version, port: config.database.port, state: 'stopped', process: null, startTime: null },
    redis: { name: 'redis', port: config.redis.port, state: 'stopped', process: null, startTime: null },
    mailpit: { name: 'mailpit', port: config.mailpit.web_port, state: 'stopped', process: null, startTime: null }
};

// Path Resolvers
function getActivePhpDir() {
    const ver = config.php.active_version;
    const targetDir = path.join(BIN_DIR, 'php', `php-${ver}`);
    if (fs.existsSync(path.join(targetDir, 'php.exe')) || fs.existsSync(path.join(targetDir, 'php-cgi.exe'))) {
        return targetDir;
    }
    // Fallback if exists under bin/php-ver
    const altDir = path.join(BIN_DIR, `php-${ver}`);
    if (fs.existsSync(path.join(altDir, 'php.exe'))) return altDir;

    return targetDir;
}

function getActiveDbDir() {
    const engine = config.database.engine; // 'mariadb' | 'mysql' | 'postgresql'
    const ver = config.database.active_version;
    const isPostgres = engine === 'postgresql' || engine === 'postgres';
    const candidates = [
        path.join(BIN_DIR, 'db', `${engine}-${ver}`),
        path.join(BIN_DIR, `${engine}-${ver}`),
        path.join(BIN_DIR, 'db', `postgresql-${ver}`),
        path.join(BIN_DIR, 'db', `postgres-${ver}`),
        path.join(BIN_DIR, engine),
        path.join(BIN_DIR, 'mariadb'),
        path.join(BIN_DIR, 'mysql'),
        path.join(BIN_DIR, 'postgresql')
    ];
    for (const c of candidates) {
        if (isPostgres) {
            if (fs.existsSync(path.join(c, 'bin', 'postgres.exe')) || fs.existsSync(path.join(c, 'postgres.exe'))) {
                return c;
            }
        } else {
            if (fs.existsSync(path.join(c, 'bin', 'mysqld.exe')) || fs.existsSync(path.join(c, 'mysqld.exe'))) {
                return c;
            }
        }
    }
    return candidates[0];
}

function getInstalledPhpVersions() {
    const versions = [];
    const phpRoot = path.join(BIN_DIR, 'php');
    if (fs.existsSync(phpRoot)) {
        fs.readdirSync(phpRoot, { withFileTypes: true }).forEach(entry => {
            if (entry.isDirectory() && entry.name.startsWith('php-')) {
                const v = entry.name.replace('php-', '');
                if (!versions.includes(v)) versions.push(v);
            }
        });
    }
    // Sort descending by semantic version (newest first)
    versions.sort((a, b) => {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        if (pa[0] !== pb[0]) return pb[0] - pa[0];
        return (pb[1] || 0) - (pa[1] || 0);
    });
    return versions;
}

function getInstalledDbVersions() {
    const installed = [];
    const dbRoot = path.join(BIN_DIR, 'db');
    if (fs.existsSync(dbRoot)) {
        fs.readdirSync(dbRoot).forEach(name => {
            if (name.startsWith('mariadb-') || name.startsWith('mysql-')) {
                const parts = name.split('-');
                installed.push({ engine: parts[0], version: parts[1], key: name });
            }
        });
    }
    if (fs.existsSync(path.join(BIN_DIR, 'mariadb'))) {
        installed.push({ engine: 'mariadb', version: '11.4', key: 'mariadb-11.4' });
    }
    const order = ['mariadb-11.4', 'mariadb-10.11', 'mysql-8.4', 'mysql-8.0', 'mysql-5.1'];
    installed.sort((a, b) => {
        const ia = order.indexOf(a.key);
        const ib = order.indexOf(b.key);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return installed;
}

function isPackageInstalled(key, pkg) {
    if (key === 'nginx') {
        return fs.existsSync(path.join(BIN_DIR, 'nginx', 'nginx.exe'));
    }
    if (key === 'apache') {
        return fs.existsSync(path.join(BIN_DIR, 'apache', 'bin', 'httpd.exe')) || fs.existsSync(path.join(BIN_DIR, 'apache', 'httpd.exe'));
    }
    if (pkg.category === 'php') {
        const v = key.replace('php-', '');
        return fs.existsSync(path.join(BIN_DIR, 'php', `php-${v}`, 'php.exe')) ||
               fs.existsSync(path.join(BIN_DIR, `php-${v}`, 'php.exe'));
    }
    if (pkg.category === 'database') {
        const parts = key.split('-');
        const engine = parts[0];
        const ver = parts[1];
        const candidates = [
            path.join(BIN_DIR, 'db', `${engine}-${ver}`, 'bin', 'mysqld.exe'),
            path.join(BIN_DIR, 'db', `${engine}-${ver}`, 'mysqld.exe'),
            path.join(BIN_DIR, `${engine}-${ver}`, 'bin', 'mysqld.exe'),
            path.join(BIN_DIR, engine, 'bin', 'mysqld.exe')
        ];
        return candidates.some(c => fs.existsSync(c));
    }
    if (key === 'composer') {
        return fs.existsSync(path.join(BIN_DIR, 'composer', 'composer.phar')) || fs.existsSync(path.join(BIN_DIR, 'php', 'composer.phar'));
    }
    if (key === 'mailpit') {
        return fs.existsSync(path.join(BIN_DIR, 'mailpit', 'mailpit.exe'));
    }
    return fs.existsSync(pkg.dest);
}

// Config Generators
function generateConfigs() {
    const phpDir = getActivePhpDir();
    const activeWs = config.webserver.active;

    // 1. Nginx Config
    const nginxConfDir = path.join(CONFIG_DIR, 'nginx');
    if (!fs.existsSync(nginxConfDir)) fs.mkdirSync(nginxConfDir, { recursive: true });
    const nginxBinConf = path.join(BIN_DIR, 'nginx', 'conf');
    if (fs.existsSync(nginxBinConf)) {
        ['mime.types', 'fastcgi_params', 'fastcgi.conf'].forEach(f => {
            const src = path.join(nginxBinConf, f);
            const dst = path.join(nginxConfDir, f);
            if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
        });
    }

    const pmaLatestDir = path.join(BIN_DIR, 'phpmyadmin', 'phpmyadmin-latest').replace(/\\/g, '/');
    const pma3Dir = path.join(BIN_DIR, 'phpmyadmin', 'phpmyadmin-3.1').replace(/\\/g, '/');

    const nginxConf = `worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    client_max_body_size 0;
    client_body_buffer_size 128k;

    server {
        listen       ${config.webserver.port};
        server_name  localhost 127.0.0.1;
        root         "${WWW_DIR.replace(/\\/g, '/')}";
        index        index.html index.htm index.php;

        location / {
            autoindex on;
            try_files $uri $uri/ /index.php?$query_string;
        }

        location /myadmin {
            alias "${pmaLatestDir}";
            index index.php index.html index.htm;

            location ~ \\.php$ {
                fastcgi_pass   127.0.0.1:${config.php.port};
                fastcgi_index  index.php;
                fastcgi_param  SCRIPT_FILENAME $request_filename;
                include        fastcgi_params;
            }
        }

        location /phpmyadmin {
            alias "${pma3Dir}";
            index index.php index.html index.htm;

            location ~ \\.php$ {
                fastcgi_pass   127.0.0.1:${config.php.port};
                fastcgi_index  index.php;
                fastcgi_param  SCRIPT_FILENAME $request_filename;
                include        fastcgi_params;
            }
        }

        location ~ \\.php$ {
            fastcgi_pass   127.0.0.1:${config.php.port};
            fastcgi_index  index.php;
            fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include        fastcgi_params;
        }
    }

    include "${path.join(CONFIG_DIR, 'nginx', 'vhosts', '*.conf').replace(/\\/g, '/')}";
}
`;
    fs.writeFileSync(path.join(nginxConfDir, 'nginx.conf'), nginxConf);

    // 2. Apache (HTTPD) Config
    const apacheConfDir = path.join(CONFIG_DIR, 'apache');
    const apacheVhostDir = path.join(CONFIG_DIR, 'apache', 'vhosts');
    if (!fs.existsSync(apacheConfDir)) fs.mkdirSync(apacheConfDir, { recursive: true });
    if (!fs.existsSync(apacheVhostDir)) fs.mkdirSync(apacheVhostDir, { recursive: true });
    if (!fs.existsSync(path.join(LOGS_DIR, 'apache'))) fs.mkdirSync(path.join(LOGS_DIR, 'apache'), { recursive: true });
    const apacheBinDir = path.join(BIN_DIR, 'apache');

    const apacheConf = `ServerRoot "${apacheBinDir.replace(/\\/g, '/')}"
Listen ${config.webserver.port}

LoadModule authn_file_module modules/mod_authn_file.so
LoadModule authn_core_module modules/mod_authn_core.so
LoadModule authz_host_module modules/mod_authz_host.so
LoadModule authz_groupfile_module modules/mod_authz_groupfile.so
LoadModule authz_user_module modules/mod_authz_user.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule access_compat_module modules/mod_access_compat.so
LoadModule auth_basic_module modules/mod_auth_basic.so
LoadModule reqtimeout_module modules/mod_reqtimeout.so
LoadModule filter_module modules/mod_filter.so
LoadModule mime_module modules/mod_mime.so
LoadModule log_config_module modules/mod_log_config.so
LoadModule env_module modules/mod_env.so
LoadModule headers_module modules/mod_headers.so
LoadModule setenvif_module modules/mod_setenvif.so
LoadModule version_module modules/mod_version.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_fcgi_module modules/mod_proxy_fcgi.so
LoadModule dir_module modules/mod_dir.so
LoadModule alias_module modules/mod_alias.so
LoadModule rewrite_module modules/mod_rewrite.so

ServerAdmin admin@localhost
ServerName localhost:${config.webserver.port}

<Directory />
    AllowOverride none
    Require all denied
</Directory>
LimitRequestBody 0

DocumentRoot "${WWW_DIR.replace(/\\/g, '/')}"
<Directory "${WWW_DIR.replace(/\\/g, '/')}">
    Options Indexes FollowSymLinks MultiViews
    AllowOverride All
    Require all granted
</Directory>

ProxyFCGISetEnvIf "true" SCRIPT_FILENAME "%{reqenv:DOCUMENT_ROOT}%{reqenv:SCRIPT_NAME}"

Alias /myadmin "${pmaLatestDir}"
<Directory "${pmaLatestDir}">
    Options Indexes FollowSymLinks MultiViews
    AllowOverride All
    Require all granted
    DirectoryIndex index.php index.html index.htm
    ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^/myadmin/(.*)$#" SCRIPT_FILENAME "${pmaLatestDir}/$1"
    ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^/myadmin/?$#" SCRIPT_FILENAME "${pmaLatestDir}/index.php"
    ProxyFCGISetEnvIf "reqenv('SCRIPT_FILENAME') =~ m#/$#" SCRIPT_FILENAME "${pmaLatestDir}/index.php"
</Directory>

Alias /phpmyadmin "${pma3Dir}"
<Directory "${pma3Dir}">
    Options Indexes FollowSymLinks MultiViews
    AllowOverride All
    Require all granted
    DirectoryIndex index.php index.html index.htm
    ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^/phpmyadmin/(.*)$#" SCRIPT_FILENAME "${pma3Dir}/$1"
    ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^/phpmyadmin/?$#" SCRIPT_FILENAME "${pma3Dir}/index.php"
    ProxyFCGISetEnvIf "reqenv('SCRIPT_FILENAME') =~ m#/$#" SCRIPT_FILENAME "${pma3Dir}/index.php"
</Directory>

DirectoryIndex index.php index.html index.htm

<FilesMatch \\.php$>
    SetHandler "proxy:fcgi://127.0.0.1:${config.php.port}/"
</FilesMatch>

ErrorLog "${path.join(LOGS_DIR, 'apache', 'error.log').replace(/\\/g, '/')}"
LogLevel warn

<IfModule log_config_module>
    LogFormat "%h %l %u %t \\"%r\\" %>s %b" common
    CustomLog "${path.join(LOGS_DIR, 'apache', 'access.log').replace(/\\/g, '/')}" common
</IfModule>

TypesConfig conf/mime.types

<VirtualHost *:${config.webserver.port}>
    ServerName localhost
    ServerAlias 127.0.0.1
    DocumentRoot "${WWW_DIR.replace(/\\/g, '/')}"
    <Directory "${WWW_DIR.replace(/\\/g, '/')}">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
        DirectoryIndex index.php index.html index.htm
    </Directory>
    ProxyFCGISetEnvIf "true" SCRIPT_FILENAME "%{reqenv:DOCUMENT_ROOT}%{reqenv:SCRIPT_NAME}"
</VirtualHost>

IncludeOptional "${path.join(CONFIG_DIR, 'apache', 'vhosts', '*.conf').replace(/\\/g, '/')}"
`;
    fs.writeFileSync(path.join(apacheConfDir, 'httpd.conf'), apacheConf);

    // 3. PHP.ini generator (Version-specific & Active)
    getInstalledPhpVersions().forEach(v => generatePhpIni(v));

    // 4. Composer wrapper
    if (fs.existsSync(phpDir)) {
        const composerPhar = fs.existsSync(path.join(BIN_DIR, 'composer', 'composer.phar'))
            ? path.join(BIN_DIR, 'composer', 'composer.phar')
            : path.join(phpDir, 'composer.phar');
        const composerBat = `@echo off\n"${path.join(phpDir, 'php.exe')}" "${composerPhar}" %*\n`;
        try { fs.writeFileSync(path.join(phpDir, 'composer.bat'), composerBat); } catch {}
    }

    // 5. MySQL / MariaDB my.ini generator (Engine/Version-specific & Active)
    getInstalledDbVersions().forEach(d => generateDbIni(d.engine, d.version));
}

function generatePhpIni(version) {
    const phpConfDir = path.join(CONFIG_DIR, 'php');
    if (!fs.existsSync(phpConfDir)) fs.mkdirSync(phpConfDir, { recursive: true });
    const targetPhpDir = path.join(BIN_DIR, 'php', `php-${version}`);
    const extDir = (fs.existsSync(path.join(targetPhpDir, 'ext'))
        ? path.join(targetPhpDir, 'ext')
        : path.join(targetPhpDir)).replace(/\\/g, '/');
    const verIniPath = path.join(phpConfDir, `php-${version}.ini`);
    const activeIniPath = path.join(phpConfDir, 'php.ini');
    const binPhpIni = path.join(targetPhpDir, 'php.ini');

    let extensionsBlock = '';
    if (version === '5.2') {
        const exts52 = [
            'extension=php_mysql.dll',
            'extension=php_mysqli.dll',
            'extension=php_gd2.dll',
            'extension=php_mbstring.dll',
            'extension=php_curl.dll',
            'extension=php_pdo.dll',
            'extension=php_pdo_mysql.dll'
        ];
        extensionsBlock = exts52.join('\n');
    } else {
        const baseExts = [
            'extension=curl',
            'extension=fileinfo',
            'extension=gd',
            'extension=intl',
            'extension=mbstring',
            'extension=mysqli',
            'extension=openssl',
            'extension=pdo_mysql',
            'extension=pdo_sqlite',
            'extension=sqlite3',
            'extension=zip'
        ];
        extensionsBlock = baseExts.join('\n');
    }

    let zendOptimizerBlock = '';
    if (version === '5.2') {
        const zendManagerDll = path.join(targetPhpDir, 'zendOptimizer', 'lib', 'ZendExtensionManager.dll');
        const zendOptimizerDir = path.join(targetPhpDir, 'zendOptimizer', 'lib', 'Optimizer');

        if (fs.existsSync(zendManagerDll) && fs.existsSync(zendOptimizerDir)) {
            zendOptimizerBlock = `
[Zend]
zend_extension_ts = "${zendManagerDll.replace(/\\/g, '/')}"
zend_extension_manager.optimizer_ts = "${zendOptimizerDir.replace(/\\/g, '/')}"
zend_optimizer.optimization_level = 15
zend_optimizer.enable_loader = 1
`;
        } else {
            const zendOptCandidates = [
                path.join(targetPhpDir, 'zendOptimizer', 'lib', 'Optimizer', 'php-5.2.x', 'ZendOptimizer.dll'),
                path.join(targetPhpDir, 'zendOptimizer', 'ZendOptimizer.dll'),
                path.join(targetPhpDir, 'optimizer', 'ZendOptimizer.dll'),
                path.join(targetPhpDir, 'ext', 'ZendOptimizer.dll'),
                path.join(targetPhpDir, 'ZendOptimizer.dll')
            ];
            for (const zo of zendOptCandidates) {
                if (fs.existsSync(zo)) {
                    zendOptimizerBlock = `
[Zend]
zend_extension_ts = "${zo.replace(/\\/g, '/')}"
zend_optimizer.optimization_level = 15
zend_optimizer.enable_loader = 1
`;
                    break;
                }
            }
        }
    }

    const defaultPhpIni = `[PHP]
; Configuration for PHP ${version}
engine = On
short_open_tag = On
precision = 14
output_buffering = 4096
max_execution_time = 120
memory_limit = 512M
error_reporting = E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_USER_DEPRECATED
display_errors = On
display_startup_errors = On
log_errors = On
error_log = "${path.join(LOGS_DIR, 'php', `php_${version}_errors.log`).replace(/\\/g, '/')}"
post_max_size = 128M
upload_max_filesize = 128M
max_file_uploads = 20

extension_dir = "${extDir}"
${extensionsBlock}
${zendOptimizerBlock}
[CGI]
cgi.fix_pathinfo = 1
cgi.force_redirect = 0

[Date]
date.timezone = Asia/Seoul

[mail function]
SMTP = 127.0.0.1
smtp_port = ${config.mailpit.smtp_port}
`;

    // 1. If version-specific ini does NOT exist, create it
    if (!fs.existsSync(verIniPath)) {
        if (fs.existsSync(binPhpIni)) {
            fs.copyFileSync(binPhpIni, verIniPath);
        } else {
            fs.writeFileSync(verIniPath, defaultPhpIni, 'utf8');
        }
    } else {
        // 2. If it already exists, PRESERVE ALL USER SETTINGS!
        let existing = fs.readFileSync(verIniPath, 'utf8');
        let modified = false;

        if (/^extension_dir\s*=/m.test(existing)) {
            const currentExt = existing.match(/^extension_dir\s*=\s*["']?(.*?)["']?\s*$/m);
            if (currentExt && currentExt[1].replace(/\\/g, '/') !== extDir) {
                existing = existing.replace(/^extension_dir\s*=.*$/m, `extension_dir = "${extDir}"`);
                modified = true;
            }
        } else {
            existing = `extension_dir = "${extDir}"\n` + existing;
            modified = true;
        }

        const expectedLog = path.join(LOGS_DIR, 'php', `php_${version}_errors.log`).replace(/\\/g, '/');
        if (/^error_log\s*=/m.test(existing)) {
            const currentLog = existing.match(/^error_log\s*=\s*["']?(.*?)["']?\s*$/m);
            if (currentLog && currentLog[1].replace(/\\/g, '/') !== expectedLog) {
                existing = existing.replace(/^error_log\s*=.*$/m, `error_log = "${expectedLog}"`);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(verIniPath, existing, 'utf8');
        }
    }

    // 3. Mirror to active php.ini if this is the active PHP version
    if (version === config.php.active_version) {
        if (fs.existsSync(activeIniPath) && fs.existsSync(verIniPath)) {
            try {
                const activeContent = fs.readFileSync(activeIniPath, 'utf8');
                const isSameVersionHeader = activeContent.includes(`Configuration for PHP ${version}`);
                const activeMtime = fs.statSync(activeIniPath).mtimeMs;
                const verMtime = fs.statSync(verIniPath).mtimeMs;

                if (isSameVersionHeader && activeMtime > verMtime + 2000) {
                    // Only sync back to verIniPath if php.ini was explicitly edited for this same version
                    fs.copyFileSync(activeIniPath, verIniPath);
                } else {
                    // On version switch or normal operation, verIniPath is authoritative
                    fs.copyFileSync(verIniPath, activeIniPath);
                }
            } catch {
                fs.copyFileSync(verIniPath, activeIniPath);
            }
        } else if (fs.existsSync(verIniPath)) {
            fs.copyFileSync(verIniPath, activeIniPath);
        }
    }

    // 4. Also keep bin/php/php-${version}/php.ini in sync for CLI / Composer consistency
    if (fs.existsSync(verIniPath) && fs.existsSync(targetPhpDir)) {
        try {
            fs.copyFileSync(verIniPath, binPhpIni);
        } catch {}
    }
}

function generateDbIni(engine, version) {
    const dbKey = `${engine}-${version}`;
    const dataDir = path.join(DATA_DIR, 'db', dbKey).replace(/\\/g, '/');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const mysqlConfDir = path.join(CONFIG_DIR, 'mysql');
    if (!fs.existsSync(mysqlConfDir)) fs.mkdirSync(mysqlConfDir, { recursive: true });

    let dbSpecificConfig = '';
    if (engine === 'mysql' && version === '5.1') {
        dbSpecificConfig = `default-character-set=utf8
character-set-server=utf8
collation-server=utf8_general_ci`;
    } else {
        dbSpecificConfig = `default_storage_engine=InnoDB
innodb_file_per_table=1
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci`;
    }

    const myIni = `[mysqld]
; Configuration for ${engine.toUpperCase()} ${version}
port=${config.database.port || 3306}
datadir="${dataDir}"
bind-address=127.0.0.1
max_allowed_packet=64M
${dbSpecificConfig}

[client]
port=${config.database.port || 3306}
default-character-set=utf8mb4
`;
    const verIniPath = path.join(mysqlConfDir, `my-${dbKey}.ini`);
    if (!fs.existsSync(verIniPath)) {
        fs.writeFileSync(verIniPath, myIni);
    } else {
        let existing = fs.readFileSync(verIniPath, 'utf8');
        if (/^datadir\s*=/m.test(existing)) {
            existing = existing.replace(/^datadir\s*=.*$/m, `datadir="${dataDir}"`);
            fs.writeFileSync(verIniPath, existing, 'utf8');
        }
    }
    if (engine === config.database.engine && version === config.database.active_version) {
        fs.writeFileSync(path.join(mysqlConfDir, 'my.ini'), fs.readFileSync(verIniPath, 'utf8'));
    }
}

// Virtual Host Scanner & Multi-Webserver Generator
function scanSites() {
    if (!fs.existsSync(WWW_DIR)) fs.mkdirSync(WWW_DIR, { recursive: true });
    const entries = fs.readdirSync(WWW_DIR, { withFileTypes: true });
    const sites = [];
    const IGNORED_DIRS = ['myadmin', 'phpmyadmin'];

    entries.filter(e => (e.isDirectory() || e.isSymbolicLink()) && !e.name.startsWith('.') && !IGNORED_DIRS.includes(e.name)).forEach(dir => {
        const name = dir.name;
        const sitePath = path.join(WWW_DIR, name);
        const domain = `${name}.${config.domain_suffix}`;
        let docRoot = sitePath;
        let relDocRoot = `www/${name}`;
        let siteType = 'static';

        const publicDir = path.join(sitePath, 'public');
        if (fs.existsSync(publicDir) && fs.statSync(publicDir).isDirectory()) {
            docRoot = publicDir;
            relDocRoot = `www/${name}/public`;
            siteType = fs.existsSync(path.join(publicDir, 'index.php')) ? 'php-laravel' : 'static-public';
            const rootIndex = path.join(sitePath, 'index.php');
            if (!fs.existsSync(rootIndex)) {
                fs.writeFileSync(rootIndex, `<?php\nheader("Location: /${name}/public/");\nexit;\n`);
            }
        } else if (fs.existsSync(path.join(sitePath, 'index.php'))) {
            siteType = 'php-standard';
        } else if (fs.existsSync(path.join(sitePath, 'package.json'))) {
            siteType = 'node';
        }

        const url = config.webserver.port === 80 ? `http://${domain}` : `http://${domain}:${config.webserver.port}`;
        const localUrl = config.webserver.port === 80 ? `http://localhost/${name}` : `http://localhost:${config.webserver.port}/${name}`;
        const sslUrl = config.auto_ssl ? (config.webserver.ssl_port === 443 ? `https://${domain}` : `https://${domain}:${config.webserver.ssl_port}`) : null;

        sites.push({
            name,
            domain,
            doc_root: docRoot.replace(/\\/g, '/'),
            rel_doc_root: relDocRoot.replace(/\\/g, '/'),
            type: siteType,
            ssl: config.auto_ssl,
            url,
            local_url: localUrl,
            ssl_url: sslUrl
        });
    });

    return sites;
}

function generateVHosts() {
    const sites = scanSites();
    const pmaLatestDir = path.join(BIN_DIR, 'phpmyadmin', 'phpmyadmin-latest').replace(/\\/g, '/');
    const pma3Dir = path.join(BIN_DIR, 'phpmyadmin', 'phpmyadmin-3.1').replace(/\\/g, '/');

    // 1. Nginx VHosts
    const nginxVhostDir = path.join(CONFIG_DIR, 'nginx', 'vhosts');
    if (!fs.existsSync(nginxVhostDir)) {
        fs.mkdirSync(nginxVhostDir, { recursive: true });
    } else {
        fs.readdirSync(nginxVhostDir).forEach(f => {
            if (f.endsWith('.conf')) try { fs.unlinkSync(path.join(nginxVhostDir, f)); } catch {}
        });
    }

    sites.forEach(site => {
        const confPath = path.join(nginxVhostDir, `${site.domain}.conf`);
        const conf = `server {
    listen ${config.webserver.port};
    server_name ${site.domain};
    root "${site.doc_root}";
    index index.php index.html index.htm;
    charset utf-8;
    client_max_body_size 0;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /myadmin {
        alias "${pmaLatestDir}";
        index index.php index.html index.htm;

        location ~ \\.php$ {
            fastcgi_pass   127.0.0.1:${config.php.port};
            fastcgi_index  index.php;
            fastcgi_param  SCRIPT_FILENAME $request_filename;
            include        fastcgi_params;
        }
    }

    location /phpmyadmin {
        alias "${pma3Dir}";
        index index.php index.html index.htm;

        location ~ \\.php$ {
            fastcgi_pass   127.0.0.1:${config.php.port};
            fastcgi_index  index.php;
            fastcgi_param  SCRIPT_FILENAME $request_filename;
            include        fastcgi_params;
        }
    }


    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log "${path.join(LOGS_DIR, 'nginx', `${site.name}-access.log`).replace(/\\/g, '/')}";
    error_log  "${path.join(LOGS_DIR, 'nginx', `${site.name}-error.log`).replace(/\\/g, '/')}";

    location ~ \\.php$ {
        fastcgi_pass   127.0.0.1:${config.php.port};
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }

    location ~ /\\.(?!well-known).* {
        deny all;
    }
}
`;
        fs.writeFileSync(confPath, conf);
    });

    // 2. Apache VHosts
    const apacheVhostDir = path.join(CONFIG_DIR, 'apache', 'vhosts');
    if (!fs.existsSync(apacheVhostDir)) {
        fs.mkdirSync(apacheVhostDir, { recursive: true });
    } else {
        fs.readdirSync(apacheVhostDir).forEach(f => {
            if (f.endsWith('.conf')) try { fs.unlinkSync(path.join(apacheVhostDir, f)); } catch {}
        });
    }

    sites.forEach(site => {
        const confPath = path.join(apacheVhostDir, `${site.domain}.conf`);
        const hasPhpIndex = fs.existsSync(path.join(site.doc_root, 'index.php'));
        const isPhpApp = hasPhpIndex || site.type.startsWith('php');

        const rewriteRules = isPhpApp ? `
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.php [QSA,L]` : '';

        const phpEnvRules = hasPhpIndex ? `
    ProxyFCGISetEnvIf "true" SCRIPT_FILENAME "${site.doc_root}%{reqenv:SCRIPT_NAME}"
    ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^/?$#" SCRIPT_FILENAME "${site.doc_root}/index.php"
    ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^$#" SCRIPT_FILENAME "${site.doc_root}/index.php"` : `
    ProxyFCGISetEnvIf "true" SCRIPT_FILENAME "${site.doc_root}%{reqenv:SCRIPT_NAME}"`;

        const conf = `<VirtualHost *:${config.webserver.port}>
    ServerName ${site.domain}
    ServerAlias *.${site.domain}
    DocumentRoot "${site.doc_root}"
    DirectoryIndex index.php index.html index.htm

    <Directory "${site.doc_root}">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted${rewriteRules}
    </Directory>
${phpEnvRules}

    Alias /myadmin "${pmaLatestDir}"
    <Directory "${pmaLatestDir}">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
        DirectoryIndex index.php index.html index.htm
        ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^/myadmin/(.*)$#" SCRIPT_FILENAME "${pmaLatestDir}/$1"
        ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^/myadmin/?$#" SCRIPT_FILENAME "${pmaLatestDir}/index.php"
        ProxyFCGISetEnvIf "reqenv('SCRIPT_FILENAME') =~ m#/$#" SCRIPT_FILENAME "${pmaLatestDir}/index.php"
    </Directory>

    Alias /phpmyadmin "${pma3Dir}"
    <Directory "${pma3Dir}">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
        DirectoryIndex index.php index.html index.htm
        ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^/phpmyadmin/(.*)$#" SCRIPT_FILENAME "${pma3Dir}/$1"
        ProxyFCGISetEnvIf "reqenv('SCRIPT_NAME') =~ m#^/phpmyadmin/?$#" SCRIPT_FILENAME "${pma3Dir}/index.php"
        ProxyFCGISetEnvIf "reqenv('SCRIPT_FILENAME') =~ m#/$#" SCRIPT_FILENAME "${pma3Dir}/index.php"
    </Directory>


    <FilesMatch \\.php$>
        SetHandler "proxy:fcgi://127.0.0.1:${config.php.port}/"
    </FilesMatch>

    ErrorLog "${path.join(LOGS_DIR, 'apache', `${site.name}-error.log`).replace(/\\/g, '/')}"
    CustomLog "${path.join(LOGS_DIR, 'apache', `${site.name}-access.log`).replace(/\\/g, '/')}" common
</VirtualHost>
`;
        fs.writeFileSync(confPath, conf);
    });

    return sites;
}

// Windows Hosts File Sync
function syncHostsFile(domains) {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const hostsPath = path.join(sysRoot, 'System32', 'drivers', 'etc', 'hosts');
    const TAG_START = '# --- TOGGLEAMP VHOSTS START ---';
    const TAG_END = '# --- TOGGLEAMP VHOSTS END ---';
    const LEGACY_TAGS = [
        ['# --- END-SERVER VHOSTS START ---', '# --- END-SERVER VHOSTS END ---'],
        ['# --- NOBREAK VHOSTS START ---', '# --- NOBREAK VHOSTS END ---'],
        ['# --- KOKEN VHOSTS START ---', '# --- KOKEN VHOSTS END ---']
    ];

    try {
        let content = fs.readFileSync(hostsPath, 'utf8');
        const lines = content.split('\n');
        const newLines = [];
        let inBlock = false;

        for (const line of lines) {
            const tr = line.trim();
            if (tr === TAG_START || LEGACY_TAGS.some(t => tr === t[0])) { inBlock = true; continue; }
            if (tr === TAG_END || LEGACY_TAGS.some(t => tr === t[1])) { inBlock = false; continue; }
            if (!inBlock) newLines.push(line);
        }

        if (domains && domains.length > 0) {
            newLines.push(TAG_START);
            domains.forEach(d => newLines.push(`127.0.0.1 ${d}`));
            newLines.push(TAG_END);
        }

        const newContent = newLines.join('\n');
        try {
            fs.writeFileSync(hostsPath, newContent);
            broadcastLog('hosts', `Hosts file synchronized with ${domains.length} domains.`);
        } catch (writeErr) {
            broadcastLog('hosts', `Notice: Hosts file update requires Administrator privileges. Standard mode works via http://localhost/. Run bin\\sync-hosts.bat as Administrator if *.test domain mapping is needed.`);
        }
    } catch (e) {
        broadcastLog('hosts', `Notice: Unable to read hosts file (${e.message}).`);
    }
}

// Service Supervisors
function startService(name) {
    const srv = services[name];
    if (!srv) return;
    if (srv.state === 'running') return;

    srv.state = 'starting';
    broadcastLog(name, `Starting ${name}...`);

    let proc = null;

    if (name === 'webserver') {
        const activeWs = config.webserver.active;
        srv.engine = activeWs;
        srv.port = config.webserver.port;

        generateConfigs();
        generateVHosts();

        if (activeWs === 'nginx') {
            const nginxExe = path.join(BIN_DIR, 'nginx', 'nginx.exe');
            if (!fs.existsSync(nginxExe)) {
                broadcastLog(name, `Nginx executable not found in ${nginxExe}. Install it via Package Manager.`);
                srv.state = 'stopped';
                return;
            }
            const confPath = path.join(CONFIG_DIR, 'nginx', 'nginx.conf');
            proc = spawn(nginxExe, ['-c', confPath, '-p', path.join(BIN_DIR, 'nginx')], {
                cwd: path.join(BIN_DIR, 'nginx'),
                windowsHide: true
            });
        } else if (activeWs === 'apache') {
            const apacheExe = path.join(BIN_DIR, 'apache', 'bin', 'httpd.exe');
            if (!fs.existsSync(apacheExe)) {
                broadcastLog(name, `Apache executable not found in ${apacheExe}. Install it via Package Manager.`);
                srv.state = 'stopped';
                return;
            }
            const confPath = path.join(CONFIG_DIR, 'apache', 'httpd.conf');
            proc = spawn(apacheExe, ['-f', confPath, '-d', path.join(BIN_DIR, 'apache')], {
                cwd: path.join(BIN_DIR, 'apache'),
                windowsHide: true
            });
        }
    } else if (name === 'php') {
        const phpDir = getActivePhpDir();
        const phpCgiExe = path.join(phpDir, 'php-cgi.exe');
        if (!fs.existsSync(phpCgiExe)) {
            broadcastLog(name, `PHP FastCGI (${config.php.active_version}) not found in ${phpCgiExe}. Install it via Package Manager.`);
            srv.state = 'stopped';
            return;
        }
        generateConfigs();
        const iniPath = path.join(CONFIG_DIR, 'php', 'php.ini');
        const phpEnv = { ...process.env, PATH: `${phpDir};${process.env.PATH || ''}`, PHP_FCGI_MAX_REQUESTS: '1000' };

        proc = spawn(phpCgiExe, ['-b', `127.0.0.1:${config.php.port}`, '-c', iniPath], {
            cwd: phpDir,
            env: phpEnv,
            windowsHide: true
        });
        srv.version = config.php.active_version;
    } else if (name === 'database') {
        const dbDir = getActiveDbDir();
        const mysqldExe = fs.existsSync(path.join(dbDir, 'bin', 'mysqld.exe'))
            ? path.join(dbDir, 'bin', 'mysqld.exe')
            : path.join(dbDir, 'mysqld.exe');

        if (!fs.existsSync(mysqldExe)) {
            broadcastLog(name, `Database engine (${config.database.engine} ${config.database.active_version}) not found in ${dbDir}. Install it via Package Manager.`);
            srv.state = 'stopped';
            return;
        }

        // Auto-initialize DB data directory per engine and version
        const dbKey = `${config.database.engine}-${config.database.active_version}`;
        const dataDir = path.join(DATA_DIR, 'db', dbKey);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

        if (!fs.existsSync(path.join(dataDir, 'mysql'))) {
            broadcastLog(name, `Initializing database data directory for ${config.database.engine} ${config.database.active_version}...`);
            const installDbExe = path.join(dbDir, 'bin', 'mariadb-install-db.exe');
            if (fs.existsSync(installDbExe)) {
                try { execSync(`"${installDbExe}" --datadir="${dataDir}"`, { stdio: 'ignore' }); } catch {}
            } else if (config.database.engine === 'mysql' && config.database.active_version === '5.1') {
                const bundledData = path.join(dbDir, 'data');
                if (fs.existsSync(bundledData)) {
                    try {
                        execSync(`powershell.exe -Command "Copy-Item -Path '${bundledData}\\*' -Destination '${dataDir}' -Recurse -Force"`);
                    } catch {}
                }
            } else {
                try {
                    execSync(`"${mysqldExe}" --initialize-insecure --datadir="${dataDir}" --console`, { stdio: 'ignore' });
                } catch {}
            }
        }

        generateConfigs();
        const iniPath = path.join(CONFIG_DIR, 'mysql', 'my.ini');
        proc = spawn(mysqldExe, [`--defaults-file=${iniPath}`, '--console'], {
            cwd: dbDir,
            windowsHide: true
        });
        srv.engine = config.database.engine;
        srv.version = config.database.active_version;
        srv.port = config.database.port || 3306;
    } else if (name === 'redis') {
        const redisExe = path.join(BIN_DIR, 'redis', 'redis-server.exe');
        if (!fs.existsSync(redisExe)) {
            broadcastLog(name, `Redis not found in ${redisExe}. Install it via Package Manager.`);
            srv.state = 'stopped';
            return;
        }
        const redisConf = path.join(BIN_DIR, 'redis', 'redis.windows.conf');
        const redisDataDir = path.join(DATA_DIR, 'redis');
        if (!fs.existsSync(redisDataDir)) fs.mkdirSync(redisDataDir, { recursive: true });

        const redisPort = config.redis.port || 6379;
        const args = [];
        if (fs.existsSync(redisConf)) {
            args.push(redisConf);
        }
        args.push('--port', String(redisPort));
        args.push('--dir', redisDataDir);

        proc = spawn(redisExe, args, {
            cwd: path.join(BIN_DIR, 'redis'),
            windowsHide: true
        });
        srv.port = redisPort;
    } else if (name === 'mailpit') {
        const mailpitExe = path.join(BIN_DIR, 'mailpit', 'mailpit.exe');
        if (!fs.existsSync(mailpitExe)) {
            broadcastLog(name, `Mailpit not found in ${mailpitExe}.`);
            srv.state = 'stopped';
            return;
        }
        proc = spawn(mailpitExe, [
            `--listen=127.0.0.1:${config.mailpit.web_port}`,
            `--smtp=127.0.0.1:${config.mailpit.smtp_port}`
        ], { cwd: path.join(BIN_DIR, 'mailpit'), windowsHide: true });
    }

    if (proc) {
        srv.process = proc;
        srv.state = 'running';
        srv.startTime = new Date();
        broadcastLog(name, `Service running (PID: ${proc.pid}, Port: ${srv.port})`);

        proc.stdout?.on('data', data => broadcastLog(name, data.toString().trim()));
        proc.stderr?.on('data', data => broadcastLog(name, data.toString().trim()));
        proc.on('close', code => {
            broadcastLog(name, `Service exited with code ${code}`);
            srv.state = 'stopped';
            srv.process = null;
            srv.startTime = null;
        });
    }
}

function stopService(name) {
    const srv = services[name];
    if (!srv) return;
    broadcastLog(name, `Stopping ${name}...`);

    if (srv.process && srv.process.pid) {
        try { execSync(`taskkill /F /T /PID ${srv.process.pid}`, { stdio: 'ignore' }); } catch {}
        try { process.kill(srv.process.pid, 'SIGKILL'); } catch {}
    }

    if (name === 'webserver') {
        const nginxExe = path.join(BIN_DIR, 'nginx', 'nginx.exe');
        if (fs.existsSync(nginxExe)) {
            try { execSync(`"${nginxExe}" -p "${path.join(BIN_DIR, 'nginx')}" -s stop`, { stdio: 'ignore' }); } catch {}
        }
        try { execSync('taskkill /F /T /IM nginx.exe', { stdio: 'ignore' }); } catch {}
        try { execSync('taskkill /F /T /IM httpd.exe', { stdio: 'ignore' }); } catch {}
    } else if (name === 'php') {
        try { execSync('taskkill /F /T /IM php-cgi.exe', { stdio: 'ignore' }); } catch {}
        try { execSync('taskkill /F /T /IM php.exe', { stdio: 'ignore' }); } catch {}
    } else if (name === 'database') {
        const dbDir = getActiveDbDir();
        const mysqlAdmin = path.join(dbDir, 'bin', 'mysqladmin.exe');
        if (fs.existsSync(mysqlAdmin)) {
            try { execSync(`"${mysqlAdmin}" -u root shutdown`, { stdio: 'ignore' }); } catch {}
        }
        try { execSync('taskkill /F /T /IM mysqld.exe', { stdio: 'ignore' }); } catch {}
        try { execSync('taskkill /F /T /IM mariadbd.exe', { stdio: 'ignore' }); } catch {}
    } else if (name === 'redis') {
        try { execSync('taskkill /F /T /IM redis-server.exe', { stdio: 'ignore' }); } catch {}
    } else if (name === 'mailpit') {
        try { execSync('taskkill /F /T /IM mailpit.exe', { stdio: 'ignore' }); } catch {}
    }

    srv.process = null;
    srv.state = 'stopped';
    srv.startTime = null;
    broadcastLog(name, `${name} stopped.`);
}

function reloadWebServer() {
    if (services.webserver.state !== 'running') return;
    const active = config.webserver.active;
    broadcastLog('webserver', `Reloading ${active} configuration...`);
    generateConfigs();
    generateVHosts();

    if (active === 'nginx') {
        const nginxExe = path.join(BIN_DIR, 'nginx', 'nginx.exe');
        if (fs.existsSync(nginxExe)) {
            try { execSync(`"${nginxExe}" -p "${path.join(BIN_DIR, 'nginx')}" -s reload`, { stdio: 'ignore' }); } catch {}
        }
    } else if (active === 'apache') {
        // Apache graceful restart
        stopService('webserver');
        setTimeout(() => startService('webserver'), 300);
    }
}

// Runtime Switchers
function switchWebServer(target) {
    if (target !== 'nginx' && target !== 'apache') throw new Error(`Invalid webserver: ${target}`);
    broadcastLog('system', `Switching webserver to ${target.toUpperCase()}...`);
    const wasRunning = services.webserver.state === 'running';
    stopService('webserver');
    config.webserver.active = target;
    services.webserver.engine = target;
    saveConfig(config);
    generateConfigs();
    generateVHosts();
    if (wasRunning) {
        setTimeout(() => startService('webserver'), 400);
    }
}

function switchPhpVersion(version, skipPair = false) {
    broadcastLog('system', `Switching PHP version to ${version}...`);
    const wasRunning = services.php.state === 'running';
    stopService('php');
    config.php.active_version = version;
    services.php.version = version;
    saveConfig(config);
    generateConfigs();
    if (wasRunning) {
        setTimeout(() => {
            startService('php');
            reloadWebServer();
        }, 400);
    } else {
        reloadWebServer();
    }

    // Auto-pair Legacy Stack: PHP 5.2 <-> MySQL 5.1
    if (version === '5.2' && !skipPair) {
        if (config.database.engine !== 'mysql' || config.database.active_version !== '5.1') {
            broadcastLog('system', '🔗 [Legacy Mode] Auto-pairing PHP 5.2.9 with MySQL 5.1.33...');
            switchDatabase('mysql', '5.1', true);
        }
    }
}

function switchDatabase(engine, version, skipPair = false) {
    const targetPort = 3306;
    broadcastLog('system', `Switching database to ${engine.toUpperCase()} ${version} (Port: ${targetPort})...`);
    const wasRunning = services.database.state === 'running';
    stopService('database');
    config.database.engine = engine;
    config.database.active_version = version;
    config.database.port = targetPort;
    services.database.engine = engine;
    services.database.version = version;
    services.database.port = targetPort;
    saveConfig(config);
    if (wasRunning) {
        setTimeout(() => startService('database'), 500);
    }

    // Auto-pair Legacy Stack: MySQL 5.1 <-> PHP 5.2
    if (engine === 'mysql' && version === '5.1' && !skipPair) {
        if (config.php.active_version !== '5.2') {
            broadcastLog('system', '🔗 [Legacy Mode] Auto-pairing MySQL 5.1.33 with PHP 5.2.9...');
            switchPhpVersion('5.2', true);
        }
    }
}

function startAll() {
    // Only start Web Server, PHP, and SQL (Database) per user preference
    startService('database');
    startService('php');
    startService('webserver');
}

function stopAll() {
    // Stop all running stack services
    stopService('webserver');
    stopService('php');
    stopService('database');
    stopService('redis');
    stopService('mailpit');
}

// Package Downloader Helper
function downloadPackage(key, onDone) {
    const pkg = PACKAGES[key];
    if (!pkg) throw new Error(`Unknown package: ${key}`);

    broadcastLog('downloader', `Downloading ${pkg.name} v${pkg.version}...`);

    const destDir = pkg.type === 'file' ? path.dirname(pkg.dest) : pkg.dest;
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const tmpFile = path.join(destDir, pkg.type === 'zip' ? 'download.zip' : 'download.tmp');

    const downloadStream = (url, dest, cb) => {
        const getter = url.startsWith('https') ? https : http;
        getter.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ToggleAMP/1.3' }
        }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let redir = res.headers.location;
                if (!redir.startsWith('http')) {
                    const u = new URL(url);
                    redir = `${u.protocol}//${u.host}${redir}`;
                }
                return downloadStream(redir, dest, cb);
            }
            if (res.statusCode !== 200) {
                return cb(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
            });
            file.on('close', () => {
                cb(null);
            });
        }).on('error', err => {
            try { fs.unlinkSync(dest); } catch {}
            cb(err);
        });
    };

    downloadStream(pkg.url, tmpFile, err => {
        if (err) {
            broadcastLog('downloader', `Download failed for ${pkg.name}: ${err.message}`);
            return;
        }

        if (pkg.type === 'zip') {
            broadcastLog('downloader', `Extracting ${pkg.name}...`);
            try {
                execSync(`powershell.exe -Command "Expand-Archive -Path '${tmpFile}' -DestinationPath '${pkg.dest}' -Force"`);
                fs.unlinkSync(tmpFile);

                // Handle nested archive folders (e.g. Apache24 or mariadb-11.4.2-winx64)
                ['Apache24', 'apache24'].forEach(nestedName => {
                    const nested = path.join(pkg.dest, nestedName);
                    if (fs.existsSync(nested) && fs.statSync(nested).isDirectory()) {
                        fs.readdirSync(nested).forEach(sub => {
                            const src = path.join(nested, sub);
                            const dst = path.join(pkg.dest, sub);
                            if (!fs.existsSync(dst)) fs.renameSync(src, dst);
                        });
                        try { fs.rmdirSync(nested); } catch {}
                    }
                });

                const dirItems = fs.readdirSync(pkg.dest).filter(f => fs.statSync(path.join(pkg.dest, f)).isDirectory());
                if (dirItems.length === 1 && !fs.existsSync(path.join(pkg.dest, 'bin')) && !fs.existsSync(path.join(pkg.dest, 'php.exe'))) {
                    const nested = path.join(pkg.dest, dirItems[0]);
                    fs.readdirSync(nested).forEach(sub => {
                        const src = path.join(nested, sub);
                        const dst = path.join(pkg.dest, sub);
                        if (!fs.existsSync(dst)) fs.renameSync(src, dst);
                    });
                    try { fs.rmdirSync(nested); } catch {}
                }

                broadcastLog('downloader', `${pkg.name} installed successfully!`);
                generateConfigs();
                if (onDone) onDone();
            } catch (ex) {
                broadcastLog('downloader', `Extraction failed for ${pkg.name}: ${ex.message}`);
            }
        } else {
            if (fs.existsSync(pkg.dest)) fs.unlinkSync(pkg.dest);
            fs.renameSync(tmpFile, pkg.dest);


            broadcastLog('downloader', `${pkg.name} installed successfully!`);
            generateConfigs();
            if (onDone) onDone();
        }
    });
}

// HTTP API & Dashboard Server
function startDashboardServer() {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://localhost:${config.app_port}`);
        const pathname = url.pathname;

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            return res.end();
        }

        // SSE Logs Stream
        if (pathname === '/api/logs/stream' || pathname === '/ws/logs') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            logListeners.push(res);
            req.on('close', () => {
                const idx = logListeners.indexOf(res);
                if (idx !== -1) logListeners.splice(idx, 1);
            });
            logHistory.forEach(item => {
                res.write(`data: ${JSON.stringify(item)}\n\n`);
            });
            return;
        }

        // REST API: Get Logs
        if (pathname === '/api/logs' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: true, count: logHistory.length, logs: logHistory }));
        }

        // Status API
        if (pathname === '/api/status' && req.method === 'GET') {
            const statusList = Object.values(services).map(s => {
                if (s.state === 'running') {
                    if (s.process?.pid) {
                        try {
                            process.kill(s.process.pid, 0);
                        } catch {
                            s.state = 'stopped';
                            s.process = null;
                            s.startTime = null;
                        }
                    } else {
                        s.state = 'stopped';
                        s.startTime = null;
                    }
                }
                return {
                    name: s.name,
                    engine: s.engine,
                    version: s.version,
                    state: s.state,
                    port: s.port,
                    pid: s.process?.pid || 0,
                    uptime: s.startTime ? `${Math.floor((new Date() - s.startTime) / 1000)}s` : ''
                };
            });
            const reqLang = url.searchParams.get('lang') || 'en';
            const vInfo = getVersionInfo(reqLang);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                services: statusList,
                config: {
                    ...config,
                    version: vInfo.version
                },
                versionInfo: vInfo,
                installedPhp: getInstalledPhpVersions(),
                installedDb: getInstalledDbVersions()
            }));
        }

        if (pathname === '/api/version' && req.method === 'GET') {
            const reqLang = url.searchParams.get('lang') || 'en';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(getVersionInfo(reqLang)));
        }

        // Service Actions
        if (pathname === '/api/service/start' && req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const parsed = JSON.parse(body || '{}');
                const srvName = parsed.name || parsed.service;
                if (!srvName || !services[srvName]) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: `Unknown service: ${srvName}` }));
                }
                startService(srvName);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }

        if (pathname === '/api/service/stop' && req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const parsed = JSON.parse(body || '{}');
                const srvName = parsed.name || parsed.service;
                if (!srvName || !services[srvName]) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: `Unknown service: ${srvName}` }));
                }
                stopService(srvName);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }

        if (pathname === '/api/service/restart' && req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const parsed = JSON.parse(body || '{}');
                const srvName = parsed.name || parsed.service;
                if (!srvName || !services[srvName]) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: `Unknown service: ${srvName}` }));
                }
                stopService(srvName);
                setTimeout(() => startService(srvName), 300);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }

        // Switchers (Disabled when services are running)
        if (pathname === '/api/webserver/switch' && req.method === 'POST') {
            if (services.webserver.state === 'running') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: '웹서버가 실행 중일 때는 웹서버를 변경할 수 없습니다. 먼저 서버를 정지해 주세요.' }));
            }
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const { webserver } = JSON.parse(body || '{}');
                switchWebServer(webserver);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, active: config.webserver.active }));
            });
            return;
        }

        if (pathname === '/api/php/switch' && req.method === 'POST') {
            if (services.php.state === 'running') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'PHP가 실행 중일 때는 PHP 버전을 변경할 수 없습니다. 먼저 서버를 정지해 주세요.' }));
            }
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const { version } = JSON.parse(body || '{}');
                switchPhpVersion(version);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, active_version: config.php.active_version }));
            });
            return;
        }

        if (pathname === '/api/database/switch' && req.method === 'POST') {
            if (services.database.state === 'running') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: '데이터베이스가 실행 중일 때는 DB 엔진을 변경할 수 없습니다. 먼저 서버를 정지해 주세요.' }));
            }
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const { engine, version } = JSON.parse(body || '{}');
                switchDatabase(engine, version);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, database: config.database }));
            });
            return;
        }

        if (pathname === '/api/start-all' && req.method === 'POST') {
            startAll();
            res.writeHead(200);
            return res.end(JSON.stringify({ success: true }));
        }

        if (pathname === '/api/stop-all' && req.method === 'POST') {
            stopAll();
            res.writeHead(200);
            return res.end(JSON.stringify({ success: true }));
        }

        if ((pathname === '/api/shutdown' || pathname === '/api/exit') && req.method === 'POST') {
            broadcastLog('system', '🛑 시스템 종료 요청을 수신했습니다. 모든 서비스를 정지하고 데몬을 종료합니다.');
            stopAll();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'ToggleAMP 데몬 및 모든 서비스가 안전하게 종료되었습니다.' }));
            setTimeout(() => {
                try {
                    process.exit(0);
                } catch {}
            }, 600);
            return;
        }

        // Sites
        if (pathname === '/api/sites' && req.method === 'GET') {
            const sites = scanSites();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(sites));
        }

        if (pathname === '/api/sites/create' && req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const { name, template } = JSON.parse(body || '{}');
                if (!name) { res.writeHead(400); return res.end('Name required'); }
                const siteDir = path.join(WWW_DIR, name);
                if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

                if (template === 'php') {
                    fs.writeFileSync(path.join(siteDir, 'index.php'), `<?php phpinfo(); ?>\n`);
                } else if (template === 'laravel') {
                    const pub = path.join(siteDir, 'public');
                    if (!fs.existsSync(pub)) fs.mkdirSync(pub, { recursive: true });
                    fs.writeFileSync(path.join(pub, 'index.php'), `<h1>Laravel site scaffold</h1><p>Active PHP: <?php echo phpversion(); ?></p>\n`);
                } else {
                    fs.writeFileSync(path.join(siteDir, 'index.html'), `<h1>${name}</h1>\n`);
                }

                const sites = generateVHosts();
                syncHostsFile(sites.map(s => s.domain));
                reloadWebServer();
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }

        if ((pathname === '/api/sites/delete' || pathname === '/api/vhosts/delete') && req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                try {
                    const { name } = JSON.parse(body || '{}');
                    if (!name) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: '삭제할 가상 호스트(프로젝트) 이름을 지정해 주세요.' }));
                    }

                    const safeName = path.basename(name.trim());
                    if (!safeName || safeName === '.' || safeName === '..' || safeName.toLowerCase() === 'default') {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: '기본 시스템 루트 디렉터리(default) 또는 잘못된 경로는 삭제할 수 없습니다.' }));
                    }

                    const targetDir = path.join(WWW_DIR, safeName);
                    if (!fs.existsSync(targetDir)) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: `폴더를 찾을 수 없습니다: www/${safeName}` }));
                    }

                    // 1. Permanently remove project directory and all files within
                    fs.rmSync(targetDir, { recursive: true, force: true });

                    // 2. Remove vhost config files, SSL certs, and logs
                    const domain = `${safeName}.test`;
                    const nginxConf = path.join(CONFIG_DIR, 'nginx', 'vhosts', `${domain}.conf`);
                    const apacheConf = path.join(CONFIG_DIR, 'apache', 'vhosts', `${domain}.conf`);
                    const sslCrt = path.join(DATA_DIR, 'ssl', `${domain}.crt`);
                    const sslKey = path.join(DATA_DIR, 'ssl', `${domain}.key`);
                    const nginxLog = path.join(LOGS_DIR, 'nginx', `${safeName}-access.log`);
                    const nginxErrLog = path.join(LOGS_DIR, 'nginx', `${safeName}-error.log`);
                    const apacheLog = path.join(LOGS_DIR, 'apache', `${safeName}-access.log`);
                    const apacheErrLog = path.join(LOGS_DIR, 'apache', `${safeName}-error.log`);

                    [nginxConf, apacheConf, sslCrt, sslKey, nginxLog, nginxErrLog, apacheLog, apacheErrLog].forEach(f => {
                        if (fs.existsSync(f)) {
                            try { fs.unlinkSync(f); } catch {}
                        }
                    });

                    // 3. Regenerate VHosts and reload Web Server
                    const sites = generateVHosts();
                    syncHostsFile(sites.map(s => s.domain));
                    reloadWebServer();

                    broadcastLog('vhost', `🗑️ 가상 호스트 '${domain}' 및 프로젝트 폴더(www/${safeName}) 내 모든 파일이 영구 삭제되었습니다.`);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true, message: `가상 호스트 '${domain}' 및 모든 파일이 삭제되었습니다.` }));
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        if (pathname === '/api/vhosts/sync' && req.method === 'POST') {
            const sites = generateVHosts();
            syncHostsFile(sites.map(s => s.domain));
            reloadWebServer();
            res.writeHead(200);
            return res.end(JSON.stringify({ success: true, count: sites.length }));
        }

        if (pathname === '/api/sites/open-folder' && req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const { path: rel } = JSON.parse(body || '{}');
                const target = path.join(ROOT_DIR, rel || 'www');
                exec(`explorer.exe "${target}"`);
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));
            });
            return;
        }

        if (pathname === '/api/logs/open-folder' && req.method === 'POST') {
            const target = path.join(LOGS_DIR, 'activity');
            if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
            exec(`explorer.exe "${target}"`);
            res.writeHead(200);
            return res.end(JSON.stringify({ success: true }));
        }

        // Packages
        if (pathname === '/api/packages' && req.method === 'GET') {
            const enriched = {};
            Object.entries(PACKAGES).forEach(([k, p]) => {
                const installed = isPackageInstalled(k, p);
                let isActive = false;
                if (p.category === 'webserver') {
                    isActive = config.webserver.active === (k === 'apache' ? 'apache' : 'nginx');
                } else if (p.category === 'php') {
                    const v = k.replace('php-', '');
                    isActive = config.php.active_version === v;
                } else if (p.category === 'database') {
                    const parts = k.split('-');
                    isActive = config.database.engine === parts[0] && config.database.active_version === parts[1];
                }
                enriched[k] = {
                    ...p,
                    installed,
                    isActive
                };
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(enriched));
        }

        if (pathname === '/api/packages/install' && req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const { key, autoActivate } = JSON.parse(body || '{}');
                downloadPackage(key, () => {
                    if (autoActivate) {
                        const pkg = PACKAGES[key];
                        if (pkg.category === 'webserver') switchWebServer(pkg.name.toLowerCase().includes('apache') ? 'apache' : 'nginx');
                        if (pkg.category === 'php') switchPhpVersion(pkg.name.replace('PHP ', ''));
                        if (pkg.category === 'database') {
                            const parts = key.split('-');
                            switchDatabase(parts[0], parts[1]);
                        }
                    }
                });
                res.writeHead(202);
                res.end(JSON.stringify({ accepted: true }));
            });
            return;
        }

        if (pathname === '/api/packages/uninstall' && req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const { key } = JSON.parse(body || '{}');
                const pkg = PACKAGES[key];
                if (!pkg) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: '존재하지 않는 패키지입니다.' }));
                }

                // Protected Core Legacy Packages: PHP 5.2.9 and MySQL 5.1.33 cannot be deleted
                if (key === 'php-5.2' || key === 'mysql-5.1') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'PHP 5.2.9 및 MySQL 5.1.33은 ToggleAMP 필수 레거시 기본 패키지이므로 삭제할 수 없습니다.' }));
                }

                // Check if currently active
                let isActive = false;
                if (pkg.category === 'webserver') {
                    isActive = config.webserver.active === (key === 'apache' ? 'apache' : 'nginx');
                } else if (pkg.category === 'php') {
                    const v = key.replace('php-', '');
                    isActive = config.php.active_version === v;
                } else if (pkg.category === 'database') {
                    const parts = key.split('-');
                    isActive = config.database.engine === parts[0] && config.database.active_version === parts[1];
                }

                if (isActive) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: '현재 활성화되어 사용 중인 패키지는 삭제할 수 없습니다. 다른 버전으로 변경 후 삭제해 주세요.' }));
                }

                try {
                    if (fs.existsSync(pkg.dest)) {
                        if (pkg.type === 'file') {
                            fs.unlinkSync(pkg.dest);
                        } else {
                            fs.rmSync(pkg.dest, { recursive: true, force: true });
                        }
                        broadcastLog('system', `🗑️ [Package Manager] Uninstalled ${pkg.name} v${pkg.version}`);
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }

        // Config Editor APIs
        if (pathname === '/api/config/files' && req.method === 'GET') {
            const installedPhp = getInstalledPhpVersions();
            const installedDb = getInstalledDbVersions();

            const files = {
                php: {
                    active: config.php.active_version,
                    versions: installedPhp,
                    files: installedPhp.map(v => ({
                        version: v,
                        title: `PHP ${v}`,
                        fileName: `php-${v}.ini`,
                        path: path.join(CONFIG_DIR, 'php', `php-${v}.ini`),
                        isActive: v === config.php.active_version
                    }))
                },
                database: {
                    active: `${config.database.engine}-${config.database.active_version}`,
                    engines: installedDb.map(d => ({
                        engine: d.engine,
                        version: d.version,
                        key: d.key,
                        title: `${d.engine.toUpperCase()} ${d.version}`,
                        fileName: `my-${d.key}.ini`,
                        path: path.join(CONFIG_DIR, 'mysql', `my-${d.key}.ini`),
                        isActive: d.engine === config.database.engine && d.version === config.database.active_version
                    }))
                },
                webserver: {
                    active: config.webserver.active,
                    servers: [
                        { server: 'nginx', title: 'Nginx', fileName: 'nginx.conf', path: path.join(CONFIG_DIR, 'nginx', 'nginx.conf'), isActive: config.webserver.active === 'nginx' },
                        { server: 'apache', title: 'Apache', fileName: 'httpd.conf', path: path.join(CONFIG_DIR, 'apache', 'httpd.conf'), isActive: config.webserver.active === 'apache' }
                    ]
                },
                ToggleAMP: {
                    title: 'ToggleAMP Settings',
                    fileName: 'ToggleAMP.json',
                    path: path.join(CONFIG_DIR, 'ToggleAMP.json')
                }
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(files));
        }

        if (pathname === '/api/config/read' && req.method === 'GET') {
            const type = url.searchParams.get('type') || 'php';
            const version = url.searchParams.get('version');
            const engine = url.searchParams.get('engine');
            const server = url.searchParams.get('server');

            let targetPath = '';
            if (type === 'php') {
                const ver = version || config.php.active_version;
                targetPath = path.join(CONFIG_DIR, 'php', `php-${ver}.ini`);
                if (!fs.existsSync(targetPath)) generatePhpIni(ver);
            } else if (type === 'mysql' || type === 'database' || type === 'postgresql') {
                const eng = engine || config.database.engine;
                const ver = version || config.database.active_version;
                const isPg = eng === 'postgresql' || eng === 'postgres';
                targetPath = isPg
                    ? path.join(CONFIG_DIR, 'postgresql', `postgresql-${ver}.conf`)
                    : path.join(CONFIG_DIR, 'mysql', `my-${eng}-${ver}.ini`);
                if (!fs.existsSync(targetPath)) generateDbIni(eng, ver);
            } else if (type === 'nginx' || (type === 'webserver' && (server === 'nginx' || (!server && config.webserver.active === 'nginx')))) {
                targetPath = path.join(CONFIG_DIR, 'nginx', 'nginx.conf');
            } else if (type === 'apache' || (type === 'webserver' && (server === 'apache' || (!server && config.webserver.active === 'apache')))) {
                targetPath = path.join(CONFIG_DIR, 'apache', 'httpd.conf');
            } else if (type === 'ToggleAMP' || type === 'end-server' || type === 'nobreak') {
                targetPath = path.join(CONFIG_DIR, 'ToggleAMP.json');
                if (!fs.existsSync(targetPath)) targetPath = path.join(CONFIG_DIR, 'end-server.json');
                if (!fs.existsSync(targetPath)) targetPath = path.join(CONFIG_DIR, 'nobreak.json');
            }

            if (!fs.existsSync(targetPath)) {
                generateConfigs();
            }

            let content = '';
            try {
                content = fs.readFileSync(targetPath, 'utf8');
            } catch (err) {
                content = `; Error reading file: ${err.message}`;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                type,
                version,
                engine,
                server,
                path: targetPath,
                relPath: path.relative(ROOT_DIR, targetPath).replace(/\\/g, '/'),
                content
            }));
        }

        if (pathname === '/api/config/save' && req.method === 'POST') {
            let body = '';
            req.on('data', c => body += c);
            req.on('end', () => {
                const { type, version, engine, server, content } = JSON.parse(body || '{}');
                let targetPath = '';
                let isCurrentActive = false;

                if (type === 'php') {
                    const ver = version || config.php.active_version;
                    targetPath = path.join(CONFIG_DIR, 'php', `php-${ver}.ini`);
                    isCurrentActive = (ver === config.php.active_version);
                } else if (type === 'mysql' || type === 'database' || type === 'postgresql') {
                    const eng = engine || config.database.engine;
                    const ver = version || config.database.active_version;
                    const isPg = eng === 'postgresql' || eng === 'postgres';
                    targetPath = isPg
                        ? path.join(CONFIG_DIR, 'postgresql', `postgresql-${ver}.conf`)
                        : path.join(CONFIG_DIR, 'mysql', `my-${eng}-${ver}.ini`);
                    isCurrentActive = (eng === config.database.engine && ver === config.database.active_version);
                } else if (type === 'nginx' || (type === 'webserver' && server === 'nginx')) {
                    targetPath = path.join(CONFIG_DIR, 'nginx', 'nginx.conf');
                    isCurrentActive = (config.webserver.active === 'nginx');
                } else if (type === 'apache' || (type === 'webserver' && server === 'apache')) {
                    targetPath = path.join(CONFIG_DIR, 'apache', 'httpd.conf');
                    isCurrentActive = (config.webserver.active === 'apache');
                } else if (type === 'ToggleAMP' || type === 'end-server' || type === 'nobreak') {
                    targetPath = path.join(CONFIG_DIR, 'ToggleAMP.json');
                }

                if (!targetPath) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: 'Invalid config target' }));
                }

                try {
                    fs.writeFileSync(targetPath, content, 'utf8');
                    broadcastLog('system', `Updated configuration file: ${path.basename(targetPath)}`);

                    // Mirror to active php.ini, my.ini, or postgresql.conf if applicable
                    if (type === 'php') {
                        const targetPhpDir = path.join(BIN_DIR, 'php', `php-${version || config.php.active_version}`);
                        if (fs.existsSync(targetPhpDir)) {
                            try { fs.writeFileSync(path.join(targetPhpDir, 'php.ini'), content, 'utf8'); } catch {}
                        }

                        if (isCurrentActive) {
                            fs.writeFileSync(path.join(CONFIG_DIR, 'php', 'php.ini'), content, 'utf8');
                            if (services.php.state === 'running') {
                                stopService('php');
                                setTimeout(() => {
                                    startService('php');
                                    reloadWebServer();
                                }, 300);
                            } else {
                                reloadWebServer();
                            }
                        }
                    } else if ((type === 'mysql' || type === 'database') && isCurrentActive) {
                        fs.writeFileSync(path.join(CONFIG_DIR, 'mysql', 'my.ini'), content, 'utf8');
                        if (services.database.state === 'running') {
                            stopService('database');
                            setTimeout(() => startService('database'), 500);
                        }
                    } else if (isCurrentActive && (type === 'nginx' || type === 'apache' || type === 'webserver')) {
                        reloadWebServer();
                    } else if (type === 'ToggleAMP' || type === 'nobreak' || type === 'end-server') {
                        try {
                            const parsed = JSON.parse(content);
                            config = { ...config, ...parsed };
                        } catch {}
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: isCurrentActive
                            ? 'Configuration saved and applied to active service.'
                            : 'Configuration saved for selected version.'
                    }));
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message }));
                }
            });
            return;
        }

        // Static Frontend
        let filePath = path.join(WEB_DIR, pathname === '/' ? 'index.html' : pathname);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const mimeMap = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.lang': 'application/json; charset=utf-8',
                '.png': 'image/png',
                '.ico': 'image/x-icon'
            };
            res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'text/plain' });
            return fs.createReadStream(filePath).pipe(res);
        }

        res.writeHead(404);
        res.end('Not Found');
    });

    // Auto-reclaim port if held by previous instance
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`\x1b[33m⚠️ Port ${config.app_port} is already in use by a previous instance. Auto-reclaiming port...\x1b[0m`);
            freePort(config.app_port);
            setTimeout(() => {
                try {
                    server.listen(config.app_port, '127.0.0.1', () => printBanner());
                } catch (retryErr) {
                    console.error(`\x1b[31m[ERROR] Could not bind to port ${config.app_port}: ${retryErr.message}\x1b[0m`);
                }
            }, 600);
            return;
        }
        console.error(`\x1b[31m[Server Error] ${err.message}\x1b[0m`);
    });

    function printBanner() {
        const vInfo = getVersionInfo();
        console.log(`\n\x1b[36m========================================================\x1b[0m`);
        console.log(` \x1b[1m\x1b[32mToggleAMP\x1b[0m \x1b[33mv${vInfo.version}\x1b[0m — Modern Local Development Environment`);
        if (vInfo.isMismatch) {
            console.log(` \x1b[41m\x1b[37m ⚠️ VERSION MISMATCH: Code (v${vInfo.codeVersion}) != VERSION.txt (v${vInfo.fileVersion}) \x1b[0m`);
        }
        console.log(` 🌐 Dashboard: \x1b[33mhttp://localhost:${config.app_port}\x1b[0m`);
        console.log(` 🚀 Active Web Server: \x1b[35m${config.webserver.active.toUpperCase()}\x1b[0m`);
        console.log(` 🐘 Active PHP: \x1b[34mPHP ${config.php.active_version}\x1b[0m`);
        console.log(` 🗄️ Active Database: \x1b[36m${config.database.engine.toUpperCase()} ${config.database.active_version}\x1b[0m`);
        console.log(` ⚡ Redis Server: \x1b[31mPort ${config.redis.port || 6379}\x1b[0m`);
        console.log(` 📬 Mailpit Webmail: \x1b[33mhttp://localhost:${config.mailpit.web_port || 8025}\x1b[0m`);
        console.log(`\x1b[36m--------------------------------------------------------\x1b[0m`);
        console.log(` \x1b[90m[Live Activity Logs Stream - Press Ctrl+C to Stop]\x1b[0m`);
        console.log(`\x1b[36m========================================================\x1b[0m\n`);
    }

    try {
        server.listen(config.app_port, '127.0.0.1', () => printBanner());
    } catch (e) {
        if (e.code === 'EADDRINUSE') {
            freePort(config.app_port);
            setTimeout(() => {
                server.listen(config.app_port, '127.0.0.1', () => printBanner());
            }, 600);
        }
    }
}

function freePort(port) {
    try {
        const out = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: 'utf8' });
        const lines = out.split(/\r?\n/).filter(l => l.includes('LISTENING') || l.includes('ESTABLISHED'));
        const pids = new Set();
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && /^\d+$/.test(pid) && parseInt(pid, 10) !== process.pid) {
                pids.add(pid);
            }
        }
        pids.forEach(pid => {
            try { execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' }); } catch {}
        });
    } catch {}
}

// Clean graceful shutdown on Ctrl+C or terminal close
let isShuttingDownProcess = false;
function handleProcessShutdown() {
    if (isShuttingDownProcess) return;
    isShuttingDownProcess = true;
    console.log('\n\x1b[33m🛑 Shutting down all ToggleAMP services...\x1b[0m');
    try { stopAll(); } catch {}
    console.log('\x1b[32m✔ All services stopped. Goodbye!\x1b[0m');
    process.exit(0);
}

process.on('SIGINT', handleProcessShutdown);
process.on('SIGTERM', handleProcessShutdown);

process.on('uncaughtException', (err) => {
    console.error('\n\x1b[31m========================================================\x1b[0m');
    console.error('\x1b[31m[CRITICAL ERROR] Uncaught Exception:\x1b[0m', err && err.stack ? err.stack : err);
    console.error('\x1b[31m========================================================\x1b[0m\n');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n\x1b[31m========================================================\x1b[0m');
    console.error('\x1b[31m[CRITICAL ERROR] Unhandled Promise Rejection:\x1b[0m', reason);
    console.error('\x1b[31m========================================================\x1b[0m\n');
});

// CLI Dispatcher
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'gui';

    switch (command) {
        case '-v':
        case '--version':
        case 'version':
            const vCmd = getVersionInfo();
            if (vCmd.isMismatch) {
                console.log(`ToggleAMP v${vCmd.version} (\x1b[31m⚠️ MISMATCH: code v${vCmd.codeVersion} vs txt v${vCmd.fileVersion}\x1b[0m)`);
            } else {
                console.log(`ToggleAMP v${vCmd.version}`);
            }
            break;

        case 'gui':
        case 'start-dashboard':
            generateConfigs();
            generateVHosts();
            startDashboardServer();
            if (config.auto_start || args.includes('--start-all')) {
                startAll();
            } else {
                const vGui = getVersionInfo();
                const warnSuffix = vGui.isMismatch ? ` [⚠️ Version Mismatch: Code v${vGui.codeVersion} != TXT v${vGui.fileVersion}]` : '';
                broadcastLog('system', `Daemon started (v${vGui.version}${warnSuffix}). All services are currently stopped. Click "Start All" or start individual services.`);
            }
            if (!args.includes('--no-open')) {
                exec(`cmd.exe /c start "" "http://localhost:${config.app_port}"`);
            }
            break;

        case 'start':
            startAll();
            console.log('All services started.');
            break;

        case 'stop':
        case 'shutdown':
        case 'exit':
            console.log('Stopping all services and shutting down ToggleAMP daemon...');
            try {
                const req = http.request({ hostname: '127.0.0.1', port: config.app_port, path: '/api/shutdown', method: 'POST' });
                req.on('error', () => {});
                req.end();
            } catch {}
            stopAll();
            console.log('\x1b[32m✔ All services stopped and ToggleAMP daemon exited.\x1b[0m');
            break;

        case 'status':
            const vStat = getVersionInfo();
            const statTitle = vStat.isMismatch
                ? `\n[ToggleAMP v${vStat.version} - \x1b[31m⚠️ VERSION MISMATCH: Code v${vStat.codeVersion} vs TXT v${vStat.fileVersion}\x1b[0m] Service Status:`
                : `\n[ToggleAMP v${vStat.version}] Service Status:`;
            console.log(statTitle);
            console.log(`SERVICE     ACTIVE / VERSION        PORT   STATE`);
            console.log(`-------     ----------------        ----   -----`);
            console.log(`webserver   ${config.webserver.active.toUpperCase().padEnd(23)} ${String(config.webserver.port).padEnd(6)} ${services.webserver.state}`);
            console.log(`php         PHP ${(config.php.active_version || '').padEnd(19)} ${String(config.php.port).padEnd(6)} ${services.php.state}`);
            console.log(`database    ${(config.database.engine.toUpperCase() + ' ' + config.database.active_version).padEnd(23)} ${String(config.database.port).padEnd(6)} ${services.database.state}`);
            console.log(`redis       ${(config.redis.version || '').padEnd(23)} ${String(config.redis.port).padEnd(6)} ${services.redis.state}`);
            console.log(`mailpit     ${('Webmail').padEnd(23)} ${String(config.mailpit.web_port).padEnd(6)} ${services.mailpit.state}`);
            console.log();
            break;

        case 'webserver':
            if (args[1] === 'switch' && args[2]) {
                switchWebServer(args[2].toLowerCase());
                console.log(`Switched active web server to ${args[2].toUpperCase()}`);
            } else {
                console.log(`Active Web Server: ${config.webserver.active.toUpperCase()}`);
                console.log(`Options: nginx, apache`);
                console.log(`Usage: ToggleAMP webserver switch <nginx|apache>`);
            }
            break;

        case 'php':
            if (args[1] === 'use' || args[1] === 'switch') {
                const ver = args[2];
                if (!ver) { console.log('Version required: e.g. ToggleAMP php use 8.2'); break; }
                switchPhpVersion(ver);
                console.log(`Switched active PHP to PHP ${ver}`);
            } else {
                console.log(`Active PHP: PHP ${config.php.active_version}`);
                console.log(`Installed versions: ${getInstalledPhpVersions().join(', ')}`);
                console.log(`Usage: ToggleAMP php use <version> (e.g. 8.3, 8.2, 8.1, 7.4)`);
            }
            break;

        case 'db':
            if (args[1] === 'switch' && args[2] && args[3]) {
                switchDatabase(args[2].toLowerCase(), args[3]);
                console.log(`Switched active database to ${args[2].toUpperCase()} ${args[3]}`);
            } else {
                console.log(`Active Database: ${config.database.engine.toUpperCase()} ${config.database.active_version}`);
                console.log(`Usage: ToggleAMP db switch <mariadb|mysql|postgresql> <version>`);
            }
            break;

        case 'site':
            if (args[1] === 'create' && args[2]) {
                const sName = args[2].toLowerCase();
                const siteDir = path.join(WWW_DIR, sName);
                if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });
                fs.writeFileSync(path.join(siteDir, 'index.php'), `<?php phpinfo(); ?>\n`);
                const sites = generateVHosts();
                syncHostsFile(sites.map(s => s.domain));
                reloadWebServer();
                console.log(`Site created: http://${sName}.${config.domain_suffix} (Folder: www/${sName})`);
            } else {
                console.log(`Usage: ToggleAMP site create <sitename>`);
            }
            break;

        case 'vhost':
        case 'sync':
            const sites = generateVHosts();
            syncHostsFile(sites.map(s => s.domain));
            reloadWebServer();
            console.log(`Synchronized ${sites.length} virtual hosts.`);
            break;

        case 'pkg':
            if (args[1] === 'list' || !args[1]) {
                console.log(`\nPACKAGE         CATEGORY     VERSION   TARGET`);
                console.log(`-------         --------     -------   ------`);
                Object.entries(PACKAGES).forEach(([k, p]) => {
                    console.log(`${k.padEnd(15)} ${p.category.padEnd(12)} ${p.version.padEnd(9)} ${path.relative(ROOT_DIR, p.dest)}`);
                });
                console.log();
            } else if (args[1] === 'install' && args[2]) {
                downloadPackage(args[2], () => {
                    console.log(`\x1b[32mDone.\x1b[0m`);
                });
            }
            break;

        case 'terminal':
            const phpDir = getActivePhpDir();
            const dbDir = getActiveDbDir();
            const binDirs = [
                phpDir,
                path.join(BIN_DIR, 'nginx'),
                path.join(BIN_DIR, 'apache', 'bin'),
                path.join(dbDir, 'bin'),
                path.join(BIN_DIR, 'mailpit')
            ].filter(d => fs.existsSync(d));
            const extraPath = binDirs.join(';') + ';';
            try {
                spawnSync('powershell.exe', ['-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', `$env:Path = "${extraPath}" + $env:Path; Write-Host "=== ToggleAMP Development Environment Active ===" -ForegroundColor Cyan; Write-Host "Active PHP: ${config.php.active_version} | Active Web Server: ${config.webserver.active} | Active DB: ${config.database.engine}" -ForegroundColor Yellow`], {
                    stdio: 'inherit'
                });
            } catch (err) {
                spawnSync('cmd.exe', ['/k', `set PATH=${extraPath}%PATH% && echo === ToggleAMP Development Environment Active ===`], {
                    stdio: 'inherit'
                });
            }
            break;

        case 'logs':
        case 'log':
            console.log('\x1b[36m======================================================================\x1b[0m');
            console.log('\x1b[36m  ⚡ ToggleAMP 실시간 활동 및 로그 스트림 (Real-Time Activity Logs)\x1b[0m');
            console.log('  로그 파일: logs/activity.log | 종료하려면 Ctrl+C 를 누르세요.');
            console.log('\x1b[36m======================================================================\x1b[0m\n');
            const actLog = path.join(LOGS_DIR, 'activity.log');
            if (fs.existsSync(actLog)) {
                const stat = fs.statSync(actLog);
                const readSize = Math.min(stat.size, 15000);
                const fd = fs.openSync(actLog, 'r');
                const buf = Buffer.alloc(readSize);
                fs.readSync(fd, buf, 0, readSize, Math.max(0, stat.size - readSize));
                fs.closeSync(fd);
                const lines = buf.toString('utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
                lines.slice(-30).forEach(l => {
                    const m = l.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/);
                    if (m) {
                        let col = '\x1b[36m';
                        if (m[2] === 'system') col = '\x1b[34m';
                        else if (m[2] === 'webserver') col = '\x1b[35m';
                        else if (m[2] === 'php') col = '\x1b[33m';
                        else if (m[2] === 'database') col = '\x1b[32m';
                        else if (m[2].includes('error')) col = '\x1b[31m';
                        console.log(`\x1b[90m[${m[1]}]\x1b[0m [${col}${m[2]}\x1b[0m] ${m[3]}`);
                    } else {
                        console.log(l);
                    }
                });
            }
            let tailPos = fs.existsSync(actLog) ? fs.statSync(actLog).size : 0;
            setInterval(() => {
                try {
                    if (!fs.existsSync(actLog)) return;
                    const stat = fs.statSync(actLog);
                    if (stat.size > tailPos) {
                        const fd = fs.openSync(actLog, 'r');
                        const toRead = stat.size - tailPos;
                        const buf = Buffer.alloc(toRead);
                        fs.readSync(fd, buf, 0, toRead, tailPos);
                        fs.closeSync(fd);
                        tailPos = stat.size;
                        const lines = buf.toString('utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
                        lines.forEach(l => {
                            const m = l.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/);
                            if (m) {
                                let col = '\x1b[36m';
                                if (m[2] === 'system') col = '\x1b[34m';
                                else if (m[2] === 'webserver') col = '\x1b[35m';
                                else if (m[2] === 'php') col = '\x1b[33m';
                                else if (m[2] === 'database') col = '\x1b[32m';
                                else if (m[2].includes('error')) col = '\x1b[31m';
                                console.log(`\x1b[90m[${m[1]}]\x1b[0m [${col}${m[2]}\x1b[0m] ${m[3]}`);
                            } else {
                                console.log(l);
                            }
                        });
                    }
                } catch {}
            }, 500);
            break;

        case 'version':
            console.log(`ToggleAMP v${getVersion()}`);
            break;

        default:
            console.log(`Usage: ToggleAMP [gui|status|logs|webserver|php|db|site|vhost|pkg|terminal|version]`);
            break;
    }
}

module.exports = {
    CODE_VERSION,
    getVersionInfo,
    getVersion,
    generateConfigs,
    generatePhpIni,
    generateDbIni,
    generateVHosts,
    scanSites,
    startService,
    stopService,
    switchWebServer,
    switchPhpVersion,
    switchDatabase,
    downloadPackage,
    getActivePhpDir,
    getActiveDbDir
};
