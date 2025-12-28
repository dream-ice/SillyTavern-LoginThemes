/**
 * SillyTavern Login Theme Manager
 * 
 * A server plugin that allows users to manage and switch login page themes.
 * Authors can share CSS theme files, and users can import them easily.
 * 
 * @author SillyTavern Community
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

// Plugin paths - will be set during initialization
let PLUGIN_DIR;
let THEMES_DIR;
let LOGIN_CSS_PATH;
let BACKUP_CSS_PATH;
let CONFIG_PATH;

/**
 * Get default configuration
 */
function getDefaultConfig() {
    return {
        currentTheme: 'default',
        themes: {}
    };
}

/**
 * Load configuration from file
 */
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('[LoginThemes] Error loading config:', error);
    }
    return getDefaultConfig();
}

/**
 * Save configuration to file
 */
function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('[LoginThemes] Error saving config:', error);
        return false;
    }
}

/**
 * Ensure the original login.css is backed up
 */
function ensureBackup() {
    try {
        // 如果备份不存在但原始文件存在，创建备份
        if (!fs.existsSync(BACKUP_CSS_PATH) && fs.existsSync(LOGIN_CSS_PATH)) {
            const originalContent = fs.readFileSync(LOGIN_CSS_PATH, 'utf8');
            fs.writeFileSync(BACKUP_CSS_PATH, originalContent, 'utf8');
            console.log('[LoginThemes] ✅ Created backup of original login.css');
            return true;
        }
        return fs.existsSync(BACKUP_CSS_PATH);
    } catch (error) {
        console.error('[LoginThemes] Error creating backup:', error);
        return false;
    }
}

/**
 * Get the original/default CSS content
 */
function getDefaultCSS() {
    // 首先尝试从备份读取
    if (fs.existsSync(BACKUP_CSS_PATH)) {
        try {
            return fs.readFileSync(BACKUP_CSS_PATH, 'utf8');
        } catch (e) {
            console.error('[LoginThemes] Error reading backup:', e);
        }
    }
    
    // 如果没有备份，返回最小化的默认样式
    return `/* SillyTavern Default Login Theme */
body.login #shadow_popup {
    opacity: 1;
    display: flex;
}

body.login .logo {
    max-width: 30px;
}

body.login #logoBlock {
    align-items: center;
    margin: 0 auto;
    gap: 10px;
}

body.login .userSelect {
    display: flex;
    flex-direction: column;
    color: var(--SmartThemeBodyColor);
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 5px;
    padding: 3px 5px;
    width: 30%;
    cursor: pointer;
    margin: 5px 0;
    transition: background-color var(--animation-duration) ease-in-out;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
}

body.login .userSelect .userName,
body.login .userSelect .userHandle {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

body.login .userSelect:hover {
    background-color: var(--black30a);
}

body.login #handleEntryBlock,
body.login #passwordEntryBlock,
body.login #passwordRecoveryBlock {
    margin: 2px;
}`;
}

/**
 * Get list of available themes
 */
