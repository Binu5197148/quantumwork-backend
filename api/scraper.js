/**
 * Job Scraper - Coleta vagas de sites de emprego remoto
 * 
 * Fontes funcionando:
 * - RemoteOK (API JSON)
 * - Remotive (API JSON)
 * - Jobicy (API JSON)
 * - Arbeitnow (API JSON)
 */

const https = require('https');

// Função auxiliar para fazer requisições HTTP
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

// Extrair skills de texto
function extractSkills(text) {
    const skillsMap = [
        'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#',
        'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt.js',
        'node.js', 'express', 'nestjs', 'django', 'flask', 'fastapi',
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform',
        'react native', 'flutter', 'swift', 'kotlin',
        'figma', 'sketch', 'adobe xd',
        'git', 'github', 'gitlab', 'ci/cd', 'jenkins', 'github actions',
        'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch',
        'product management', 'agile', 'scrum', 'jira'
    ];

    const lowerText = text.toLowerCase();
    return skillsMap.filter(skill => lowerText.includes(skill.toLowerCase()));
}

// ============ SCRAPERS ============

/**
 * Scraper do RemoteOK
 * API pública disponível
 */
async function scrapeRemoteOK() {
    try {
        console.log('🔍 Scraping RemoteOK...');
        const jobs = await fetchJson('https://remoteok.com/api?tags=dev');
        
        const techJobs = jobs.filter(job => job && job.id && job.position).slice(0, 20);

        return techJobs.map(job => ({
            title: job.position,
            company: job.company || 'Unknown',
            description: job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 500) : '',
            requirements: JSON.stringify(extractSkills(job.position + ' ' + (job.description || ''))),
            skills_required: JSON.stringify(extractSkills(job.position + ' ' + (job.description || ''))),
            salary: job.salary || 'Not specified',
            location: job.location || 'Remote',
            type: job.tags && job.tags.includes('contract') ? 'contract' : 'full-time',
            source: 'RemoteOK',
            source_url: job.apply_url || job.url || 'https://remoteok.com'
        }));
    } catch (error) {
        console.error('❌ Erro no RemoteOK:', error.message);
        return [];
    }
}

/**
 * Scraper do Remotive (API pública)
 * https://remotive.com/api/remote-jobs
 */
async function scrapeRemotive() {
    try {
        console.log('🔍 Scraping Remotive...');
        const data = await fetchJson('https://remotive.com/api/remote-jobs');
        const jobs = data.jobs || [];

        return jobs.slice(0, 20).map(job => ({
            title: job.title,
            company: job.company_name || 'Unknown',
            description: job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 500) : '',
            requirements: JSON.stringify(extractSkills((job.title || '') + ' ' + (job.description || ''))),
            skills_required: JSON.stringify(extractSkills((job.title || '') + ' ' + (job.description || ''))),
            salary: job.salary || 'Not specified',
            location: job.candidate_required_location || 'Remote',
            type: job.job_type || 'full-time',
            source: 'Remotive',
            source_url: job.url || 'https://remotive.com'
        }));
    } catch (error) {
        console.error('❌ Erro no Remotive:', error.message);
        return [];
    }
}

/**
 * Scraper do Jobicy (API pública)
 * https://jobicy.com/api/v2/remote-jobs
 */
async function scrapeJobicy(geo = null) {
    try {
        const geoParam = geo ? `&geo=${geo}` : '';
        console.log(`🔍 Scraping Jobicy${geo ? ' (' + geo + ')' : ''}...`);
        const data = await fetchJson(`https://jobicy.com/api/v2/remote-jobs?count=20${geoParam}`);
        const jobs = data.jobs || [];

        return jobs.map(job => ({
            title: job.jobTitle,
            company: job.companyName || 'Unknown',
            description: job.jobDescription?.substring(0, 500) || '',
            requirements: JSON.stringify(extractSkills((job.jobTitle || '') + ' ' + (job.jobDescription || ''))),
            skills_required: JSON.stringify(extractSkills((job.jobTitle || '') + ' ' + (job.jobDescription || ''))),
            salary: job.annualSalary || 'Not specified',
            location: job.jobGeo || geo || 'Remote',
            type: job.jobType || 'full-time',
            source: geo ? `Jobicy-${geo}` : 'Jobicy',
            source_url: job.url || 'https://jobicy.com'
        }));
    } catch (error) {
        console.error('❌ Erro no Jobicy:', error.message);
        return [];
    }
}

