#!/usr/bin/env node
/**
 * Cron Job - Atualização de Vagas
 * Executa o scraper automaticamente para buscar novas vagas
 * 
 * Uso: node scripts/update-jobs.js
 * Ou via cron: 0 9 * * * cd /path/to/quantumwork_site && node scripts/update-jobs.js
 */

const { runAllScrapers, saveJobsToDatabase, findMatches } = require('../api/scraper');
const { sendEmail } = require('../api/email');
const { all, get, run } = require('../api/database');

async function main() {
    console.log('🚀 Quantum Work - Job Updater');
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString()}`);
    console.log('─'.repeat(50));

    try {
        // 1. Executar scrapers
        console.log('\n📡 Buscando vagas...');
        const jobs = await runAllScrapers(false);
        console.log(`   ${jobs.length} vagas encontradas`);

        // 2. Salvar no banco
        console.log('\n💾 Salvando vagas...');
        const result = await saveJobsToDatabase({ run, get }, jobs);
        console.log(`   ✅ ${result.saved} novas vagas`);
        console.log(`   ⚠️  ${result.duplicates} duplicadas`);

        // 3. Encontrar matches
        if (result.saved > 0) {
            console.log('\n🎯 Procurando matches...');
            const matches = await findMatches({ all });
            console.log(`   ${matches.length} matches encontrados`);

            // 4. Enviar emails de match (top 5 por candidato)
            const matchesByCandidate = {};
            matches.forEach(match => {
                if (!matchesByCandidate[match.candidateId]) {
                    matchesByCandidate[match.candidateId] = [];
                }
                if (matchesByCandidate[match.candidateId].length < 5) {
                    matchesByCandidate[match.candidateId].push(match);
                }
            });

            console.log(`\n📧 Enviando ${Object.keys(matchesByCandidate).length} notificações...`);
            
            for (const [candidateId, candidateMatches] of Object.entries(matchesByCandidate)) {
                try {
                    const topMatch = candidateMatches[0];
                    await sendEmail(topMatch.candidateEmail, 'jobMatch', {
                        candidateName: topMatch.candidateName,
                        jobTitle: topMatch.jobTitle,
                        company: topMatch.company,
                        salary: topMatch.salary,
                        location: 'Remoto',
                        matchPercentage: topMatch.skillMatchPercentage,
                        matchedSkills: topMatch.matchedSkills,
                        applyUrl: 'https://quantumwork.co/vagas'
                    });
                    console.log(`   ✅ ${topMatch.candidateEmail}`);
                } catch (e) {
                    console.error(`   ❌ Erro ao notificar candidato ${candidateId}`);
                }
            }
        }

        console.log('\n✅ Atualização completa!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

main();