function getThemeList() {
    const config = loadConfig();
    const themes = [];
    
    // Always include default theme first
    themes.push({
        id: 'default',
        name: 'Default (原版)',
        author: 'SillyTavern',
        description: 'SillyTavern 原始登录主题',
        isBuiltIn: true
    });
    
    // Scan themes directory for custom themes
    try {
        if (fs.existsSync(THEMES_DIR)) {
            const files = fs.readdirSync(THEMES_DIR);
            for (const file of files) {
                // Skip backup file and non-CSS files
                if (!file.endsWith('.css') || file.startsWith('_')) {
                    continue;
                }
                
                const themeId = file.replace('.css', '');
                const themePath = path.join(THEMES_DIR, file);
                const metaPath = path.join(THEMES_DIR, `${themeId}.json`);
                
                let meta = {
                    id: themeId,
                    name: themeId,
                    author: 'Unknown',
                    description: '',
                    isBuiltIn: false
                };
                
                // Try to load metadata from JSON file
                if (fs.existsSync(metaPath)) {
                    try {
                        const metaData = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                        meta = { ...meta, ...metaData, id: themeId, isBuiltIn: false };
                    } catch (e) {
                        // Use defaults if meta is invalid
                    }
                }
                
                // Try to extract metadata from CSS comments
                try {
                    const cssContent = fs.readFileSync(themePath, 'utf8');
                    const headerMatch = cssContent.match(/\/\*[\s\S]*?\*\//);
                    if (headerMatch) {
                        const header = headerMatch[0];
                        const nameMatch = header.match(/@name\s+(.+)/i);
                        const authorMatch = header.match(/@author\s+(.+)/i);
                        const descMatch = header.match(/@description\s+(.+)/i);
                        const versionMatch = header.match(/@version\s+(.+)/i);
                        
                        if (nameMatch) meta.name = nameMatch[1].trim();
                        if (authorMatch) meta.author = authorMatch[1].trim();
                        if (descMatch) meta.description = descMatch[1].trim();
                        if (versionMatch) meta.version = versionMatch[1].trim();
                    }
                } catch (e) {
                    // Ignore CSS parsing errors
                }
                
                themes.push(meta);
            }
        }
    } catch (error) {
        console.error('[LoginThemes] Error scanning themes:', error);
    }
    
    return themes;
}

/**
 * Apply a theme by copying its CSS to the login.css file
 */
function applyTheme(themeId) {
    const config = loadConfig();
    
    try {
        let cssContent;
        
        if (themeId === 'default') {
            // Restore default theme from backup
            cssContent = getDefaultCSS();
        } else {
            const themePath = path.join(THEMES_DIR, `${themeId}.css`);
            if (!fs.existsSync(themePath)) {
                return { success: false, error: 'Theme not found: ' + themeId };
            }
            cssContent = fs.readFileSync(themePath, 'utf8');
        }
        
        // Write to login.css
        fs.writeFileSync(LOGIN_CSS_PATH, cssContent, 'utf8');
        
        // Update config
        config.currentTheme = themeId;
        saveConfig(config);
        
        console.log(`[LoginThemes] ✅ Applied theme: ${themeId}`);
        return { success: true, theme: themeId };
    } catch (error) {
        console.error('[LoginThemes] Error applying theme:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Import a new theme from CSS content
 */
function importTheme(name, cssContent, metadata = {}) {
    try {
        // Sanitize name for filename
        const safeId = name.toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5_-]/g, '-')  // 支持中文
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
        
        if (!safeId) {
            return { success: false, error: 'Invalid theme name' };
        }
        
        const themePath = path.join(THEMES_DIR, `${safeId}.css`);
        const metaPath = path.join(THEMES_DIR, `${safeId}.json`);
        
        // Check if theme already exists
        if (fs.existsSync(themePath)) {
            return { success: false, error: 'Theme with this name already exists: ' + safeId };
        }
        
        // Ensure themes directory exists
        if (!fs.existsSync(THEMES_DIR)) {
            fs.mkdirSync(THEMES_DIR, { recursive: true });
        }
        
        // Write CSS file
        fs.writeFileSync(themePath, cssContent, 'utf8');
        
        // Write metadata
        const meta = {
            name: metadata.name || name,
            author: metadata.author || 'Unknown',
            description: metadata.description || '',
            version: metadata.version || '1.0.0',
            importedAt: new Date().toISOString()
        };
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
        
        console.log(`[LoginThemes] ✅ Imported theme: ${safeId}`);
        return { success: true, themeId: safeId };
    } catch (error) {
        console.error('[LoginThemes] Error importing theme:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a theme
 */
function deleteTheme(themeId) {
    if (themeId === 'default') {
        return { success: false, error: 'Cannot delete default theme' };
    }
    
    try {
        const themePath = path.join(THEMES_DIR, `${themeId}.css`);
        const metaPath = path.join(THEMES_DIR, `${themeId}.json`);
        
        if (!fs.existsSync(themePath)) {
            return { success: false, error: 'Theme not found: ' + themeId };
        }
        
        fs.unlinkSync(themePath);
        if (fs.existsSync(metaPath)) {
            fs.unlinkSync(metaPath);
        }
        
        // If this was the active theme, switch to default
        const config = loadConfig();
        if (config.currentTheme === themeId) {
            applyTheme('default');
        }
        
        console.log(`[LoginThemes] ✅ Deleted theme: ${themeId}`);
        return { success: true };
    } catch (error) {
        console.error('[LoginThemes] Error deleting theme:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Export a theme (get its CSS content)
 */
function exportTheme(themeId) {
    try {
        let cssContent;
        
        if (themeId === 'default') {
            cssContent = getDefaultCSS();
        } else {
            const themePath = path.join(THEMES_DIR, `${themeId}.css`);
            if (!fs.existsSync(themePath)) {
                return { success: false, error: 'Theme not found: ' + themeId };
            }
            cssContent = fs.readFileSync(themePath, 'utf8');
        }
        
        const themes = getThemeList();
        const themeMeta = themes.find(t => t.id === themeId) || { name: themeId };
        
        return { 
            success: true, 
            css: cssContent,
            meta: themeMeta
        };
    } catch (error) {
        console.error('[LoginThemes] Error exporting theme:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Initialize the plugin
 */
async function init(router) {
    // Determine paths based on SillyTavern structure
    PLUGIN_DIR = __dirname;
    const stRoot = path.resolve(PLUGIN_DIR, '../..');
    
    THEMES_DIR = path.join(PLUGIN_DIR, 'themes');
    LOGIN_CSS_PATH = path.join(stRoot, 'public', 'css', 'login.css');
    BACKUP_CSS_PATH = path.join(THEMES_DIR, '_original_backup.css');
    CONFIG_PATH = path.join(PLUGIN_DIR, 'config.json');
    
    console.log('[LoginThemes] 🎨 Initializing Login Theme Manager...');
    console.log(`[LoginThemes] Plugin directory: ${PLUGIN_DIR}`);
    console.log(`[LoginThemes] Themes directory: ${THEMES_DIR}`);
    console.log(`[LoginThemes] Login CSS path: ${LOGIN_CSS_PATH}`);
    
    // Ensure themes directory exists
    if (!fs.existsSync(THEMES_DIR)) {
        fs.mkdirSync(THEMES_DIR, { recursive: true });
        console.log('[LoginThemes] Created themes directory');
    }
    
    // Ensure original login.css is backed up
    ensureBackup();
    
    // === API Routes ===
    
    // GET /list - Get all available themes
    router.get('/list', (req, res) => {
        try {
            const themes = getThemeList();
            const config = loadConfig();
            res.json({
                themes: themes,
                currentTheme: config.currentTheme
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // GET /current - Get current theme info
    router.get('/current', (req, res) => {
        try {
            const config = loadConfig();
            const themes = getThemeList();
            const current = themes.find(t => t.id === config.currentTheme);
            res.json({
                currentTheme: config.currentTheme,
                themeInfo: current || null
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // POST /apply - Apply a theme
    router.post('/apply', (req, res) => {
        try {
            const { themeId } = req.body;
            if (!themeId) {
                return res.status(400).json({ success: false, error: 'themeId is required' });
            }
            const result = applyTheme(themeId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // POST /import - Import a new theme
    router.post('/import', (req, res) => {
        try {
            const { name, css, metadata } = req.body;
            if (!name || !css) {
                return res.status(400).json({ success: false, error: 'name and css are required' });
            }
            const result = importTheme(name, css, metadata || {});
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // POST /update - Update an existing theme
    router.post('/update', (req, res) => {
        try {
            const { themeId, css, metadata } = req.body;
            if (!themeId || !css) {
                return res.status(400).json({ success: false, error: 'themeId and css are required' });
            }
            
            const themePath = path.join(THEMES_DIR, `${themeId}.css`);
            const metaPath = path.join(THEMES_DIR, `${themeId}.json`);
            
            if (!fs.existsSync(themePath)) {
                return res.status(404).json({ success: false, error: 'Theme not found' });
            }
            
            // Write updated CSS
            fs.writeFileSync(themePath, css, 'utf8');
            
            // Update metadata
            if (metadata) {
                let existingMeta = {};
                if (fs.existsSync(metaPath)) {
                    try {
                        existingMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                    } catch (e) {}
                }
                
                const newMeta = {
                    ...existingMeta,
                    author: metadata.author || existingMeta.author || 'Unknown',
                    description: metadata.description || existingMeta.description || '',
                    updatedAt: new Date().toISOString()
                };
                fs.writeFileSync(metaPath, JSON.stringify(newMeta, null, 2), 'utf8');
            }
            
            // If this theme is currently active, re-apply it
            const config = loadConfig();
            if (config.currentTheme === themeId) {
                applyTheme(themeId);
            }
            
            console.log(`[LoginThemes] ✅ Updated theme: ${themeId}`);
            res.json({ success: true, themeId });
        } catch (error) {
            console.error('[LoginThemes] Error updating theme:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // DELETE /delete/:themeId - Delete a theme
    router.delete('/delete/:themeId', (req, res) => {
        try {
            const { themeId } = req.params;
            const result = deleteTheme(themeId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // GET /export/:themeId - Export a theme
    router.get('/export/:themeId', (req, res) => {
        try {
            const { themeId } = req.params;
            const result = exportTheme(themeId);
            if (result.success) {
                res.json(result);
            } else {
                res.status(404).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // GET /preview/:themeId - Get CSS content for preview (returns raw CSS)
    router.get('/preview/:themeId', (req, res) => {
        try {
            const { themeId } = req.params;
            const result = exportTheme(themeId);
            if (result.success) {
                res.type('text/css').send(result.css);
            } else {
                res.status(404).send('/* Theme not found */');
            }
        } catch (error) {
            res.status(500).send('/* Error loading theme */');
        }
    });
    
    console.log('[LoginThemes] ✅ Login Theme Manager loaded!');
    console.log('[LoginThemes] API available at /api/plugins/login-themes/');
    
    return Promise.resolve();
}

/**
 * Cleanup on server shutdown
 */
async function exit() {
    console.log('[LoginThemes] Plugin unloaded');
    return Promise.resolve();
}

module.exports = {
    init,
    exit,
    info: {
        id: 'login-themes',
        name: 'Login Theme Manager',
        description: '🎨 登录页面主题管理器 - 让用户轻松切换和分享登录界面主题'
    }
};
