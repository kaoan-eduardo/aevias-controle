import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Função de backend para listar usuários filtrados por regional.
 * 
 * Admins veem todos os usuários.
 * Gestores/Salas Técnicas/Clientes veem apenas usuários de suas regionais.
 * Laboratoristas veem apenas a si mesmos.
 * 
 * A filtragem é dinâmica e reflete as transferências de regional aprovadas.
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Verificar autenticação
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("📥 Requisição de listagem de usuários por:", user.email);

        // Determinar nível de acesso do usuário
        const userAccessLevel = user.access_level || (user.role === 'admin' ? 'admin' : 'user');
        console.log("🔐 Nível de acesso:", userAccessLevel);

        // Buscar todos os usuários e regionais usando service role
        const [allUsers, allRegionais] = await Promise.all([
            base44.asServiceRole.entities.User.list(),
            base44.asServiceRole.entities.Regional.list()
        ]);

        console.log("📊 Total de usuários no sistema:", allUsers.length);
        console.log("📊 Total de regionais no sistema:", allRegionais.length);

        // Se for admin, retornar todos os usuários
        if (userAccessLevel === 'admin') {
            console.log("👑 Admin - retornando todos os usuários");
            return Response.json({ 
                users: allUsers,
                total: allUsers.length,
                filtered: false
            });
        }

        // Encontrar regionais onde o usuário está vinculado
        let regionaisDoUsuario = [];

        if (userAccessLevel === 'gestor_contrato') {
            console.log("🔍 Buscando regionais onde o usuário é gestor...");
            regionaisDoUsuario = allRegionais.filter(regional => 
                regional.gestor_contrato_responsavel?.toLowerCase() === user.email.toLowerCase()
            );
        } else if (userAccessLevel === 'sala_tecnica_afirmaevias') {
            console.log("🔍 Buscando regionais onde o usuário é sala técnica...");
            regionaisDoUsuario = allRegionais.filter(regional => {
                const salasTecnicas = regional.salas_tecnicas_responsaveis || [];
                return salasTecnicas.some(email => email.toLowerCase() === user.email.toLowerCase());
            });
        } else if (userAccessLevel === 'cliente') {
            console.log("🔍 Buscando regionais onde o usuário é cliente...");
            regionaisDoUsuario = allRegionais.filter(regional => {
                const clientes = regional.clientes_responsaveis || [];
                return clientes.some(email => email.toLowerCase() === user.email.toLowerCase());
            });
        } else {
            // Laboratorista - retorna apenas ele mesmo
            console.log("👤 Laboratorista - retornando apenas o próprio usuário");
            const selfUser = allUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase());
            return Response.json({ 
                users: selfUser ? [selfUser] : [],
                total: selfUser ? 1 : 0,
                filtered: true,
                filterType: 'self'
            });
        }

        console.log(`📍 Regionais encontradas para o usuário: ${regionaisDoUsuario.length}`);
        
        if (regionaisDoUsuario.length === 0) {
            console.log("⚠️ Nenhuma regional encontrada - retornando lista vazia");
            return Response.json({ 
                users: [],
                total: 0,
                filtered: true,
                filterType: 'regional',
                regionais: []
            });
        }

        // Coletar todos os emails das regionais do usuário
        const emailsNasRegionais = new Set();
        
        regionaisDoUsuario.forEach(regional => {
            console.log(`\n📋 Processando regional: ${regional.nome}`);
            
            // Adicionar gestor
            if (regional.gestor_contrato_responsavel) {
                emailsNasRegionais.add(regional.gestor_contrato_responsavel.toLowerCase());
                console.log(`  ✓ Gestor: ${regional.gestor_contrato_responsavel}`);
            }
            
            // Adicionar laboratoristas
            const labs = regional.laboratoristas_responsaveis || [];
            console.log(`  ✓ Laboratoristas: ${labs.length}`);
            labs.forEach(email => emailsNasRegionais.add(email.toLowerCase()));
            
            // Adicionar salas técnicas
            const salas = regional.salas_tecnicas_responsaveis || [];
            console.log(`  ✓ Salas Técnicas: ${salas.length}`);
            salas.forEach(email => emailsNasRegionais.add(email.toLowerCase()));
            
            // Adicionar clientes
            const clientes = regional.clientes_responsaveis || [];
            console.log(`  ✓ Clientes: ${clientes.length}`);
            clientes.forEach(email => emailsNasRegionais.add(email.toLowerCase()));
        });

        console.log(`\n📧 Total de emails únicos nas regionais: ${emailsNasRegionais.size}`);

        // Filtrar usuários que pertencem a essas regionais
        const usuariosFiltrados = allUsers.filter(usuario => 
            emailsNasRegionais.has(usuario.email.toLowerCase())
        );

        console.log(`✅ Usuários filtrados: ${usuariosFiltrados.length}`);

        // Identificar emails sem usuário real (convites pendentes)
        const emailsSemUsuario = Array.from(emailsNasRegionais).filter(email => 
            !allUsers.some(usuario => usuario.email.toLowerCase() === email)
        );

        if (emailsSemUsuario.length > 0) {
            console.log(`\n📧 ${emailsSemUsuario.length} email(s) com convite pendente:`);
            emailsSemUsuario.forEach(email => console.log(`  - ${String(email)}`));
        }

        return Response.json({ 
            users: usuariosFiltrados,
            total: usuariosFiltrados.length,
            filtered: true,
            filterType: 'regional',
            regionais: regionaisDoUsuario.map(r => ({ id: r.id, nome: r.nome, codigo: r.codigo })),
            pendingInvites: emailsSemUsuario
        });

    } catch (error) {
        console.error("❌ Erro ao listar usuários:", error);
        return Response.json({ 
            error: error.message || 'Erro ao carregar usuários',
            details: error.toString()
        }, { status: 500 });
    }
});