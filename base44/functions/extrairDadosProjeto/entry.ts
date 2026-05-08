import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Constants ────────────────────────────────────────────────────────────────

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    name: { type: ["string", "null"] },
    client: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    equivalente_areia_minimo: { type: ["number", "null"] },
    ligante: {
      type: ["object", "null"],
      properties: {
        tipo: { type: ["string", "null"] },
        fornecedor: { type: ["string", "null"] },
        densidade: { type: ["number", "null"] }
      }
    },
    agregados: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: {
          nome: { type: ["string", "null"] },
          pedreira: { type: ["string", "null"] },
          percentual_mistura: { type: ["number", "null"] },
          granulometria: { type: ["object", "null"] }
        }
      }
    },
    faixa_trabalho: { type: ["object", "null"] },
    faixa_trabalho_min: { type: ["object", "null"] },
    faixa_trabalho_max: { type: ["object", "null"] },
    teor_ligante: {
      type: ["object", "null"],
      properties: {
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
        otimo: { type: ["number", "null"] }
      }
    },
    massa_especifica_aparente: { type: ["number", "null"] },
    densidade_maxima_medida: { type: ["number", "null"] },
    temperaturas: {
      type: ["object", "null"],
      properties: {
        mistura: { type: ["object", "null"], properties: { min: { type: ["number", "null"] }, max: { type: ["number", "null"] } } },
        compactacao: { type: ["object", "null"], properties: { min: { type: ["number", "null"] }, max: { type: ["number", "null"] } } },
        espalhamento: { type: ["object", "null"], properties: { min: { type: ["number", "null"] }, max: { type: ["number", "null"] } } }
      }
    },
    volume_vazios: {
      type: ["object", "null"],
      properties: {
        min: { type: ["number", "null"] },
        max: { type: ["number", "null"] },
        otimo: { type: ["number", "null"] }
      }
    },
    rtcd: { type: ["object", "null"], properties: { min: { type: ["number", "null"] } } },
    estabilidade: { type: ["object", "null"], properties: { min: { type: ["number", "null"] }, projeto: { type: ["number", "null"] } } },
    fluencia: { type: ["object", "null"], properties: { min: { type: ["number", "null"] }, max: { type: ["number", "null"] }, projeto: { type: ["number", "null"] } } },
    vam: { type: ["object", "null"], properties: { min: { type: ["number", "null"] }, projeto: { type: ["number", "null"] } } },
    rbv: { type: ["object", "null"], properties: { min: { type: ["number", "null"] }, max: { type: ["number", "null"] }, projeto: { type: ["number", "null"] } } },
    emulsao_utilizada: { type: ["string", "null"] },
    teor_ligante_residual: {
      type: ["object", "null"],
      properties: { min: { type: ["number", "null"] }, max: { type: ["number", "null"] }, otimo: { type: ["number", "null"] } }
    },
    percentual_emulsao: { type: ["number", "null"] },
    taxa_aplicacao_mraf: {
      type: ["object", "null"],
      properties: { min: { type: ["number", "null"] }, max: { type: ["number", "null"] }, otimo: { type: ["number", "null"] } }
    },
    densidade_mistura_mraf: { type: ["number", "null"] },
    melhorador_utilizado: { type: ["string", "null"] },
    umidade_otima: { type: ["number", "null"] },
    densidade_otima: { type: ["number", "null"] },
    resistencia_mpa: { type: ["number", "null"] }
  }
};

const PENEIRAS_FORMATO = `
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
- peneira_0_075mm (Nº 200)`;

// ─── Prompt Builders (Single Responsibility) ─────────────────────────────────

function buildContextHeader(tipo_projeto, faixa, regionalNome) {
  const regionalLine = regionalNome ? `- Regional: ${regionalNome}` : '';
  return `Você é um assistente especializado em extração de dados de projetos de pavimentação.

Analise o arquivo anexado e extraia todos os parâmetros técnicos do projeto de pavimentação do tipo ${tipo_projeto}.

CONTEXTO DO PROJETO:
- Tipo: ${tipo_projeto}
- Faixa Granulométrica: ${faixa.nome} (${faixa.orgao} - ${faixa.especificacao})
${regionalLine}
`;
}

