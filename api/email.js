const nodemailer = require('nodemailer');

// Configuração do transporter
const createTransporter = () => {
    // Se estiver em ambiente de desenvolvimento/teste, usa Ethereal
    if (process.env.NODE_ENV !== 'production') {
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.ETHEREAL_USER,
                pass: process.env.ETHEREAL_PASS
            }
        });
    }

    // Produção - usar variáveis de ambiente
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Templates de email
const templates = {
    welcome: (data) => ({
        subject: '🎉 Bem-vindo ao Quantum Work!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo ao Quantum Work</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; }
                .content { padding: 40px 30px; }
                .content h2 { color: #333; margin-top: 0; }
                .content p { color: #666; line-height: 1.6; font-size: 16px; }
                .highlight { background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
                .stats { display: flex; justify-content: space-around; margin: 30px 0; text-align: center; }
                .stat { padding: 15px; }
                .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
                .stat-label { color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Quantum Work</h1>
                </div>
                <div class="content">
                    <h2>Olá, ${data.full_name || 'Candidato'}! 👋</h2>
                    <p>Seja muito bem-vindo à <strong>Quantum Work</strong>! Estamos empolgados em fazer parte da sua jornada em busca de oportunidades remotas.</p>
                    
                    <div class="highlight">
                        <strong>✅ Seu cadastro foi realizado com sucesso!</strong><br>
                        Agora você faz parte da nossa base de talentos e receberá vagas compatíveis com o seu perfil.
                    </div>

                    <h3>🎯 O que acontece agora?</h3>
                    <p>
                        • Analisaremos seu perfil e skills<br>
                        • Match automático com vagas disponíveis<br>
                        • Notificações de oportunidades no seu email<br>
                        • Acesso a recursos exclusivos de carreira
                    </p>

                    <div class="stats">
                        <div class="stat">
                            <div class="stat-number">500+</div>
                            <div class="stat-label">Vagas Disponíveis</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">50+</div>
                            <div class="stat-label">Empresas Parceiras</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">100%</div>
                            <div class="stat-label">Remoto</div>
                        </div>
                    </div>

                    <center>
                        <a href="https://quantumwork.co" class="button">Ver Oportunidades</a>
                    </center>

                    <p style="margin-top: 30px; font-size: 14px; color: #999;">
                        Dúvidas? Responda este email ou entre em contato pelo nosso site.<br>
                        Estamos aqui para ajudar você a conquistar o trabalho remoto dos seus sonhos! 🌟
                    </p>
                </div>
                <div class="footer">
                    <p>© 2026 Quantum Work. Todos os direitos reservados.</p>
                    <p>Rua Example, 123 - São Paulo, SP</p>
                </div>
            </div>
        </body>
        </html>
        `,
        text: `Bem-vindo ao Quantum Work! Seu cadastro foi realizado com sucesso. Agora você receberá vagas compatíveis com seu perfil. Acesse: https://quantumwork.co`
    }),

    newsletter: (data) => ({
        subject: `🎯 ${data.jobsCount} novas vagas remotas esta semana!`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
                .content { padding: 30px; }
                .job-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 15px 0; }
                .job-title { color: #667eea; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                .job-meta { color: #666; font-size: 14px; margin: 5px 0; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Newsletter Quantum Work</h1>
                    <p>Vagas remotas selecionadas para você</p>
                </div>
                <div class="content">
                    <h2>Olá!</h2>
                    <p>Encontramos ${data.jobsCount} novas oportunidades que combinam com seu perfil:</p>
                    ${data.jobs ? data.jobs.map(job => `
                    <div class="job-card">
                        <div class="job-title">${job.title}</div>
                        <div class="job-meta">🏢 ${job.company}</div>
                        <div class="job-meta">📍 ${job.location}</div>
                        <div class="job-meta">💰 ${job.salary || 'A combinar'}</div>
                        <a href="${job.url}" class="button">Ver Vaga</a>
                    </div>
                    `).join('') : ''}
                    <center>
                        <a href="https://quantumwork.co/vagas" class="button" style="background: #764ba2;">Ver Todas as Vagas</a>
                    </center>
                </div>
            </div>
        </body>
        </html>
        `,
        text: `Newsletter Quantum Work - ${data.jobsCount} novas vagas! Acesse: https://quantumwork.co/vagas`
    }),

    jobMatch: (data) => ({
        subject: `🎯 Nova vaga compatível: ${data.jobTitle}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
                .content { padding: 30px; }
                .match-badge { background: #4caf50; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                .skills-match { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Match Encontrado!</h1>
                </div>
                <div class="content">
                    <h2>Olá, ${data.candidateName}!</h2>
                    <p>Encontramos uma vaga que combina perfeitamente com seu perfil:</p>
                    
                    <center>
                        <div class="match-badge">✨ ${data.matchPercentage}% Match</div>
                    </center>

                    <h3>${data.jobTitle}</h3>
                    <p><strong>🏢 ${data.company}</strong></p>
                    <p><strong>📍</strong> ${data.location}</p>
                    <p><strong>💰</strong> ${data.salary || 'A combinar'}</p>

                    <div class="skills-match">
                        <strong>🎯 Skills que você tem:</strong><br>
                        ${data.matchedSkills.map(s => `• ${s}`).join('<br>')}
                    </div>

                    <center>
                        <a href="${data.applyUrl}" class="button">Candidatar-se Agora</a>
                    </center>
                </div>
            </div>
        </body>
        </html>
        `,
        text: `Match encontrado! ${data.jobTitle} na ${data.company} - ${data.matchPercentage}% compatível. Acesse: ${data.applyUrl}`
    })
};

// Função para enviar email
async function sendEmail(to, templateName, data) {
    try {
        const transporter = createTransporter();
        const template = templates[templateName](data);

        const info = await transporter.sendMail({
            from: '"Quantum Work" <noreply@quantumwork.co>',
            to,
            subject: template.subject,
            html: template.html,
            text: template.text
        });

        console.log('📧 Email enviado:', info.messageId);
        
        // Se estiver usando Ethereal, mostra a URL de preview
        if (process.env.NODE_ENV !== 'production' && info.ethereal) {
            console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return { success: true, messageId: info.messageId, previewUrl: info.ethereal ? nodemailer.getTestMessageUrl(info) : null };
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        return { success: false, error: error.message };
    }
}

// Função para enviar newsletter para todos os candidatos ativos
async function sendNewsletterToAll(db, jobs) {
    const { all } = db;
    
    try {
        const candidates = await all('SELECT email, full_name FROM candidates WHERE status = "active" AND newsletter = 1');
        
        const results = [];
        for (const candidate of candidates) {
            const result = await sendEmail(candidate.email, 'newsletter', {
                jobsCount: jobs.length,
                jobs: jobs.slice(0, 5) // Envia top 5 vagas
            });
            results.push({ email: candidate.email, ...result });
        }

        return { success: true, sent: results.length, results };
    } catch (error) {
        console.error('Erro ao enviar newsletter:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendEmail,
    sendNewsletterToAll,
    templates
};
