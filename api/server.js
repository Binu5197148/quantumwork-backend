require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { run, get, all, initDatabase } = require('./database');
const { sendEmail, sendNewsletterToAll } = require('./email');
const { runAllScrapers, saveJobsToDatabase, findMatches } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// ============ CANDIDATES API ============

// Criar candidato
app.post('/api/candidates', async (req, res) => {
    try {
        const {
            full_name, email, phone, location, linkedin, portfolio,
            experience_level, current_role, skills, desired_roles,
            salary_expectation, availability, english_level,
            remote_experience, bio
        } = req.body;

        const skillsJson = JSON.stringify(skills || []);
        const desiredRolesJson = JSON.stringify(desired_roles || []);

        const result = await run(`
            INSERT INTO candidates 
            (full_name, email, phone, location, linkedin, portfolio, 
             experience_level, current_role, skills, desired_roles,
             salary_expectation, availability, english_level, 
             remote_experience, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [full_name, email, phone, location, linkedin, portfolio,
            experience_level, current_role, skillsJson, desiredRolesJson,
            salary_expectation, availability, english_level,
            remote_experience ? 1 : 0, bio]);

        // Enviar email de boas-vindas (não bloqueia o cadastro)
        setImmediate(async () => {
            try {
                await sendEmail(email, 'welcome', { full_name });
                console.log(`✉️ Email de boas-vindas enviado para ${email}`);
            } catch (emailError) {
                console.error('Erro ao enviar email de boas-vindas:', emailError);
            }
        });

        res.status(201).json({ 
            success: true, 
            id: result.id,
            message: 'Candidato cadastrado com sucesso!' 
        });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({ 
                success: false, 
                error: 'Este email já está cadastrado' 
            });
        } else {
            console.error('Erro ao criar candidato:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Erro ao salvar candidato' 
            });
        }
    }
});

// Listar candidatos (com filtros)
app.get('/api/candidates', async (req, res) => {
    try {
        const { status, skill, search, limit = 100 } = req.query;
        let sql = 'SELECT * FROM candidates WHERE 1=1';
        const params = [];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (skill) {
            sql += ' AND skills LIKE ?';
            params.push(`%${skill}%`);
        }

        if (search) {
            sql += ' AND (full_name LIKE ? OR email LIKE ? OR location LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const candidates = await all(sql, params);
        
        // Parse JSON fields
        candidates.forEach(c => {
            try { c.skills = JSON.parse(c.skills); } catch { c.skills = []; }
            try { c.desired_roles = JSON.parse(c.desired_roles); } catch { c.desired_roles = []; }
        });

        res.json({ success: true, count: candidates.length, candidates });
    } catch (error) {
        console.error('Erro ao listar candidatos:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar candidatos' });
    }
});

// Buscar candidato por ID
app.get('/api/candidates/:id', async (req, res) => {
    try {
        const candidate = await get('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidato não encontrado' });
        }
        
        try { candidate.skills = JSON.parse(candidate.skills); } catch { candidate.skills = []; }
        try { candidate.desired_roles = JSON.parse(candidate.desired_roles); } catch { candidate.desired_roles = []; }
        
        res.json({ success: true, candidate });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar candidato' });
    }
});

// Atualizar candidato
app.put('/api/candidates/:id', async (req, res) => {
    try {
        const updates = req.body;
        const fields = [];
        const values = [];

        // Campos permitidos
        const allowedFields = [
            'full_name', 'phone', 'location', 'linkedin', 'portfolio',
            'experience_level', 'current_role', 'skills', 'desired_roles',
            'salary_expectation', 'availability', 'english_level',
            'remote_experience', 'bio', 'status', 'newsletter'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                if (field === 'skills' || field === 'desired_roles') {
                    values.push(JSON.stringify(updates[field]));
                } else {
                    values.push(updates[field]);
                }
            }
        });

        if (fields.length === 0) {
            return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' });
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        const result = await run(
            `UPDATE candidates SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Candidato não encontrado' });
        }

        res.json({ success: true, message: 'Candidato atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar candidato:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar candidato' });
    }
});

