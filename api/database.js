const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'quantumwork.db');

// Garantir que o diretório data existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Conexão com o banco
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('✅ Conectado ao SQLite em:', DB_PATH);
    }
});

// Inicializar banco de dados
function initDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const statements = schema.split(';').filter(s => s.trim());
    
    db.serialize(() => {
        statements.forEach(statement => {
            if (statement.trim()) {
                db.run(statement + ';', (err) => {
                    if (err) {
                        console.error('❌ Erro ao executar schema:', err.message);
                    }
                });
            }
        });
    });
    
    console.log('✅ Banco de dados inicializado!');
}

// Promisify para usar async/await
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = {
    db,
    initDatabase,
    run,
    get,
    all
};