function buildPromptCartaTraco() {
  return `
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
}

function buildPromptCamadasGranulares() {
  return `
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
}

function buildPromptCAUQ() {
  return `
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
- rbv: {min, max, projeto} em %`;
}

function buildPromptMRAF() {
  return `
DADOS ESPECÍFICOS DE MRAF:
- emulsao_utilizada: tipo de emulsão (ex: RL-1C)
- agregados: array simples com {nome, pedreira}
- faixa_trabalho: objeto com valores % passante para cada peneira
- faixa_trabalho_min: objeto com valores mínimos
- faixa_trabalho_max: objeto com valores máximos
- teor_ligante_residual: {min, max, otimo}
- percentual_emulsao: % de emulsão na mistura
- taxa_aplicacao_mraf: {min, max, otimo} em kg/m²
- densidade_mistura_mraf: densidade em g/cm³`;
}

function buildPromptBGS() {
  return `
DADOS ESPECÍFICOS DE BGS:
- agregados: array simples com {nome, pedreira}`;
}

function buildPromptAsfaltico(tipo_projeto, faixa) {
  const peneirasStr = faixa.peneiras?.map((p) => `${p.astm} (${p.abertura})`).join(', ') || '';

  const tipoSpecific = {
    CAUQ: buildPromptCAUQ(),
    MRAF: buildPromptMRAF(),
    BGS: buildPromptBGS(),
  }[tipo_projeto] || '';

  return `
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
${tipoSpecific}
${PENEIRAS_FORMATO}

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

function buildPrompt(tipo_projeto, faixa, regionalNome) {
  const header = buildContextHeader(tipo_projeto, faixa, regionalNome);

  if (tipo_projeto === 'CARTA_TRACO_CONCRETO') {
    return header + buildPromptCartaTraco();
  }
  if (tipo_projeto === 'CAMADAS_GRANULARES') {
    return header + buildPromptCamadasGranulares();
  }
  return header + buildPromptAsfaltico(tipo_projeto, faixa);
}

// ─── Data Fetchers (Single Responsibility) ────────────────────────────────────

async function fetchFaixa(base44, faixa_id) {
  const faixas = await base44.entities.FaixaGranulometrica.list();
  return faixas.find((f) => f.id === faixa_id) || null;
}

async function fetchRegionalNome(base44, regional_id) {
  if (!regional_id) return null;
  const regionais = await base44.entities.Regional.list();
  const regional = regionais.find((r) => r.id === regional_id);
  return regional ? `${regional.nome} (${regional.codigo})` : null;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validatePayload(payload) {
  const { file_url, tipo_projeto, faixa_id } = payload;
  if (!file_url || !tipo_projeto || !faixa_id) {
    return 'file_url, tipo_projeto e faixa_id são obrigatórios';
  }
  return null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await req.json();
    const validationError = validatePayload(payload);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const { file_url, tipo_projeto, faixa_id, regional_id } = payload;

    const [faixa, regionalNome] = await Promise.all([
      fetchFaixa(base44, faixa_id),
      fetchRegionalNome(base44, regional_id),
    ]);

    if (!faixa) {
      return Response.json({ error: 'Faixa granulométrica não encontrada' }, { status: 404 });
    }

    const prompt = buildPrompt(tipo_projeto, faixa, regionalNome);

    console.log('🤖 Chamando LLM para extração de dados...');

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      response_json_schema: RESPONSE_JSON_SCHEMA,
    });

    console.log('✅ Resposta do LLM:', resultado);

    return Response.json({ success: true, dados: resultado });

  } catch (error) {
    console.error('❌ Erro ao extrair dados:', error);
    return Response.json({
      error: 'Erro ao extrair dados do projeto',
      details: error.message,
    }, { status: 500 });
  }
});