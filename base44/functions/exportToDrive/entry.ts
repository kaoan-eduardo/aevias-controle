import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import PDFDocument from 'npm:pdfkit@0.14.0';

const ENTITY_LABELS = {
  DiarioObra: 'Diário de Obra',
  ChecklistUsina: 'Checklist de Usina',
  ChecklistAplicacao: 'Checklist de Aplicação',
  ChecklistMRAF: 'Checklist de MRAF',
  ChecklistConcretagem: 'Checklist de Concretagem',
  ChecklistTerraplanagem: 'Checklist de Terraplanagem',
  ChecklistReciclagem: 'Checklist de Reciclagem',
  AcompanhamentoCarga: 'Acompanhamento de Cargas',
  AcompanhamentoUsinagem: 'Acompanhamento de Usinagem',
  EnsaioCAUQ: 'Ensaio CAUQ',
  EnsaioSondagem: 'Ensaio de Sondagem',
  EnsaioDensidadeInSitu: 'Ensaio Densidade In Situ',
  EnsaioTaxaPinturaImprimacao: 'Taxa de Pintura Imprimação',
  EnsaioManchaPendulo: 'Mancha e Pendulo',
  EnsaioVigaBenkelman: 'Viga Benkelman',
  EnsaioTaxaMRAF: 'Taxa MRAF',
  EnsaioMRAF: 'Ensaio MRAF',
  EnsaioGranAreia: 'Granulometria e Equiv Areia',
  EnsaioGranulometriaIndividual: 'Granulometria Individual',
  BoletimSondagem: 'Boletim de Sondagem',
  BoletimSondagemTrado: 'Boletim Sondagem Trado',
};

const FIELD_LABELS = {
  data: 'Data',
  data_ensaio: 'Data do Ensaio',
  laboratorista_name: 'Laboratorista',
  rodovia: 'Rodovia',
  trecho: 'Trecho',
  sub_trecho: 'Sub-trecho',
  empreiteira: 'Empreiteira',
  usina: 'Usina',
  usina_fornecedora: 'Usina Fornecedora',
  ligante: 'Ligante',
  pedreira: 'Pedreira',
  engenheiro_responsavel: 'Engenheiro Responsavel',
  status: 'Status',
  observacoes: 'Observacoes',
  observacoes_gerais: 'Observacoes Gerais',
  material: 'Material',
  estaca: 'Estaca',
  camada: 'Camada',
  condicoes_climaticas: 'Condicoes Climaticas',
  temperatura: 'Temperatura (C)',
  atividades_realizadas: 'Atividades Realizadas',
  inspetor_campo: 'Inspetor de Campo',
  inspetor_fiscal: 'Inspetor Fiscal',
  faixa_especificada: 'Faixa Especificada',
  projeto_utilizado: 'Projeto Utilizado',
  concreteira: 'Concreteira',
  fck: 'fck (MPa)',
  volume: 'Volume (m3)',
  ensaio_realizado_por: 'Ensaio Realizado Por',
  umidade_otima_proctor: 'Umidade Otima Proctor (%)',
  umidade_in_situ: 'Umidade In Situ (%)',
  servico: 'Servico',
  cliente: 'Cliente',
  tipo_local: 'Tipo de Local',
  faixa: 'Faixa',
  inspetor_campo: 'Inspetor de Campo',
  local_coleta: 'Local de Coleta',
  placa_caminhao: 'Placa do Caminhao',
  tipo_ligante: 'Tipo de Ligante',
  horario: 'Horario',
  estrutura: 'Estrutura',
};

