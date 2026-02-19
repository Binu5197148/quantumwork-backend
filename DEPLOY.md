# 🚀 QuantumWork.co - Deploy Guide

## Status do Backend: ✅ COMPLETO

### Funcionalidades Implementadas
- ✅ API REST completa (candidatos, vagas, emails)
- ✅ SQLite com persistência
- ✅ Sistema de emails (Nodemailer)
- ✅ Scraper de vagas (RemoteOK, Working Nomads)
- ✅ Matching automático candidato/vaga
- ✅ Painel administrativo
- ✅ Export CSV

---

## Deploy no Railway (Recomendado)

### 1. Instalar CLI do Railway
```bash
npm install -g @railway/cli
```

### 2. Login e Setup
```bash
cd /Users/pennywise/.openclaw/workspace/quantumwork_site
railway login
railway init
# Selecione "New Project"
```

### 3. Deploy
```bash
railway up
```

### 4. Configurar Variáveis de Ambiente
No painel do Railway, adicione:
- `NODE_ENV=production`
- `ADMIN_USER=admin`
- `ADMIN_PASS=<senha_segura>`
- `SMTP_HOST=<opcional>`
- `SMTP_USER=<opcional>`
- `SMTP_PASS=<opcional>`

### 5. Gerar Domínio
```bash
railway domain
```

---

## Deploy no Render (Alternativa)

### 1. Criar conta em render.com

### 2. New Web Service
- Connect GitHub repo
- Build Command: `npm install`
- Start Command: `npm start`

### 3. Add Environment Variables
Mesmas variáveis do Railway acima.

---

## Testes Locais

```bash
# Iniciar servidor
npm run dev

# Testar health check
curl http://localhost:3000/api/health

# Listar candidatos
curl http://localhost:3000/api/candidates

# Executar scraper
curl -X POST http://localhost:3000/api/scraper/run
```

---

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/health | Health check |
| POST | /api/candidates | Criar candidato |
| GET | /api/candidates | Listar candidatos |
| GET | /api/candidates/:id | Buscar candidato |
| PUT | /api/candidates/:id | Atualizar candidato |
| DELETE | /api/candidates/:id | Deletar candidato |
| GET | /api/jobs | Listar vagas |
| POST | /api/jobs | Criar vaga |
| GET | /api/matches | Listar matches |
| POST | /api/scraper/run | Executar scraper |
| GET | /api/stats | Estatísticas |
| GET | /api/candidates/export/csv | Exportar CSV |

---

## Próximos Passos Pós-Deploy

1. [ ] Configurar domínio customizado (quantumwork.co)
2. [ ] Configurar SMTP real (SendGrid/AWS SES)
3. [ ] Adicionar autenticação JWT
4. [ ] LinkedIn OAuth
5. [ ] Upload de currículos (S3)
6. [ ] Analytics e métricas

---

*Última atualização: 18/02/2026*
