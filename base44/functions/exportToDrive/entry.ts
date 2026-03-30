import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@2.5.1';

const ENTITY_DISPLAY_NAMES = {
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
  EnsaioTaxaPinturaImprimacao: 'Taxa de Pintura/Imprimação',
  EnsaioManchaPendulo: 'Mancha + Pêndulo',
  EnsaioVigaBenkelman: 'Viga Benkelman',
  EnsaioTaxaMRAF: 'Taxa MRAF',
  EnsaioMRAF: 'Ensaio MRAF',
  EnsaioGranulometriaIndividual: 'Granulometria Individual',
  EnsaioGranAreia: 'Granulometria + Equiv. Areia',
};

const FIELD_LABELS = {
  data: 'Data',
  data_ensaio: 'Data do Ensaio',
  laboratorista_name: 'Laboratorista',
  rodovia: 'Rodovia',
  trecho: 'Trecho',
  empreiteira: 'Empreiteira',
  usina: 'Usina',
  estaca: 'Estaca',
  camada: 'Camada',
  material: 'Material',
  engenheiro_responsavel: 'Engenheiro Responsável',
  inspetor_campo: 'Inspetor de Campo',
  inspetor_fiscal: 'Inspetor Fiscal',
  status: 'Status',
  observacoes_gerais: 'Observações Gerais',
  observacoes: 'Observações',
  servico: 'Serviço',
  concreteira: 'Concreteira',
  fck: 'FCK',
  estrutura: 'Estrutura',
  tipo_local: 'Tipo de Local',
  condicoes_climaticas: 'Condições Climáticas',
  temperatura: 'Temperatura',
  atividades_realizadas: 'Atividades Realizadas',
  local_coleta: 'Local de Coleta',
  placa_caminhao: 'Placa do Caminhão',
  faixa_especificada: 'Faixa Especificada',
  ligante: 'Ligante',
  pedreira: 'Pedreira',
  projeto_utilizado: 'Projeto Utilizado',
  ensaio_realizado_por: 'Ensaio Realizado Por',
};

async function getOrCreateFolder(base44, accessToken, parentId, name, pathKey) {
  // Check cache
  const existing = await base44.asServiceRole.entities.DriveFolderMap.filter({ path_key: pathKey });
  if (existing && existing.length > 0) {
    return existing[0].folder_id;
  }

  // Create folder in Drive
  const body = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) body.parents = [parentId];

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const folder = await res.json();
  if (!folder.id) throw new Error(`Failed to create folder "${name}": ${JSON.stringify(folder)}`);

  // Cache it
  await base44.asServiceRole.entities.DriveFolderMap.create({
    path_key: pathKey,
    folder_id: folder.id,
    folder_name: name,
  });

  return folder.id;
}