async function getOrCreateFolder(accessToken, name, parentId, base44, pathKey) {
  const cached = await base44.asServiceRole.entities.DriveExportFolder.filter({ path: pathKey });
  if (cached.length > 0) return cached[0].folder_id;

  const meta = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) meta.parents = [parentId];

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(meta),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive folder creation failed: ${err}`);
  }

  const folder = await res.json();
  await base44.asServiceRole.entities.DriveExportFolder.create({ path: pathKey, folder_id: folder.id });
  return folder.id;
}

function extractFields(record) {
  const fields = [];
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const val = record[key];
    if (val !== undefined && val !== null && val !== '') {
      fields.push({ label, value: String(val) });
    }
  }
  return fields;
}

async function generatePDF(entityName, record, obra) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const label = ENTITY_LABELS[entityName] || entityName;
    const obraName = obra ? `${obra.name} (${obra.code})` : 'Sem Obra';
    const pageWidth = doc.page.width;

    // Header
    doc.rect(0, 0, pageWidth, 75).fill('#00233B');
    doc.fillColor('#BFCF99').fontSize(16).font('Helvetica-Bold').text('AFIRMAEVIAS', 50, 20, { width: 400 });
    doc.fillColor('#FFFFFF').fontSize(12).text(label.toUpperCase(), 50, 44, { width: 400 });

    doc.y = 90;

    // Obra / meta info
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#00233B').text('Obra: ', { continued: true });
    doc.font('Helvetica').fillColor('#333333').text(obraName);

    const recDate = record.data || record.data_ensaio;
    if (recDate) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#00233B').text('Data: ', { continued: true });
      doc.font('Helvetica').fillColor('#333333').text(String(recDate));
    }

    if (record.laboratorista_name) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#00233B').text('Laboratorista: ', { continued: true });
      doc.font('Helvetica').fillColor('#333333').text(record.laboratorista_name);
    }

    doc.moveDown(0.4);
    doc.moveTo(50, doc.y).lineTo(pageWidth - 50, doc.y).strokeColor('#BFCF99').stroke();
    doc.moveDown(0.5);

    // Fields table
    const fields = extractFields(record);
    // Remove already shown fields
    const shownKeys = ['data', 'data_ensaio', 'laboratorista_name'];
    const remaining = fields.filter(f => !shownKeys.some(k => FIELD_LABELS[k] === f.label));

    for (const { label: fl, value } of remaining) {
      if (doc.y > 730) {
        doc.addPage();
        doc.y = 50;
      }
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#00233B').text(fl + ': ', { continued: true });
      doc.font('Helvetica').fillColor('#444444').text(value);
    }

    // Footer
    doc.fontSize(7).fillColor('#AAAAAA').text(
      `Exportado automaticamente em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} | ID: ${record.id || ''}`,
      50,
      doc.page.height - 40,
      { align: 'center', width: pageWidth - 100 }
    );

    doc.end();
  });
}

async function uploadToDrive(accessToken, folderId, filename, pdfBuffer) {
  const metadata = { name: filename, parents: [folderId], mimeType: 'application/pdf' };
  const metaStr = JSON.stringify(metadata);
  const boundary = 'ae_pdf_boundary_271828';

  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaStr}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;

  const headBytes = new TextEncoder().encode(head);
  const tailBytes = new TextEncoder().encode(tail);
  const pdfBytes = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);

  const body = new Uint8Array(headBytes.length + pdfBytes.length + tailBytes.length);
  body.set(headBytes, 0);
  body.set(pdfBytes, headBytes.length);
  body.set(tailBytes, headBytes.length + pdfBytes.length);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed: ${err}`);
  }

  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const base44 = createClientFromRequest(req);

    let entityName, recordId, record;

    if (payload.event) {
      // Triggered from entity automation
      entityName = payload.event.entity_name;
      recordId = payload.event.entity_id;
      record = payload.data && !payload.payload_too_large
        ? payload.data
        : await base44.asServiceRole.entities[entityName].get(recordId);
    } else {
      // Direct invocation
      entityName = payload.entity_name;
      recordId = payload.record_id;
      record = await base44.asServiceRole.entities[entityName].get(recordId);
    }

    if (!entityName || !recordId) {
      return Response.json({ error: 'Missing entity_name or record_id' }, { status: 400 });
    }

    // Get Obra for folder naming
    const obraId = record.obra_id;
    let obra = null;
    if (obraId) {
      obra = await base44.asServiceRole.entities.Obra.get(obraId);
    }

    // Get Drive access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Build folder hierarchy: AfirmaEvias Registros / Obra / TipoRegistro
    const rootId = await getOrCreateFolder(accessToken, 'AfirmaEvias Registros', null, base44, 'root');

    const obraKey = `obra_${obraId || 'none'}`;
    const obraFolderName = obra ? `${obra.name} (${obra.code})` : 'Sem Obra';
    const obraFolderId = await getOrCreateFolder(accessToken, obraFolderName, rootId, base44, obraKey);

    const typeKey = `${obraKey}_${entityName}`;
    const typeLabel = ENTITY_LABELS[entityName] || entityName;
    const typeFolderId = await getOrCreateFolder(accessToken, typeLabel, obraFolderId, base44, typeKey);

    // Generate PDF
    const pdfBuffer = await generatePDF(entityName, record, obra);

    // Build filename: YYYYMMDD_Laboratorista_lastID.pdf
    const rawDate = record.data || record.data_ensaio || new Date().toISOString().split('T')[0];
    const dateStr = String(rawDate).replace(/-/g, '');
    const labStr = (record.laboratorista_name || 'lab').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
    const idSuffix = recordId.slice(-6);
    const filename = `${dateStr}_${labStr}_${idSuffix}.pdf`;

    // Upload
    const uploaded = await uploadToDrive(accessToken, typeFolderId, filename, pdfBuffer);

    console.log(`Exported ${entityName} ${recordId} -> Drive file ${uploaded.id} (${filename})`);
    return Response.json({ success: true, file_id: uploaded.id, filename });
  } catch (error) {
    console.error('exportToDrive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});