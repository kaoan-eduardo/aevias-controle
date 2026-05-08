import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Mapeamento FIXO de chaves antigas para novas (padronizadas DNIT/ASTM)
const MAPEAMENTO_MIGRACAO = {
  // Chaves erradas -> Chaves corretas
  'peneira_4_8mm': 'peneira_4_75mm',
  'peneira_2_4mm': 'peneira_2_36mm',
  'peneira_1_2mm': 'peneira_1_18mm',
  'peneira_0_6mm': 'peneira_0_6mm',    // já está correta
  'peneira_0_3mm': 'peneira_0_3mm',    // já está correta
  'peneira_0_15mm': 'peneira_0_15mm',  // já está correta
  'peneira_0_075mm': 'peneira_0_075mm', // já está correta
  'peneira_9_5mm': 'peneira_9_5mm',    // já está correta
  'peneira_12_5mm': 'peneira_12_5mm',  // já está correta
  'peneira_19mm': 'peneira_19_0mm',    // normalizar para 19.0
  'peneira_25mm': 'peneira_25_0mm',    // normalizar para 25.0
};

const migrarObjeto = (obj, prefixoLog = '') => {
  if (!obj || typeof obj !== 'object') return { obj, modificado: false };
  
  let modificado = false;
  const novoObj = {};
  
  for (const [chave, valor] of Object.entries(obj)) {
    if (MAPEAMENTO_MIGRACAO[chave]) {
      const novaChave = MAPEAMENTO_MIGRACAO[chave];
      console.log(`  ${prefixoLog}Migrando: ${chave} -> ${novaChave} (valor: ${String(valor)})`);
      novoObj[novaChave] = valor;
      modificado = true;
    } else {
      novoObj[chave] = valor;
    }
  }
  
  return { obj: novoObj, modificado };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação e permissão de admin
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userAccessLevel = user.access_level || (user.role === 'admin' ? 'admin' : 'user');
    if (userAccessLevel !== 'admin') {
      return Response.json({ 
        error: 'Forbidden - Admin only' 
      }, { status: 403 });
    }

    console.log("🔧 Iniciando migração de peneiras em Projects...");
    
    // Buscar todos os projetos usando service role
    const projects = await base44.asServiceRole.entities.Project.list();
    console.log(`📋 Total de projetos encontrados: ${projects.length}`);
    
    const projetosModificados = [];
    let totalMigracoes = 0;
    
    for (const project of projects) {
      let projectModificado = false;
      const updates = {};
      
      console.log(`\n🔍 Analisando projeto: ${project.name} (ID: ${project.id})`);
      
      // Migrar agregados
      if (project.agregados && Array.isArray(project.agregados)) {
        const novosAgregados = [];
        
        for (let i = 0; i < project.agregados.length; i++) {
          const agregado = project.agregados[i];
          const novoAgregado = { ...agregado };
          
          if (agregado.granulometria) {
            const resultado = migrarObjeto(agregado.granulometria, `  Agregado ${i + 1}: `);
            if (resultado.modificado) {
              novoAgregado.granulometria = resultado.obj;
              projectModificado = true;
              totalMigracoes++;
            }
          }
          
          novosAgregados.push(novoAgregado);
        }
        
        if (projectModificado) {
          updates.agregados = novosAgregados;
        }
      }
      
      // Migrar faixa_trabalho
      if (project.faixa_trabalho) {
        const resultado = migrarObjeto(project.faixa_trabalho, '  Faixa trabalho: ');
        if (resultado.modificado) {
          updates.faixa_trabalho = resultado.obj;
          projectModificado = true;
          totalMigracoes++;
        }
      }
      
      // Migrar faixa_trabalho_min
      if (project.faixa_trabalho_min) {
        const resultado = migrarObjeto(project.faixa_trabalho_min, '  Faixa trabalho MIN: ');
        if (resultado.modificado) {
          updates.faixa_trabalho_min = resultado.obj;
          projectModificado = true;
          totalMigracoes++;
        }
      }
      
      // Migrar faixa_trabalho_max
      if (project.faixa_trabalho_max) {
        const resultado = migrarObjeto(project.faixa_trabalho_max, '  Faixa trabalho MAX: ');
        if (resultado.modificado) {
          updates.faixa_trabalho_max = resultado.obj;
          projectModificado = true;
          totalMigracoes++;
        }
      }
      
      // Se houve modificações, atualizar o projeto
      if (projectModificado) {
        console.log(`  ✅ Atualizando projeto ${project.id}...`);
        await base44.asServiceRole.entities.Project.update(project.id, updates);
        projetosModificados.push({
          id: project.id,
          name: project.name,
          migracoes: Object.keys(updates)
        });
      } else {
        console.log(`  ✓ Projeto já está com peneiras corretas`);
      }
    }
    
    const resultado = {
      success: true,
      summary: {
        total_projetos: projects.length,
        projetos_modificados: projetosModificados.length,
        total_migracoes: totalMigracoes
      },
      projetos_modificados: projetosModificados
    };
    
    console.log("\n✅ Migração concluída:");
    console.log(JSON.stringify(resultado, null, 2));
    
    return Response.json(resultado);
    
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});