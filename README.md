# Quantum Work - Backend API

Backend completo para a agência de empregos remotos Quantum Work.

## 🚀 Funcionalidades

- ✅ API REST com Express.js
- ✅ SQLite para persistência
- ✅ CRUD completo de candidatos
- ✅ **Sistema de Emails (Nodemailer)**
- ✅ **Scraper de Vagas Automático**
- ✅ **Matching de Candidatos x Vagas**
- ✅ Painel administrativo web
- ✅ Exportação CSV
- ✅ Estatísticas e dashboards
- ✅ Newsletter automatizada

## 📁 Estrutura

```
quantumwork_site/
├── api/
│   ├── server.js      # Express server
│   ├── database.js    # SQLite config
│   ├── schema.sql     # Database schema
│   ├── email.js       # Sistema de emails
│   └── scraper.js     # Job scraper
├── admin/
│   └── index.html     # Painel admin
├── scripts/
│   └── update-jobs.js # Script de atualização
├── data/              # Database files
├── public/            # Frontend static
└── package.json
```

## 🛠️ Instalação

```bash
cd quantumwork_site
npm install
```

## 🔧 Configuração

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### Email (Opcional)
Para usar o sistema de emails, configure:
- `SMTP_HOST` - Servidor SMTP
- `SMTP_USER` - Usuário/email
- `SMTP_PASS` - Senha/app password

Para desenvolvimento, os emails vão para Ethereal (fake inbox) automaticamente.

## 🏃 Rodar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Atualizar vagas (manual)
npm run update-jobs
```

- API: http://localhost:3000
- Admin: http://localhost:3000/admin/

## 📊 Endpoints API

### Candidatos
- `POST /api/candidates` - Criar candidato (envia email de boas-vindas)
- `GET /api/candidates` - Listar candidatos
- `GET /api/candidates/:id` - Buscar candidato
- `PUT /api/candidates/:id` - Atualizar candidato
- `DELETE /api/candidates/:id` - Remover candidato

### Vagas
- `GET /api/jobs` - Listar vagas
- `POST /api/jobs` - Criar vaga manualmente

### Emails
- `POST /api/email/test` - Testar envio de email
- `POST /api/email/newsletter` - Enviar newsletter
- `POST /api/email/job-match` - Enviar job match

### Scraper & Matches
- `POST /api/scraper/run` - Executar scraper manualmente
- `GET /api/matches` - Listar matches candidato/vaga

### Estatísticas
- `GET /api/stats` - Dashboard stats
- `GET /api/candidates/export/csv` - Exportar CSV

### Health
- `GET /api/health` - Health check

## 🔐 Login Admin
- Usuário: `admin`
- Senha: `admin123`

## 📧 Sistema de Emails

### Templates disponíveis:
- **welcome** - Email de boas-vindas para novos candidatos
- **newsletter** - Newsletter semanal com vagas
- **jobMatch** - Notificação de vaga compatível

### Configuração de Produção:
```env
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

## 🤖 Scraper de Vagas

### Fontes:
- RemoteOK
- Working Nomads
- Mock data (fallback)

### Uso Manual:
```bash
npm run scraper
# ou
node scripts/update-jobs.js
```

### Cron (Automático):
```bash
# Executar todos os dias às 9h
0 9 * * * cd /path/to/quantumwork_site && npm run update-jobs
```

## 🎯 Sistema de Matching

O sistema automaticamente:
1. Compara skills do candidato com requisitos da vaga
2. Calcula % de compatibilidade
3. Envia email para candidatos com match > 30%
4. Prioriza matches de cargo desejado

## 🚀 Deploy

### Railway:
```bash
railway login
railway init
railway deploy
```

### Render:
1. Conecte seu repo GitHub
2. Use `npm start` como comando de start
3. Adicione variáveis de ambiente

### Vercel (Frontend only):
O frontend estático pode ser deployado na Vercel separadamente.

## 📝 Roadmap

- [x] Backend API
- [x] Sistema de Emails
- [x] Scraper de Vagas
- [x] Matching automático
- [ ] Autenticação JWT
- [ ] Upload de currículos
- [ ] Integração com LinkedIn
- [ ] Painel de analytics

## 📄 Licença

MIT
