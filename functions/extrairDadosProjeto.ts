import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { file_url, tipo_projeto, faixa_id, regional_id } = await req.json();

    if (!file_url || !tipo_projeto || !faixa_id) {
      return Response.json({ 
        error: 'file_url, tipo_projeto e faixa_id são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar informações da faixa granulométrica
    const faixas = await base44.entities.FaixaGranulometrica.list();
    const faixa = faixas.find(f => f.id === faixa_id);

    if (!faixa) {
      return Response.json({ error: 'Faixa granulométrica não encontrada' }, { status: 404 });
    }

    // Buscar informações da regional (se fornecida)
    let regional = null;
    if (regional_id) {
      const regionais = await base44.entities.Regional.list();
      regional = regionais.find(r => r.id === regional_id);
    }

    // Montar o prompt baseado no tipo de projeto
    let prompt = `Você é um assistente especializado em extração de dados de projetos de pavimentação.

Analise o arquivo anexado e extraia todos os parâmetros técnicos do projeto de pavimentação do tipo ${tipo_projeto}.

CONTEXTO DO PROJETO:
- Tipo: ${tipo_projeto}
- Faixa Granulométrica: ${faixa.nome} (${faixa.orgao} - ${faixa.especificacao})
${regional ? `- Regional: ${regional.nome} (${regional.codigo})` : ''}

`;

    if (tipo_projeto === 'CARTA_TRACO_CONCRETO') {
      prompt += `
Extraia os seguintes dados da carta traço de concreto:
- fck: Resistência característica (MPa)
- slump_minimo, slump_projeto, slump_maximo: Valores de slump (cm)
- consumo_agua: Consumo de água (L/m³)
- tipo_aditivo: Tipo de aditivo utilizado
- tipo_cimento: Tipo de cimento (ex: CP II-E-32)
- concreteira: Nome da concreteira fornecedora
- name: Nome do projeto/traço
- client: Cliente
- location: Localização (se houver)
- description: Descrição do projeto

Retorne APENAS um objeto JSON com estes campos. Use null para campos não encontrados.`;

    } else if (tipo_projeto === 'CAMADAS_GRANULARES') {
      prompt += `
Extraia os seguintes dados do projeto de camadas granulares:
- name: Nome do projeto
- client: Cliente
- location: Localização
- description: Descrição
- equivalente_areia_minimo: Equivalente de areia mínimo (%)
- melhorador_utilizado: Melhorador utilizado (ex: Cimento Portland, Cal)
- umidade_otima: Umidade ótima (%)
- densidade_otima: Densidade ótima (g/cm³)
- resistencia_mpa: Resistência (MPa) - opcional
- agregados: Array de agregados com: nome, pedreira, percentual_mistura, granulometria (objeto com peneiras)

Retorne APENAS um objeto JSON. Use null para campos não encontrados.`;

    } else {
      // CAUQ, MRAF, BGS
      const peneirasStr = faixa.peneiras?.map(p => `${p.astm} (${p.abertura})`).join(', ') || '';
      
      prompt += `
PENEIRAS DA FAIXA ESPECIFICADA: ${peneirasStr}

ATENÇÃO - PRIORIDADES DE EXTRAÇÃO:
🔴 CRÍTICO (obrigatório extrair):
   - Faixa de trabalho (faixa_trabalho, faixa_trabalho_min, faixa_trabalho_max) com valores para TODAS as peneiras
   - Teor de ligante ótimo (teor_ligante.otimo)
   - Densidades (massa_especifica_aparente, densidade_maxima_medida)
   - Agregados (nome, pedreira, percentual_mistura, granulometria completa)

🟡 IMPORTANTE (extrair se disponível):
   - Temperaturas, Volume de vazios, Parâmetros Marshall (Estabilidade, Fluência, VAM, RBV, RTCD)
   - Informações básicas (name, client, location, description)

Extraia os seguintes dados do projeto:
- name: Nome do projeto
- client: Cliente
- location: Localização
- description: Descrição do projeto
- equivalente_areia_minimo: Equivalente de areia mínimo (%)

${tipo_projeto === 'CAUQ' ? `
DADOS ESPECÍFICOS DE CAUQ:
- ligante: objeto com {tipo, fornecedor, densidade}
- agregados: array de objetos com {nome, pedreira, percentual_mistura, granulometria}
- temperaturas: {mistura: {min, max}, compactacao: {min, max}, espalhamento: {min, max}}
- faixa_trabalho: objeto com valores % passante para cada peneira (ex: peneira_19_0mm: 95)
- faixa_trabalho_min: objeto com valores mínimos
- faixa_trabalho_max: objeto com valores máximos
- teor_ligante: {min, max, otimo}
- massa_especifica_aparente: valor em g/cm³
- densidade_maxima_medida: densidade RICE em g/cm³
- volume_vazios: {min, max, otimo}
- rtcd: {min} em MPa
- estabilidade: {min, projeto} em N
- fluencia: {min, max, projeto} em mm
- vam: {min, projeto} em %
- rbv: {min, max, projeto} em %
` : ''}

${tipo_projeto === 'MRAF' ? `
DADOS ESPECÍFICOS DE MRAF:
- emulsao_utilizada: tipo de emulsão (ex: RL-1C)
- agregados: array simples com {nome, pedreira}
- faixa_trabalho: objeto com valores % passante para cada peneira
- faixa_trabalho_min: objeto com valores mínimos
- faixa_trabalho_max: objeto com valores máximos
- teor_ligante_residual: {min, max, otimo}
- percentual_emulsao: % de emulsão na mistura
- taxa_aplicacao_mraf: {min, max, otimo} em kg/m²
- densidade_mistura_mraf: densidade em g/cm³
` : ''}

${tipo_projeto === 'BGS' ? `
DADOS ESPECÍFICOS DE BGS:
- agregados: array simples com {nome, pedreira}
` : ''}

FORMATO DAS PENEIRAS - MUITO IMPORTANTE:
Use EXATAMENTE estes nomes de campos para as peneiras:
- peneira_75_0mm (3")
- peneira_63_0mm (2 1/2")
- peneira_50_0mm (2")
- peneira_37_5mm (1 1/2")
- peneira_25_0mm (1")
- peneira_19_0mm (3/4")
- peneira_16_0mm (5/8")
- peneira_12_5mm (1/2")
- peneira_9_5mm (3/8")
- peneira_4_75mm (Nº 4)
- peneira_2_36mm (Nº 8)
- peneira_2_0mm (Nº 10)
- peneira_1_18mm (Nº 16)
- peneira_0_6mm (Nº 30)
- peneira_0_42mm (Nº 40)
- peneira_0_3mm (Nº 50)
- peneira_0_18mm (Nº 80)
- peneira_0_15mm (Nº 100)
- peneira_0_075mm (Nº 200)

REGRAS DE EXTRAÇÃO:
- Valores numéricos devem ser NUMBER, não strings
- Use null para campos não encontrados
- Para faixa_trabalho, faixa_trabalho_min, faixa_trabalho_max: crie objetos com as peneiras como chaves
- Para agregados: extraia TODOS os agregados encontrados no arquivo, com granulometria COMPLETA de cada um
- Seja DETALHISTA ao buscar os valores - analise tabelas, gráficos e textos cuidadosamente

EXEMPLO de faixa_trabalho:
{
  "peneira_19_0mm": 100,
  "peneira_4_75mm": 65.5,
  "peneira_0_075mm": 5.2
}

Retorne APENAS um objeto JSON válido com os campos extraídos.`;
    }

    console.log('🤖 Chamando LLM para extração de dados...');

    // Chamar o LLM com visão para analisar o arquivo - SEM schema restritivo
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      file_urls: [file_url]
    });

    console.log('✅ Resposta do LLM (raw):', resultado);

    // Tentar fazer parse se vier como string
    let dadosExtraidos;
    if (typeof resultado === 'string') {
      // Remover markdown code blocks se existirem
      const cleanJson = resultado.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      dadosExtraidos = JSON.parse(cleanJson);
    } else {
      dadosExtraidos = resultado;
    }

    console.log('✅ Dados parseados:', dadosExtraidos);

    return Response.json({
      success: true,
      dados: dadosExtraidos
    });

  } catch (error) {
    console.error('❌ Erro ao extrair dados:', error);
    return Response.json({ 
      error: 'Erro ao extrair dados do projeto',
      details: error.message 
    }, { status: 500 });
  }
});