const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'quantumwork.db');

// Garantir que o diretório data existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Conexão com o banco (síncrona no better-sqlite3)
let db;
try {
    db = new Database(DB_PATH);
    console.log('✅ Conectado ao SQLite em:', DB_PATH);
} catch (err) {
    console.error('❌ Erro ao conectar ao SQLite:', err.message);
    process.exit(1);
}

// Inicializar banco de dados
function initDatabase() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        const statements = schema.split(';').filter(s => s.trim());
        
        statements.forEach(statement => {
            if (statement.trim()) {
                try {
                    db.exec(statement + ';');
                } catch (err) {
                    console.error('❌ Erro ao executar schema:', err.message);
                }
            }
        });
        
        console.log('✅ Banco de dados inicializado!');
    } catch (err) {
        console.error('❌ Erro ao inicializar banco:', err.message);
    }
}

// Funções síncronas do better-sqlite3
function run(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        return { id: result.lastInsertRowid, changes: result.changes };
    } catch (err) {
        throw err;
    }
}

function get(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.get(...params);
    } catch (err) {
        throw err;
    }
}

function all(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.all(...params);
    } catch (err) {
        throw err;
    }
}

module.exports = {
    db,
    initDatabase,
    run,
    get,
    all
};