/**
 * Scraper do Arbeitnow (API pública)
 * https://www.arbeitnow.com/api/job-board-api
 */
async function scrapeArbeitnow() {
    try {
        console.log('🔍 Scraping Arbeitnow...');
        const data = await fetchJson('https://www.arbeitnow.com/api/job-board-api');
        const jobs = data.data || [];

        return jobs.slice(0, 20).map(job => ({
            title: job.title,
            company: job.company_name || 'Unknown',
            description: job.description?.substring(0, 500) || '',
            requirements: JSON.stringify(extractSkills((job.title || '') + ' ' + (job.description || ''))),
            skills_required: JSON.stringify(extractSkills((job.title || '') + ' ' + (job.description || ''))),
            salary: 'Not specified',
            location: job.location || 'Remote',
            type: job.remote === true ? 'remote' : 'full-time',
            source: 'Arbeitnow',
            source_url: job.url || 'https://www.arbeitnow.com'
        }));
    } catch (error) {
        console.error('❌ Erro no Arbeitnow:', error.message);
        return [];
    }
}

/**
 * Vagas mockadas para demonstração
 */
function getMockJobs() {
    const companies = ['TechCorp', 'StartupXYZ', 'GlobalDevs', 'RemoteFirst', 'CloudNative'];
    const titles = [
        'Senior Full Stack Developer', 'React Developer', 'Node.js Backend Engineer',
        'DevOps Engineer', 'Python Developer', 'Data Engineer',
        'Frontend Developer', 'Mobile Developer (React Native)',
        'Software Architect', 'Engineering Manager'
    ];
    const skills = [
        ['javascript', 'react', 'node.js'],
        ['python', 'django', 'postgresql'],
        ['aws', 'docker', 'kubernetes'],
        ['typescript', 'angular', 'rxjs'],
        ['go', 'microservices', 'grpc'],
        ['react native', 'firebase', 'typescript'],
        ['java', 'spring boot', 'mysql'],
        ['ruby', 'rails', 'redis']
    ];

    const jobs = [];
    for (let i = 0; i < 10; i++) {
        const skillSet = skills[Math.floor(Math.random() * skills.length)];
        jobs.push({
            title: titles[Math.floor(Math.random() * titles.length)],
            company: companies[Math.floor(Math.random() * companies.length)],
            description: `Oportunidade para trabalhar com ${skillSet.join(', ')} em ambiente 100% remoto.`,
            requirements: JSON.stringify(skillSet),
            skills_required: JSON.stringify(skillSet),
            salary: `$${(80 + Math.floor(Math.random() * 100))}k - $${(120 + Math.floor(Math.random() * 100))}k/year`,
            location: 'Remote (Anywhere)',
            type: Math.random() > 0.7 ? 'contract' : 'full-time',
            source: 'Mock Data',
            source_url: 'https://quantumwork.co'
        });
    }
    return jobs;
}

// ============ SCRAPERS POR PAÍS ============

/**
 * Scraper de vagas nos EUA
 */
async function scrapeUSA() {
    // Jobicy usa 'usa' ou 'us' para Estados Unidos
    try {
        const jobs = await scrapeJobicy('usa');
        if (jobs.length === 0) {
            // Tenta alternativa
            return await scrapeJobicy('us');
        }
        return jobs;
    } catch (e) {
        return await scrapeJobicy('us').catch(() => []);
    }
}

/**
 * Scraper de vagas na Índia
 */
async function scrapeIndia() {
    // Jobicy pode usar 'in' ou 'ind' para Índia
    try {
        const jobs = await scrapeJobicy('india');
        if (jobs.length === 0) {
            return await scrapeJobicy('in');
        }
        return jobs;
    } catch (e) {
        return await scrapeJobicy('in').catch(() => []);
    }
}

/**
 * Scraper de vagas em Portugal
 */
async function scrapePortugal() {
    return scrapeJobicy('portugal');
}