function generatePDF(entityName, record, obraName) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const displayName = ENTITY_DISPLAY_NAMES[entityName] || entityName;
  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;

  // Header bar
  doc.setFillColor(0, 35, 59); // #00233B
  doc.rect(0, 0, pageW, 22, 'F');

  doc.setTextColor(191, 207, 153); // #BFCF99
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('AFIRMA EVIAS', margin, 10);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(displayName, margin, 17);

  // Subtitle
  doc.setTextColor(0, 35, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Obra: ${obraName || 'N/A'}`, margin, 32);

  const dateStr = record.data || record.data_ensaio || '';
  if (dateStr) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Data: ${dateStr}`, margin, 39);
  }

  // Divider
  doc.setDrawColor(191, 207, 153);
  doc.setLineWidth(0.5);
  doc.line(margin, 43, pageW - margin, 43);

  // Fields
  let y = 50;
  const lineHeight = 8;
  const colLabel = margin;
  const colValue = margin + 55;

  doc.setFontSize(9);

  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const val = record[key];
    if (val === undefined || val === null || val === '') continue;
    if (typeof val === 'object') continue; // skip nested objects

    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 35, 59);
    doc.text(`${label}:`, colLabel, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const valStr = String(val);
    const lines = doc.splitTextToSize(valStr, contentW - 55);
    doc.text(lines, colValue, y);
    y += lineHeight * Math.max(1, lines.length);
  }

  // Jornada
  if (record.jornada) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 35, 59);
    doc.text('Jornada:', colLabel, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const jStr = `${record.jornada.horario_inicio || ''} - ${record.jornada.horario_fim || ''}`;
    doc.text(jStr, colValue, y);
    y += lineHeight;
  }

  // NCs summary
  if (record.nao_conformidades && record.nao_conformidades.length > 0) {
    if (y > 260) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 4, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 35, 59);
    doc.setFontSize(9);
    doc.text(`Não Conformidades (${record.nao_conformidades.length})`, margin + 2, y);
    y += 7;

    for (const nc of record.nao_conformidades) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 0, 0);
      const ncLine = `• [${nc.categoria_nc || ''}] ${nc.descricao || nc.parametro_nc || ''}`;
      const ncLines = doc.splitTextToSize(ncLine, contentW);
      doc.text(ncLines, margin + 2, y);
      y += lineHeight * Math.max(1, ncLines.length);
    }
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')} — Página ${i}/${totalPages}`,
      margin,
      290
    );
  }

  return doc.output('arraybuffer');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { entityName, recordId } = await req.json();

    if (!entityName || !recordId) {
      return Response.json({ error: 'entityName and recordId are required' }, { status: 400 });
    }

    // Fetch record
    const record = await base44.asServiceRole.entities[entityName].get(recordId);
    if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });

    // Fetch obra
    let obraName = 'Obra Desconhecida';
    if (record.obra_id) {
      try {
        const obra = await base44.asServiceRole.entities.Obra.get(record.obra_id);
        if (obra) obraName = obra.name || obra.code || obraName;
      } catch (_) {}
    }

    // Get Drive token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Ensure folder structure
    const rootId = await getOrCreateFolder(base44, accessToken, null, 'AfirmaEvias - Registros', 'root');
    const obraFolderId = await getOrCreateFolder(
      base44, accessToken, rootId,
      obraName,
      `obra_${record.obra_id || 'unknown'}`
    );
    const displayName = ENTITY_DISPLAY_NAMES[entityName] || entityName;
    const typeFolderId = await getOrCreateFolder(
      base44, accessToken, obraFolderId,
      displayName,
      `obra_${record.obra_id || 'unknown'}_${entityName}`
    );

    // Generate PDF
    const pdfBuffer = generatePDF(entityName, record, obraName);

    // Build filename
    const dateStr = (record.data || record.data_ensaio || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const labName = (record.laboratorista_name || '').replace(/\s+/g, '_').slice(0, 20);
    const fileName = `${displayName}_${dateStr}${labName ? '_' + labName : ''}_${recordId.slice(-6)}.pdf`;

    // Upload to Drive (multipart)
    const boundary = '-------afirmaevias_boundary';
    const metadata = JSON.stringify({ name: fileName, parents: [typeFolderId] });

    const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`;
    const filePart = `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`;
    const closePart = `\r\n--${boundary}--`;

    const encoder = new TextEncoder();
    const parts = [
      encoder.encode(metaPart),
      encoder.encode(filePart),
      new Uint8Array(pdfBuffer),
      encoder.encode(closePart),
    ];

    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      body.set(part, offset);
      offset += part.length;
    }

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(totalLength),
        },
        body,
      }
    );

    const uploaded = await uploadRes.json();
    if (!uploaded.id) throw new Error(`Upload failed: ${JSON.stringify(uploaded)}`);

    console.log(`✅ Uploaded ${fileName} → Drive ID: ${uploaded.id}`);
    return Response.json({ success: true, driveFileId: uploaded.id, fileName });
  } catch (error) {
    console.error('exportToDrive error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});