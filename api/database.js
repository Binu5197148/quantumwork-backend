const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// No Render, usar /tmp que é writable, ou apenas memória
const DB_PATH = process.env.DB_PATH || '/tmp/quantumwork.db';

let db;
let SQL;
let isInitialized = false;

// Schema SQL inline (para garantir que existe)
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    location TEXT,
    linkedin TEXT,
    portfolio TEXT,
    experience_level TEXT,
    current_role TEXT,
    skills TEXT,
    desired_roles TEXT,
    salary_expectation TEXT,
    availability TEXT,
    english_level TEXT,
    remote_experience INTEGER DEFAULT 0,
    bio TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    salary TEXT,
    location TEXT,
    type TEXT,
    source TEXT,
    source_url TEXT,
    skills_required TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER,
    job_id INTEGER,
    score REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);
`;

// Inicializar SQL.js
async function initDatabase() {
    if (isInitialized && db) return;
    
    try {
        console.log('🔄 Inicializando banco de dados...');
        
        SQL = await initSqlJs();
        console.log('✅ SQL.js carregado');
        
        // Tentar carregar do disco primeiro
        let loadedFromDisk = false;
        if (fs.existsSync(DB_PATH)) {
            try {
                const filebuffer = fs.readFileSync(DB_PATH);
                db = new SQL.Database(filebuffer);
                console.log('✅ Banco carregado de:', DB_PATH);
                loadedFromDisk = true;
            } catch (e) {
                console.log('⚠️ Não foi possível carregar do disco, criando novo');
            }
        }
        
        // Se não carregou do disco, criar novo
        if (!loadedFromDisk) {
            db = new SQL.Database();
            console.log('✅ Novo banco criado na memória');
            
            // Executar schema
            try {
                db.exec(SCHEMA_SQL);
                console.log('✅ Schema criado');
                saveDatabase();
            } catch (err) {
                console.error('❌ Erro ao criar schema:', err.message);
            }
        }
        
        isInitialized = true;
        console.log('✅ Banco de dados pronto!');
    } catch (err) {
        console.error('❌ Erro fatal ao inicializar banco:', err.message);
        // Criar banco em memória como fallback
        try {
            db = new SQL.Database();
            db.exec(SCHEMA_SQL);
            isInitialized = true;
            console.log('✅ Banco em memória criado (fallback)');
        } catch (e) {
            console.error('❌ Falha total:', e.message);
            throw e;
        }
    }
}

// Salvar banco em disco (best effort)
function saveDatabase() {
    if (!db) return;
    
    try {
        const dataDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const data = db.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
        console.log('💾 Banco salvo em:', DB_PATH);
    } catch (err) {
        console.log('⚠️ Não foi possível salvar no disco (modo memória):', err.message);
    }
}

// Funções de query
async function ensureInitialized() {
    if (!isInitialized || !db) {
        await initDatabase();
    }
}

async function run(sql, params = []) {
    await ensureInitialized();
    
    try {
        const stmt = db.prepare(sql);
        const result = stmt.run(params);
        saveDatabase();
        return { id: result.lastInsertRowid, changes: result.changes };
    } catch (err) {
        console.error('❌ Erro na query run:', err.message);
        throw err;
    }
}

async function get(sql, params = []) {
    await ensureInitialized();
    
    try {
        const stmt = db.prepare(sql);
        const result = stmt.get(params);
        return result;
    } catch (err) {
        console.error('❌ Erro na query get:', err.message);
        throw err;
    }
}

async function all(sql, params = []) {
    await ensureInitialized();
    
    try {
        const stmt = db.prepare(sql);
        const results = stmt.all(params);
        return results;
    } catch (err) {
        console.error('❌ Erro na query all:', err.message);
        throw err;
    }
}

module.exports = {
    db: { run, get, all },
    initDatabase,
    run,
    get,
    all
};