/**
 * Scraper de vagas no Japão
 */
async function scrapeJapan() {
    return scrapeJobicy('japan');
}

/**
 * Scraper de vagas na Austrália
 */
async function scrapeAustralia() {
    return scrapeJobicy('australia');
}

/**
 * Scraper de vagas na Nova Zelândia
 */
async function scrapeNewZealand() {
    return scrapeJobicy('new-zealand');
}

/**
 * Scraper de vagas na Itália
 */
async function scrapeItaly() {
    return scrapeJobicy('italy');
}

/**
 * Scraper de vagas no Canadá
 */
async function scrapeCanada() {
    return scrapeJobicy('canada');
}

// ============ FUNÇÕES PÚBLICAS ============

/**
 * Executa todos os scrapers e retorna vagas combinadas
 * 
 * Opções:
 * - useMock: usar dados mockados
 * - filterByCountry: filtrar por país específico (usa Jobicy)
 */
async function runAllScrapers(useMock = false, filterByCountry = null) {
    if (useMock) {
        console.log('📦 Usando dados mockados');
        return getMockJobs();
    }

    // Se filtrar por país, usa só Jobicy com geo
    if (filterByCountry) {
        console.log(`🔍 Buscando vagas específicas para: ${filterByCountry}`);
        const countryJobs = await scrapeJobicy(filterByCountry).catch(err => {
            console.error(`❌ Erro ao buscar vagas para ${filterByCountry}:`, err.message);
            return [];
        });
        console.log(`✅ ${countryJobs.length} vagas encontradas para ${filterByCountry}`);
        return countryJobs;
    }

    const allJobs = [];

    // Executar scrapers em paralelo (apenas os que funcionam)
    const [
        remoteOKJobs, 
        remotiveJobs,
        jobicyJobs,
        arbeitnowJobs,
        usaJobs,
        indiaJobs,
        portugalJobs,
        japanJobs,
        australiaJobs,
        newZealandJobs,
        italyJobs,
        canadaJobs
    ] = await Promise.all([
        scrapeRemoteOK().catch(err => { console.error('RemoteOK erro:', err.message); return []; }),
        scrapeRemotive().catch(err => { console.error('Remotive erro:', err.message); return []; }),
        scrapeJobicy().catch(err => { console.error('Jobicy erro:', err.message); return []; }),
        scrapeArbeitnow().catch(err => { console.error('Arbeitnow erro:', err.message); return []; }),
        scrapeUSA().catch(err => { console.error('USA erro:', err.message); return []; }),
        scrapeIndia().catch(err => { console.error('India erro:', err.message); return []; }),
        scrapePortugal().catch(err => { console.error('Portugal erro:', err.message); return []; }),
        scrapeJapan().catch(err => { console.error('Japan erro:', err.message); return []; }),
        scrapeAustralia().catch(err => { console.error('Australia erro:', err.message); return []; }),
        scrapeNewZealand().catch(err => { console.error('New Zealand erro:', err.message); return []; }),
        scrapeItaly().catch(err => { console.error('Italy erro:', err.message); return []; }),
        scrapeCanada().catch(err => { console.error('Canada erro:', err.message); return []; })
    ]);

    allJobs.push(
        ...remoteOKJobs, 
        ...remotiveJobs,
        ...jobicyJobs,
        ...arbeitnowJobs,
        ...usaJobs,
        ...indiaJobs,
        ...portugalJobs,
        ...japanJobs,
        ...australiaJobs,
        ...newZealandJobs,
        ...italyJobs,
        ...canadaJobs
    );

    // Log de resultados por fonte
    console.log('📊 Resultados por fonte:');
    console.log(`  RemoteOK: ${remoteOKJobs.length} vagas`);
    console.log(`  Remotive: ${remotiveJobs.length} vagas`);
    console.log(`  Jobicy: ${jobicyJobs.length} vagas`);
    console.log(`  Arbeitnow: ${arbeitnowJobs.length} vagas`);
    console.log(`  USA: ${usaJobs.length} vagas`);
    console.log(`  India: ${indiaJobs.length} vagas`);
    console.log(`  Portugal: ${portugalJobs.length} vagas`);
    console.log(`  Japan: ${japanJobs.length} vagas`);
    console.log(`  Australia: ${australiaJobs.length} vagas`);
    console.log(`  New Zealand: ${newZealandJobs.length} vagas`);
    console.log(`  Italy: ${italyJobs.length} vagas`);
    console.log(`  Canada: ${canadaJobs.length} vagas`);

    // Se não conseguiu nenhuma vaga, usar mock
    if (allJobs.length === 0) {
        console.log('⚠️ Nenhuma vaga encontrada, usando dados mockados');
        return getMockJobs();
    }

    console.log(`✅ Total de vagas coletadas: ${allJobs.length}`);
    return allJobs;
}

