import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";

export default function RelatorioTaxaMRAF() {
  const [ensaio, setEnsaio] = useState(null);
  const [obra, setObra] = useState(null);
  const [regional, setRegional] = useState(null);
  const [creatorUser, setCreatorUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) loadData(id);
  }, []);

  const loadData = async (id) => {
    try {
      const data = await base44.entities.EnsaioTaxaMRAF.get(id);
      setEnsaio(data);
      if (data.obra_id) {
        const obraData = await base44.entities.Obra.get(data.obra_id);
        setObra(obraData);
        if (obraData.regional_id) {
          const regionalData = await base44.entities.Regional.get(obraData.regional_id);
          setRegional(regionalData);
        }
      }
      if (data.created_by) {
        try {
          const users = await base44.entities.User.list();
          const u = users.find(u => u.email === data.created_by);
          setCreatorUser(u || null);
        } catch (_) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatDateBrasilia = (d) => {
    if (!d) return 'N/A';
    let n = d;
    if (!d.endsWith('Z') && !d.includes('+') && !d.includes('-', 10)) n = d + 'Z';
    return new Date(n).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' });
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!ensaio) return <div className="p-8 text-center text-red-600">Ensaio não encontrado.</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden p-4 flex gap-3 justify-end border-b">
        <Button onClick={() => window.print()} className="bg-[#00233B] text-white">
          <Printer className="w-4 h-4 mr-2" /> Gerar PDF
        </Button>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 10mm 12mm; }
        }
      `}</style>

      <div className="w-full max-w-[210mm] mx-auto bg-white py-4 px-4 print:py-3 print:px-3">
        {/* Header */}
        <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-2 mb-3">
          <div className="flex justify-start">
            <img src={regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo" className="h-12 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-sm font-bold text-gray-800 leading-tight">ENSAIO DE TAXA DE MRAF</h1>
            <p className="text-xs text-gray-500 mt-0.5">ABNT NBR 14746 / Método da Bandeja</p>
          </div>
          <div className="flex justify-end">
            <div className="border border-gray-400 px-2 py-1 rounded text-xs bg-white font-semibold">{formatDate(ensaio.data_ensaio)}</div>
          </div>
        </header>

        {/* Dados da Obra */}
        <div className="mb-2">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-2 py-0.5 font-bold text-center mb-0 text-xs">DADOS DA OBRA</div>
          <div className="grid grid-cols-4 gap-x-4 text-[10px] border border-t-0 border-slate-300 px-2 py-1">
            {/* Coluna 1: Cliente, Obra */}
            <div className="space-y-1">
              <div>
                <p className="font-bold text-gray-700">CLIENTE:</p>
                <p className="text-gray-900">{regional?.cliente || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">OBRA:</p>
                <p className="text-gray-900">{obra?.name || 'N/A'}{obra?.code ? ` (${obra.code})` : ''}</p>
              </div>
            </div>
            {/* Coluna 2: Rodovia, Trecho */}
            <div className="space-y-1">
              <div>
                <p className="font-bold text-gray-700">RODOVIA:</p>
                <p className="text-gray-900">{ensaio.rodovia || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">TRECHO:</p>
                <p className="text-gray-900">{ensaio.trecho || 'N/A'}</p>
              </div>
            </div>
            {/* Coluna 3: Projeto, Faixa Especificada */}
            <div className="space-y-1">
              <div>
                <p className="font-bold text-gray-700">Nº DO PROJETO:</p>
                <p className="text-gray-900">{ensaio.numero_projeto || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">FAIXA ESPECIFICADA:</p>
                <p className="text-gray-900">{ensaio.faixa_especificada || 'N/A'}</p>
              </div>
            </div>
            {/* Coluna 4: Placa Caminhão, Laboratorista */}
            <div className="space-y-1">
              <div>
                <p className="font-bold text-gray-700">PLACA CAMINHÃO:</p>
                <p className="text-gray-900">{ensaio.placa_caminhao || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold text-gray-700">LABORATORISTA:</p>
                <p className="text-gray-900">{ensaio.laboratorista_name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dados do Ensaio */}
        <div className="mb-2">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-2 py-0.5 font-bold text-center mb-1 text-xs">DADOS DO ENSAIO</div>

          {/* Área da Bandeja */}
          <div className="bg-slate-200 px-2 py-0.5 font-bold text-center text-[9px]">ÁREA DA BANDEJA</div>
          <table className="w-full border-collapse border border-slate-300 text-xs mb-2">
            <thead style={{backgroundColor:'#e2e8f0'}}>
              <tr>
                <th className="border border-slate-300 px-2 py-1 text-left font-medium">Parâmetro</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium">Unidade</th>
                {ensaio.ensaios?.map((_, i) => (
                  <th key={i} className="border border-slate-300 px-2 py-1 text-center font-medium">Bandeja {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white">Lado 1</td>
                <td className="border border-slate-300 px-2 py-1 text-center">cm</td>
                {ensaio.ensaios?.map((_, i) => (
                  <td key={i} className="border border-slate-300 px-2 py-1 text-center">{ensaio.dimensoes_bandeja?.lado_1 ?? '-'}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white">Lado 2</td>
                <td className="border border-slate-300 px-2 py-1 text-center">cm</td>
                {ensaio.ensaios?.map((_, i) => (
                  <td key={i} className="border border-slate-300 px-2 py-1 text-center">{ensaio.dimensoes_bandeja?.lado_2 ?? '-'}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-slate-300 px-2 py-1 bg-white font-medium">Área</td>
                <td className="border border-slate-300 px-2 py-1 text-center">m²</td>
                {ensaio.ensaios?.map((_, i) => (
                  <td key={i} className="border border-slate-300 px-2 py-1 text-center font-bold">{ensaio.dimensoes_bandeja?.area?.toFixed(4) ?? '-'}</td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Execução do Ensaio */}
          <div className="bg-slate-200 px-2 py-0.5 font-bold text-center text-[9px]">EXECUÇÃO DO ENSAIO</div>
          <table className="w-full border-collapse border border-slate-300 text-xs mb-2">
            <thead style={{backgroundColor:'#e2e8f0'}}>
              <tr>
                <th className="border border-slate-300 px-2 py-1 text-left font-medium">Parâmetro</th>
                <th className="border border-slate-300 px-2 py-1 text-center font-medium">Unidade</th>
                {ensaio.ensaios?.map((e, i) => (
                  <th key={i} className="border border-slate-300 px-2 py-1 text-center font-medium">Bandeja {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Estaca do Ensaio', calc: '–', unit: '-', field: 'estaca' },
                { label: 'Posição', calc: '–', unit: '-', field: 'posicao' },
                { label: 'Peso da Bandeja+Amostra', calc: 'P₁', unit: 'g', field: 'peso_bandeja_amostra' },
                { label: 'Peso da Bandeja', calc: 'P₂', unit: 'g', field: 'peso_bandeja' },
                { label: 'Peso da Amostra', calc: 'Pₐ = P₁ − P₂', unit: 'g', field: 'peso_amostra' },
                { label: 'Taxa de MRAF Aplicada', calc: 'Tₓ = Pₐ/(1000×A)', unit: 'kg/m²', field: 'taxa_mraf_aplicada', media: true, media_field: 'media_taxa_mraf' },
                { label: 'Teor de Ligante', calc: 'L (ensaio extração)', unit: '%', field: 'teor_ligante' },
                { label: 'Taxa de Ligante', calc: 'T_L = (Tₓ×L)/(100+L)', unit: 'L/m²', field: 'taxa_ligante' },
                { label: 'Resíduo da Emulsão', calc: 'R', unit: '%', field: 'residuo_emulsao' },
                { label: 'Taxa de Emulsão', calc: 'T_E = T_L / R', unit: 'L/m²', field: 'taxa_emulsao', media: true, media_field: 'media_taxa_emulsao' },
                { label: 'Taxa de Agregado', calc: 'T_A = Tₓ − T_L', unit: 'kg/m²', field: 'taxa_agregado', media: true, media_field: 'media_taxa_agregado' },
              ].map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="border border-slate-300 px-2 py-1 bg-white font-medium">{row.label}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{row.unit}</td>
                  {ensaio.ensaios?.map((e, i) => {
                    const val = e[row.field];
                    const taxaMin = ensaio.taxa_minima_projeto;
                    const isRateField = ['taxa_mraf_aplicada','taxa_ligante','taxa_emulsao','taxa_agregado'].includes(row.field);
                    const naoConforme = row.field === 'taxa_mraf_aplicada' && taxaMin != null && val != null && val < taxaMin;
                    return (
                      <td key={i} className={`border border-slate-300 px-2 py-1 text-center ${naoConforme ? 'bg-red-100 text-red-700 font-bold' : ''}`}>
                        {val != null ? (typeof val === 'number' ? (isRateField ? val.toFixed(1) : val.toFixed(['estaca','posicao'].includes(row.field) ? 0 : 3).replace(/\.?0+$/, '')) : val) : '-'}
                        {naoConforme && <span className="block text-[9px] text-red-600">NC</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo de Médias */}
        <div className="mb-2">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-2 py-0.5 font-bold text-center mb-1 text-xs">RESUMO — MÉDIAS GERAIS</div>
          <div className="grid grid-cols-3 border border-slate-300 text-xs">
            {[
              { label: 'Taxa de Emulsão Média', field: 'media_taxa_emulsao', unit: 'L/m²', isMain: false },
              { label: 'Taxa de Agregado Média', field: 'media_taxa_agregado', unit: 'kg/m²', isMain: false },
              { label: 'Taxa MRAF Aplicada Média', field: 'media_taxa_mraf', unit: 'kg/m²', isMain: true },
            ].map((item, idx) => {
              const val = ensaio[item.field];
              const taxaMin = ensaio.taxa_minima_projeto;
              const naoConforme = item.isMain && taxaMin != null && val != null && val < taxaMin;
              const conforme = item.isMain && taxaMin != null && val != null && val >= taxaMin;
              return (
                <div key={idx} className={`p-2 text-center border-r last:border-r-0 border-slate-300 ${naoConforme ? 'bg-red-50' : ''}`}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{color:'#2d3b4e'}}>{item.label}</p>
                  <p className={`text-base font-bold ${naoConforme ? 'text-red-700' : ''}`} style={!naoConforme ? {color:'#2d3b4e'} : {}}>
                    {val != null ? val.toFixed(1) : '-'}
                  </p>
                  <p className="text-[9px] text-slate-500">{item.unit}</p>
                  {naoConforme && <p className="text-[9px] font-bold text-red-600 mt-0.5">⚠ NC — mín: {taxaMin} {item.unit}</p>}
                  {conforme && <p className="text-[9px] font-bold text-green-700 mt-0.5">✓ Conforme — mín: {taxaMin} {item.unit}</p>}
                </div>
              );
            })}
          </div>
        </div>

        {ensaio.observacoes && (
          <div className="mb-2 text-xs">
            <span className="font-bold">Observações: </span>{ensaio.observacoes}
          </div>
        )}

        {/* Assinaturas */}
        <footer className="pt-4">
          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="text-center">
              <div className="text-[8px] text-slate-500 mb-0.5 min-h-[32px] flex flex-col justify-end items-center">
                {ensaio.laboratorista_name && (
                  <>
                    <p className="leading-tight">Assinado digitalmente por</p>
                    <p className="font-bold text-slate-600 leading-tight">{ensaio.laboratorista_name}</p>
                    <p className="leading-tight text-[7px]">{ensaio.created_by}</p>
                    <p className="leading-tight text-[7px]">em {formatDateBrasilia(ensaio.created_date)}</p>
                  </>
                )}
              </div>
              <div className="border-t border-gray-500 pt-0.5">
                <p className="text-[9px]">{creatorUser?.position || 'Laboratorista Responsável'}</p>
              </div>
            </div>
            <div className="text-center">
              {ensaio.approver_details ? (
                <>
                  <div className="text-[8px] text-slate-500 mb-0.5 min-h-[32px] flex flex-col justify-end items-center">
                    <p className="leading-tight">Aprovado digitalmente por</p>
                    <p className="font-bold text-slate-600 leading-tight">{ensaio.approver_details.name}</p>
                    <p className="leading-tight text-[7px]">{ensaio.approved_by}</p>
                    {ensaio.approver_details.crea_number && <p className="leading-tight text-[7px]">CREA: {ensaio.approver_details.crea_number}</p>}
                    <p className="leading-tight text-[7px]">em {formatDateBrasilia(ensaio.approved_date)}</p>
                  </div>
                  <div className="border-t border-gray-500 pt-0.5"><p className="text-[9px]">{ensaio.approver_details.position || 'Engenheiro Responsável'}</p></div>
                </>
              ) : (
                <>
                  <div className="min-h-[32px]" />
                  <div className="border-t border-gray-500 pt-0.5"><p className="text-[9px]">Engenheiro Responsável</p></div>
                </>
              )}
            </div>
            <div className="text-center">
              {ensaio.client_signature?.signed_by ? (
                <>
                  <div className="text-[8px] text-slate-500 mb-0.5 min-h-[32px] flex flex-col justify-end items-center">
                    <p className="leading-tight">Assinado digitalmente por</p>
                    <p className="font-bold text-slate-600 leading-tight">{ensaio.client_signature.engineer_name}</p>
                    <p className="leading-tight text-[7px]">{ensaio.client_signature.signed_by}</p>
                    {ensaio.client_signature.crea_number && <p className="leading-tight text-[7px]">CREA: {ensaio.client_signature.crea_number}</p>}
                    <p className="leading-tight text-[7px]">em {formatDateBrasilia(ensaio.client_signature.signed_date)}</p>
                  </div>
                  <div className="border-t border-gray-500 pt-0.5"><p className="text-[9px]">Engenheiro Cliente</p></div>
                </>
              ) : (
                <>
                  <div className="min-h-[32px]" />
                  <div className="border-t border-gray-500 pt-0.5"><p className="text-[9px]">Engenheiro Cliente</p></div>
                </>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}