// Deletar candidato
app.delete('/api/candidates/:id', async (req, res) => {
    try {
        const result = await run('DELETE FROM candidates WHERE id = ?', [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Candidato não encontrado' });
        }
        res.json({ success: true, message: 'Candidato removido com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao remover candidato' });
    }
});

// ============ EMAIL API ============

// Testar envio de email
app.post('/api/email/test', async (req, res) => {
    try {
        const { to, template = 'welcome' } = req.body;
        
        if (!to) {
            return res.status(400).json({ success: false, error: 'Email destinatário obrigatório' });
        }

        const result = await sendEmail(to, template, { 
            full_name: 'Teste',
            jobsCount: 5,
            jobs: [
                { title: 'Dev Fullstack', company: 'Tech Corp', location: 'Remoto', url: '#' }
            ]
        });

        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Email enviado com sucesso!',
                previewUrl: result.previewUrl 
            });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Erro no teste de email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enviar newsletter (admin only)
app.post('/api/email/newsletter', async (req, res) => {
    try {
        // TODO: Adicionar autenticação
        const result = await sendNewsletterToAll({ all }, req.body.jobs || []);
        res.json(result);
    } catch (error) {
        console.error('Erro ao enviar newsletter:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enviar job match para candidato
app.post('/api/email/job-match', async (req, res) => {
    try {
        const { candidateId, jobData } = req.body;
        
        const candidate = await get('SELECT email, full_name, skills FROM candidates WHERE id = ?', [candidateId]);
        if (!candidate) {
            return res.status(404).json({ success: false, error: 'Candidato não encontrado' });
        }

        const result = await sendEmail(candidate.email, 'jobMatch', {
            candidateName: candidate.full_name,
            ...jobData
        });

        res.json(result);
    } catch (error) {
        console.error('Erro ao enviar job match:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ ESTATÍSTICAS ============

app.get('/api/stats', async (req, res) => {
    try {
        const totalCandidates = await get('SELECT COUNT(*) as count FROM candidates');
        const activeCandidates = await get('SELECT COUNT(*) as count FROM candidates WHERE status = "active"');
        const byExperience = await all(`
            SELECT experience_level, COUNT(*) as count 
            FROM candidates 
            GROUP BY experience_level
        `);
        const recentCandidates = await all(`
            SELECT * FROM candidates 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        // Skills mais comuns
        const allSkills = await all('SELECT skills FROM candidates');
        const skillCounts = {};
        allSkills.forEach(row => {
            try {
                const skills = JSON.parse(row.skills);
                skills.forEach(skill => {
                    skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                });
            } catch {}
        });

        const topSkills = Object.entries(skillCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        res.json({
            success: true,
            stats: {
                total: totalCandidates.count,
                active: activeCandidates.count,
                byExperience,
                topSkills,
                recentCandidates
            }
        });
    } catch (error) {
        console.error('Erro nas estatísticas:', error);
        res.status(500).json({ success: false, error: 'Erro ao gerar estatísticas' });
    }
});

// ============ EXPORT CSV ============

app.get('/api/candidates/export/csv', async (req, res) => {
    try {
        const candidates = await all('SELECT * FROM candidates ORDER BY created_at DESC');
        
        const createCsvWriter = require('csv-writer').createObjectCsvWriter;
        const csvPath = path.join(__dirname, '..', 'data', 'candidates_export.csv');
        
        const csvWriter = createCsvWriter({
            path: csvPath,
            header: [
                { id: 'id', title: 'ID' },
                { id: 'full_name', title: 'Nome Completo' },
                { id: 'email', title: 'Email' },
                { id: 'phone', title: 'Telefone' },
                { id: 'location', title: 'Localização' },
                { id: 'experience_level', title: 'Nível' },
                { id: 'current_role', title: 'Cargo Atual' },
                { id: 'skills', title: 'Skills' },
                { id: 'desired_roles', title: 'Cargos Desejados' },
                { id: 'salary_expectation', title: 'Pretensão Salarial' },
                { id: 'availability', title: 'Disponibilidade' },
                { id: 'english_level', title: 'Inglês' },
                { id: 'remote_experience', title: 'Exp. Remoto' },
                { id: 'status', title: 'Status' },
                { id: 'created_at', title: 'Data Cadastro' }
            ]
        });

        await csvWriter.writeRecords(candidates);
        res.download(csvPath, `candidates_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        res.status(500).json({ success: false, error: 'Erro ao gerar CSV' });
    }
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.2.0',
        features: ['candidates', 'emails', 'export', 'stats', 'jobs', 'scraper']
    });
});

// ============ SCRAPER API ============

// Executar scraper manualmente
app.post('/api/scraper/run', async (req, res) => {
    try {
        const { useMock = false } = req.body;
        
        console.log('🚀 Iniciando scraper...');
        const jobs = await runAllScrapers(useMock);
        const result = await saveJobsToDatabase({ run, get, all }, jobs);

        res.json({
            success: true,
            message: `Scraper executado com sucesso!`,
            result
        });
    } catch (error) {
        console.error('❌ Erro no scraper:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Encontrar matches
app.get('/api/matches', async (req, res) => {
    try {
        const matches = await findMatches({ all });
        res.json({
            success: true,
            count: matches.length,
            matches
        });
    } catch (error) {
        console.error('Erro ao buscar matches:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ JOBS API (Scraper) ============

// Listar vagas do banco
app.get('/api/jobs', async (req, res) => {
    try {
        const { status = 'active', search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM jobs WHERE status = ?';
        const params = [status];

        if (search) {
            sql += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const jobs = await all(sql, params);
        const total = await get('SELECT COUNT(*) as count FROM jobs WHERE status = ?', [status]);

        res.json({
            success: true,
            jobs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total.count,
                pages: Math.ceil(total.count / limit)
            }
        });
    } catch (error) {
        console.error('Erro ao listar vagas:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar vagas' });
    }
});

// Criar vaga (manual ou via scraper)
app.post('/api/jobs', async (req, res) => {
    try {
        const {
            title, company, description, requirements, salary,
            location, type, source, source_url, skills_required
        } = req.body;

        const skillsJson = JSON.stringify(skills_required || []);

        const result = await run(`
            INSERT INTO jobs 
            (title, company, description, requirements, salary, location, type, source, source_url, skills_required)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, company, description, requirements, salary, location, type, source, source_url, skillsJson]);

        res.status(201).json({
            success: true,
            id: result.id,
            message: 'Vaga criada com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao criar vaga:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar vaga' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Quantum Work API rodando na porta ${PORT}`);
    console.log(`📊 Admin: http://localhost:${PORT}/admin/`);
    console.log(`📧 Email: Configurado`);
    console.log(`💼 Jobs: API disponível`);
    
    // Inicializar banco
    initDatabase();
});

module.exports = app;
