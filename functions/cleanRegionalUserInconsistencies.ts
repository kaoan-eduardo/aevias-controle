import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Função de migração para limpar inconsistências de alocação de usuários nas regionais.
 * 
 * Remove usuários de listas que não correspondem ao seu access_level:
 * - access_level: "user" → só deve estar em laboratoristas_responsaveis
 * - access_level: "sala_tecnica_afirmaevias" → só deve estar em salas_tecnicas_responsaveis
 * - access_level: "gestor_contrato" → só deve estar em gestor_contrato_responsavel
 * - access_level: "cliente" → só deve estar em clientes_responsaveis
 * - access_level: "admin" → não precisa estar em listas (ignorado na limpeza)
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Verificar autenticação - apenas admins podem executar migração
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userAccessLevel = user.access_level || (user.role === 'admin' ? 'admin' : 'user');
        if (userAccessLevel !== 'admin') {
            return Response.json({ 
                error: 'Forbidden - apenas administradores podem executar esta migração' 
            }, { status: 403 });
        }

        console.log("🔧 === INICIANDO MIGRAÇÃO DE LIMPEZA ===");
        console.log("👤 Executado por:", user.email);

        // Buscar todos os usuários e regionais usando service role
        const [allUsers, allRegionais] = await Promise.all([
            base44.asServiceRole.entities.User.list(),
            base44.asServiceRole.entities.Regional.list()
        ]);

        console.log("📊 Total de usuários:", allUsers.length);
        console.log("📊 Total de regionais:", allRegionais.length);

        // Criar um mapa de email -> access_level para fácil acesso
        const userAccessMap = new Map();
        allUsers.forEach(u => {
            userAccessMap.set(u.email.toLowerCase(), u.access_level || 'user');
        });

        const corrections = [];
        let totalCorrections = 0;

        // Processar cada regional
        for (const regional of allRegionais) {
            console.log(`\n🔍 Analisando regional: ${regional.nome} (${regional.codigo})`);
            
            let regionalModified = false;
            const regionalCorrections = {
                regional_nome: regional.nome,
                regional_codigo: regional.codigo,
                corrections: []
            };

            // 1. Validar Gestor de Contrato
            if (regional.gestor_contrato_responsavel) {
                const email = regional.gestor_contrato_responsavel.toLowerCase();
                const accessLevel = userAccessMap.get(email);
                
                if (accessLevel && accessLevel !== 'gestor_contrato' && accessLevel !== 'admin') {
                    console.log(`  ❌ Removendo ${email} de gestor_contrato_responsavel (access_level: ${accessLevel})`);
                    regional.gestor_contrato_responsavel = null;
                    regionalModified = true;
                    regionalCorrections.corrections.push({
                        email,
                        removed_from: 'gestor_contrato_responsavel',
                        reason: `access_level é "${accessLevel}", não "gestor_contrato"`
                    });
                    totalCorrections++;
                }
            }

            // 2. Validar Salas Técnicas
            if (regional.salas_tecnicas_responsaveis && regional.salas_tecnicas_responsaveis.length > 0) {
                const validSalas = [];
                
                for (const email of regional.salas_tecnicas_responsaveis) {
                    const emailLower = email.toLowerCase();
                    const accessLevel = userAccessMap.get(emailLower);
                    
                    if (!accessLevel) {
                        console.log(`  ⚠️ Usuário ${email} não encontrado no sistema, mantendo na lista`);
                        validSalas.push(email);
                    } else if (accessLevel === 'sala_tecnica_afirmaevias' || accessLevel === 'admin') {
                        validSalas.push(email);
                    } else {
                        console.log(`  ❌ Removendo ${email} de salas_tecnicas_responsaveis (access_level: ${accessLevel})`);
                        regionalModified = true;
                        regionalCorrections.corrections.push({
                            email,
                            removed_from: 'salas_tecnicas_responsaveis',
                            reason: `access_level é "${accessLevel}", não "sala_tecnica_afirmaevias"`
                        });
                        totalCorrections++;
                    }
                }
                
                if (validSalas.length !== regional.salas_tecnicas_responsaveis.length) {
                    regional.salas_tecnicas_responsaveis = validSalas;
                }
            }

            // 3. Validar Laboratoristas
            if (regional.laboratoristas_responsaveis && regional.laboratoristas_responsaveis.length > 0) {
                const validLabs = [];
                
                for (const email of regional.laboratoristas_responsaveis) {
                    const emailLower = email.toLowerCase();
                    const accessLevel = userAccessMap.get(emailLower);
                    
                    if (!accessLevel) {
                        console.log(`  ⚠️ Usuário ${email} não encontrado no sistema, mantendo na lista`);
                        validLabs.push(email);
                    } else if (accessLevel === 'user' || accessLevel === 'admin') {
                        validLabs.push(email);
                    } else {
                        console.log(`  ❌ Removendo ${email} de laboratoristas_responsaveis (access_level: ${accessLevel})`);
                        regionalModified = true;
                        regionalCorrections.corrections.push({
                            email,
                            removed_from: 'laboratoristas_responsaveis',
                            reason: `access_level é "${accessLevel}", não "user"`
                        });
                        totalCorrections++;
                    }
                }
                
                if (validLabs.length !== regional.laboratoristas_responsaveis.length) {
                    regional.laboratoristas_responsaveis = validLabs;
                }
            }

            // 4. Validar Clientes
            if (regional.clientes_responsaveis && regional.clientes_responsaveis.length > 0) {
                const validClientes = [];
                
                for (const email of regional.clientes_responsaveis) {
                    const emailLower = email.toLowerCase();
                    const accessLevel = userAccessMap.get(emailLower);
                    
                    if (!accessLevel) {
                        console.log(`  ⚠️ Usuário ${email} não encontrado no sistema, mantendo na lista`);
                        validClientes.push(email);
                    } else if (accessLevel === 'cliente' || accessLevel === 'admin') {
                        validClientes.push(email);
                    } else {
                        console.log(`  ❌ Removendo ${email} de clientes_responsaveis (access_level: ${accessLevel})`);
                        regionalModified = true;
                        regionalCorrections.corrections.push({
                            email,
                            removed_from: 'clientes_responsaveis',
                            reason: `access_level é "${accessLevel}", não "cliente"`
                        });
                        totalCorrections++;
                    }
                }
                
                if (validClientes.length !== regional.clientes_responsaveis.length) {
                    regional.clientes_responsaveis = validClientes;
                }
            }

            // Se a regional foi modificada, atualizar no banco
            if (regionalModified) {
                console.log(`  💾 Salvando correções na regional ${regional.nome}`);
                
                await base44.asServiceRole.entities.Regional.update(regional.id, {
                    gestor_contrato_responsavel: regional.gestor_contrato_responsavel,
                    salas_tecnicas_responsaveis: regional.salas_tecnicas_responsaveis,
                    laboratoristas_responsaveis: regional.laboratoristas_responsaveis,
                    clientes_responsaveis: regional.clientes_responsaveis
                });

                corrections.push(regionalCorrections);
            } else {
                console.log(`  ✅ Regional OK - nenhuma inconsistência encontrada`);
            }
        }

        console.log("\n🏁 === MIGRAÇÃO CONCLUÍDA ===");
        console.log(`Total de correções: ${totalCorrections}`);
        console.log(`Regionais afetadas: ${corrections.length}`);

        return Response.json({
            success: true,
            message: `Migração concluída com sucesso`,
            summary: {
                total_corrections: totalCorrections,
                regionais_affected: corrections.length,
                total_regionais: allRegionais.length
            },
            corrections: corrections,
            executed_by: user.email,
            executed_at: new Date().toISOString()
        });

    } catch (error) {
        console.error("❌ Erro na migração:", error);
        return Response.json({ 
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});