/**
 * Salva vagas no banco de dados
 */
async function saveJobsToDatabase(db, jobs) {
    const { run, get } = db;
    let saved = 0;
    let duplicates = 0;

    for (const job of jobs) {
        try {
            // Verificar se vaga já existe (mesmo título + empresa)
            const existing = await get(
                'SELECT id FROM jobs WHERE title = ? AND company = ?',
                [job.title, job.company]
            );

            if (existing) {
                duplicates++;
                continue;
            }

            await run(`
                INSERT INTO jobs 
                (title, company, description, requirements, skills_required, 
                 salary_range, location_type, job_type, source_url, source_site, posted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `, [
                job.title,
                job.company,
                job.description,
                job.requirements,
                job.skills_required,
                job.salary,
                job.location,
                job.type,
                job.source_url,
                job.source
            ]);

            saved++;
        } catch (error) {
            console.error('Erro ao salvar vaga:', error.message);
        }
    }

    return { saved, duplicates, total: jobs.length };
}

/**
 * Encontra matches entre candidatos e vagas
 */
async function findMatches(db) {
    const { all } = db;

    const candidates = await all('SELECT id, email, full_name, skills, desired_roles FROM candidates WHERE status = "active"');
    const jobs = await all('SELECT id, title, company, skills_required, salary_range FROM jobs WHERE status = "active"');

    const matches = [];

    for (const candidate of candidates) {
        try {
            const candidateSkills = JSON.parse(candidate.skills || '[]').map(s => s.toLowerCase());
            const desiredRoles = JSON.parse(candidate.desired_roles || '[]').map(r => r.toLowerCase());

            for (const job of jobs) {
                try {
                    const jobSkills = JSON.parse(job.skills_required || '[]').map(s => s.toLowerCase());
                    const jobTitle = job.title.toLowerCase();

                    // Verificar match de skills
                    const matchedSkills = candidateSkills.filter(skill => 
                        jobSkills.some(js => js.includes(skill) || skill.includes(js))
                    );

                    // Verificar match de cargo
                    const roleMatch = desiredRoles.some(role => 
                        jobTitle.includes(role) || role.includes(jobTitle)
                    );

                    const skillMatchPercentage = jobSkills.length > 0 
                        ? Math.round((matchedSkills.length / jobSkills.length) * 100)
                        : 0;

                    // Se tem pelo menos 30% match de skills ou match de cargo
                    if (skillMatchPercentage >= 30 || (roleMatch && matchedSkills.length > 0)) {
                        matches.push({
                            candidateId: candidate.id,
                            candidateEmail: candidate.email,
                            candidateName: candidate.full_name,
                            jobId: job.id,
                            jobTitle: job.title,
                            company: job.company,
                            salary: job.salary_range,
                            matchedSkills,
                            skillMatchPercentage: Math.max(skillMatchPercentage, roleMatch ? 50 : 0)
                        });
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }

    // Ordenar por match percentage
    return matches.sort((a, b) => b.skillMatchPercentage - a.skillMatchPercentage);
}

module.exports = {
    runAllScrapers,
    saveJobsToDatabase,
    findMatches,
    getMockJobs,
    scrapeRemoteOK,
    scrapeRemotive,
    scrapeJobicy,
    scrapeArbeitnow,
    scrapeUSA,
    scrapeIndia,
    scrapePortugal,
    scrapeJapan,
    scrapeAustralia,
    scrapeNewZealand,
    scrapeItaly,
    scrapeCanada
};
