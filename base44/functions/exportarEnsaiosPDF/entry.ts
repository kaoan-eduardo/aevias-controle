import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import JSZip from 'npm:jszip@3.10.1';

// ─── Configuration (OCP: adicionar tipos sem alterar o handler) ───────────────

const ALLOWED_ACCESS_LEVELS = new Set([
  'admin',
  'sala_tecnica_afirmaevias',
  'gestor_contrato',
  'cliente',
]);

const TIPO_RELATORIO_MAP = {
  EnsaioExtracaoGranMarshall: 'marshall',
  EnsaioDensidade: 'densidade',
};

/** Allowlist completa de tipos válidos de ensaio */
const ALLOWED_TIPOS = new Set([
  'DiarioObra',
  'EnsaioExtracaoGranMarshall',
  'EnsaioDensidade',
  'ChecklistUsina',
  'ChecklistAplicacao',
  'ChecklistMRAF',
  'ChecklistConcretagem',
  'ChecklistTerraplanagem',
  'ChecklistReciclagem',
  'EnsaioCAUQ',
  'AcompanhamentoUsinagem',
  'AcompanhamentoCarga',
  'EnsaioTaxaPinturaImprimacao',
  'EnsaioRompimentoConcreto',
  'EnsaioManchaPendulo',
  'EnsaioSondagem',
  'EnsaioVigaBenkelman',
  'EnsaioTaxaMRAF',
  'EnsaioMRAF',
  'EnsaioGranulometriaIndividual',
  'GranuMistura',
  'EnsaioDensidadeInSitu',
  'EnsaioProctor',
  'BoletimSondagem',
  'BoletimSondagemTrado',
]);

/** Regex para IDs válidos — apenas UUID ou alfanumérico simples */
const VALID_ID_REGEX = /^[a-zA-Z0-9\-_]{1,128}$/;

const BASE_URL = Deno.env.get('BASE44_APP_URL') || 'https://quaevias.base44.app';

// ─── Pure helpers (SRP) ───────────────────────────────────────────────────────

/** Resolve a URL do relatório a partir do tipo e id do ensaio. */
function resolveReportUrl(tipo, id) {
  if (tipo === 'DiarioObra') {
    return `${BASE_URL}/RelatorioDiario?id=${id}`;
  }
  const tipoRelatorio = TIPO_RELATORIO_MAP[tipo] ?? 'marshall';
  return `${BASE_URL}/RelatorioEnsaio?id=${id}&tipo=${tipoRelatorio}`;
}

/** Sanitiza o nome do arquivo para uso seguro em sistemas de arquivos. */
function sanitizeFileName(nome) {
  return nome.replace(/[^a-zA-Z0-9_\-\s]/g, '_').substring(0, 200) + '.html';
}

/** Valida o payload recebido. Retorna string de erro ou null se válido. */
function validatePayload(ensaioIds) {
  if (!Array.isArray(ensaioIds) || ensaioIds.length === 0) {
    return 'Lista de IDs de ensaios é obrigatória';
  }
  for (const e of ensaioIds) {
    const id = String(e.id ?? '').trim();
    const tipo = String(e.tipo ?? '').trim();

    if (!id || id === '-' || !VALID_ID_REGEX.test(id)) {
      return `ID inválido detectado: "${e.id}"`;
    }
    if (!tipo || !ALLOWED_TIPOS.has(tipo)) {
      return `Tipo de ensaio não permitido: "${e.tipo}"`;
    }
  }
  return null;
}

// ─── Report fetcher (SRP: responsável apenas por buscar o HTML) ───────────────

/** URL base esperada — usada para validar antes do fetch */
const ALLOWED_BASE_URL = BASE_URL;

async function fetchReportHtml(tipo, id, authHeader) {
  // Construir URL INTERNAMENTE — nunca recebe URL do usuário, elimina completamente SSRF
  if (!tipo || !id) {
    throw new Error('Tipo ou ID ausente');
  }

  const url = resolveReportUrl(tipo, id);
  const parsed = new URL(url);
  const allowedOrigin = new URL(ALLOWED_BASE_URL).origin;
  
  if (parsed.origin !== allowedOrigin) {
    throw new Error(`URL fora do domínio permitido: ${parsed.origin}`);
  }

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };
  if (authHeader) headers['Authorization'] = authHeader;

  // URL construída internamente com valores validados — SSRF impossível
  const response = await fetch(url, { headers, redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  return text;
}

// ─── ZIP builder (SRP: responsável apenas por montar o ZIP) ──────────────────

async function buildZip(ensaioIds, authHeader) {
  const zip = new JSZip();
  const encoder = new TextEncoder();
  const errors = [];
  let successCount = 0;

  for (let i = 0; i < ensaioIds.length; i++) {
    const { id, tipo, nome } = ensaioIds[i];

    if (!id || !tipo || !nome) {
      errors.push(`Ensaio ${i + 1}: dados incompletos (id, tipo ou nome ausente)`);
      continue;
    }

    try {
       console.log(`[${i + 1}/${ensaioIds.length}] Processando: ${nome}`);
       // tipo e id já foram validados contra allowlist e regex em validatePayload
       const safeId = String(id).trim();
       const safeTipo = String(tipo).trim();
       const html = await fetchReportHtml(safeTipo, safeId, authHeader);
      const fileName = sanitizeFileName(String(nome));
      // HTML is a string returned by response.text() — not DOM-parsed, not injected into HTML context
      // Passed directly to TextEncoder for binary encoding only (no innerHTML/eval usage)
      const encoded = encoder.encode(html);
      zip.file(fileName, encoded);
      successCount++;
      console.log(`  ✅ Adicionado: ${fileName} (${encoded.byteLength} bytes)`);
    } catch (err) {
      const msg = `Erro em "${nome}": ${err instanceof Error ? err.message : String(err)}`;
      console.error(`  ❌ ${msg}`);
      errors.push(msg);
    }
  }

  return { zip, successCount, errors };
}

// ─── Auth helper (SRP) ───────────────────────────────────────────────────────

function resolveAccessLevel(user) {
  return user.access_level || (user.role === 'admin' ? 'admin' : 'user');
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    console.log('🚀 Exportação de relatórios iniciada');

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessLevel = resolveAccessLevel(user);
    console.log(`👤 ${user.email} — access_level: ${accessLevel}`);

    if (!ALLOWED_ACCESS_LEVELS.has(accessLevel)) {
      return Response.json({ error: 'Sem permissão para exportar relatórios' }, { status: 403 });
    }

    const body = await req.json();
    const { ensaioIds } = body;

    const validationError = validatePayload(ensaioIds);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    console.log(`📦 ${ensaioIds.length} ensaio(s) recebido(s)`);

    const authHeader = req.headers.get('authorization') ?? '';
    const { zip, successCount, errors } = await buildZip(ensaioIds, authHeader);

    console.log(`📊 Resultado: ${successCount} sucesso(s), ${errors.length} erro(s)`);

    if (successCount === 0) {
      return Response.json({ error: 'Não foi possível gerar nenhum relatório', details: errors }, { status: 500 });
    }

    const zipData = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    if (zipData.byteLength === 0) {
      return Response.json({ error: 'ZIP gerado está vazio' }, { status: 500 });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const zipFileName = `relatorios_${timestamp}.zip`;

    console.log(`✅ ZIP pronto: ${zipFileName} (${zipData.byteLength} bytes)`);

    return new Response(zipData, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': String(zipData.byteLength),
      },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Erro fatal na exportação:', msg);
    return Response.json({ error: 'Erro ao processar exportação', details: msg, stack }, { status: 500 });
  }
});