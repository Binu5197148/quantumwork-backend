const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'quantumwork.db');

let db;
let SQL;

// Inicializar SQL.js
async function initDatabase() {
    try {
        SQL = await initSqlJs();
        
        // Verificar se existe arquivo de banco
        if (fs.existsSync(DB_PATH)) {
            const filebuffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(filebuffer);
            console.log('✅ Banco de dados carregado de:', DB_PATH);
        } else {
            db = new SQL.Database();
            console.log('✅ Novo banco de dados criado');
            
            // Criar schema
            const schemaPath = path.join(__dirname, 'schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                const statements = schema.split(';').filter(s => s.trim());
                
                statements.forEach(statement => {
                    if (statement.trim()) {
                        try {
                            db.run(statement + ';');
                        } catch (err) {
                            console.error('❌ Erro ao executar schema:', err.message);
                        }
                    }
                });
            }
            
            // Salvar banco inicial
            saveDatabase();
        }
        
        console.log('✅ Banco de dados inicializado!');
    } catch (err) {
        console.error('❌ Erro ao inicializar banco:', err.message);
        throw err;
    }
}

// Salvar banco em disco
function saveDatabase() {
    if (!db) return;
    
    try {
        const dataDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const data = db.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (err) {
        console.error('❌ Erro ao salvar banco:', err.message);
    }
}

// Funções de query
function run(sql, params = []) {
    if (!db) throw new Error('Database not initialized');
    
    try {
        const stmt = db.prepare(sql);
        const result = stmt.run(params);
        saveDatabase();
        return { id: result.lastInsertRowid, changes: result.changes };
    } catch (err) {
        throw err;
    }
}

function get(sql, params = []) {
    if (!db) throw new Error('Database not initialized');
    
    try {
        const stmt = db.prepare(sql);
        const result = stmt.get(params);
        return result;
    } catch (err) {
        throw err;
    }
}

function all(sql, params = []) {
    if (!db) throw new Error('Database not initialized');
    
    try {
        const stmt = db.prepare(sql);
        const results = stmt.all(params);
        return results;
    } catch (err) {
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