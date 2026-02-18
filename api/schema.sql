-- Schema do banco de dados Quantum Work

-- Tabela de candidatos
CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    location TEXT,
    linkedin TEXT,
    portfolio TEXT,
    experience_level TEXT,
    current_role TEXT,
    skills TEXT, -- JSON array
    desired_roles TEXT, -- JSON array
    salary_expectation TEXT,
    availability TEXT,
    english_level TEXT,
    remote_experience INTEGER DEFAULT 0,
    bio TEXT,
    resume_url TEXT,
    status TEXT DEFAULT 'active', -- active, placed, inactive
    newsletter INTEGER DEFAULT 1, -- 1 = subscribed, 0 = unsubscribed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    email_sent INTEGER DEFAULT 0
);

-- Tabela de vagas
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    requirements TEXT, -- JSON array
    skills_required TEXT, -- JSON array
    salary_range TEXT,
    location_type TEXT, -- remote, hybrid, onsite
    job_type TEXT, -- full-time, part-time, contract
    source_url TEXT,
    source_site TEXT,
    status TEXT DEFAULT 'active',
    posted_at DATETIME,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de aplicações
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER,
    job_id INTEGER,
    status TEXT DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Tabela de emails enviados
CREATE TABLE IF NOT EXISTS emails_sent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER,
    type TEXT, -- welcome, weekly_jobs, manual
    subject TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    opened INTEGER DEFAULT 0,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates(skills);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs(skills_required);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);