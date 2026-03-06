import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

// Importar componentes de relatório de registros vinculados
import RelatorioDiarioComponent from "@/components/relatorios/RelatorioDiario";
import RelatorioChecklistComponent from "@/components/relatorios/RelatorioChecklist";
import RelatorioChecklistAplicacaoComponent from "@/components/relatorios/RelatorioChecklistAplicacao";
import RelatorioChecklistMRAFComponent from "@/components/relatorios/RelatorioChecklistMRAF";
import RelatorioChecklistConcretagemComponent from "@/components/relatorios/RelatorioChecklistConcretagem";
import RelatorioChecklistTerraplanagem from "@/components/relatorios/RelatorioChecklistTerraplanagem";
import RelatorioChecklistReciclagem from "@/components/relatorios/RelatorioChecklistReciclagem";

const TIPO_LABELS = {
  DiarioObra: "Diário de Obra",
  ChecklistUsina: "Checklist de Usina",
  ChecklistAplicacao: "Checklist de Aplicação",
  ChecklistMRAF: "Checklist MRAF",
  ChecklistConcretagem: "Checklist de Concretagem",
  ChecklistTerraplanagem: "Checklist de Terraplanagem",
  ChecklistReciclagem: "Checklist de Reciclagem"
};

function NCReport({ nc, obra, regional }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";
  const logoUrl = regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png";

  return (
    <div className="p-8 print:p-8 bg-white font-sans min-h-[29.7cm] flex flex-col">
      {/* Cabeçalho */}
      <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-start">
          <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 uppercase">Relatório de Não Conformidade</h1>
          <p className="text-sm text-gray-600">{obra?.name || nc.obra_nome || "—"}</p>
        </div>
        <div className="flex justify-end">
          <div className="border border-gray-400 p-2 rounded-md text-sm text-right">
            {nc.numero_rnc && <p className="font-bold text-gray-800">RNC: {nc.numero_rnc}</p>}
            <p className="text-gray-600">{formatDate(nc.data_nc)}</p>
          </div>
        </div>
      </header>

      {/* Corpo */}
      <main className="flex-grow space-y-6 text-sm">
        {/* Dados Gerais */}
        <section>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider bg-slate-100 px-3 py-1 mb-3">Dados Gerais</h2>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Cliente</p>
              <p className="text-gray-800">{nc.cliente || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Contrato</p>
              <p className="text-gray-800">{nc.contrato || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Executora</p>
              <p className="text-gray-800">{nc.executora || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Rodovia</p>
              <p className="text-gray-800">{nc.rodovia || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Trecho</p>
              <p className="text-gray-800">{nc.trecho || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Fiscal</p>
              <p className="text-gray-800">{nc.fiscal || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Campo (Afirma Evias)</p>
              <p className="text-gray-800">{nc.campo || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Criado por</p>
              <p className="text-gray-800">{nc.relatorio_criador || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
              <p className="text-gray-800 capitalize">{nc.status?.replace("_", " ") || "—"}</p>
            </div>
          </div>
        </section>

        {/* Descrição NC */}
        <section>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider bg-slate-100 px-3 py-1 mb-3">Descrição da Não Conformidade</h2>
          <div className="border border-slate-300 rounded p-4 bg-gray-50 min-h-[120px] whitespace-pre-wrap">
            {nc.descricao_nc || "—"}
          </div>
        </section>

        {/* Ações */}
        {nc.acoes && (
          <section>
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider bg-slate-100 px-3 py-1 mb-3">Ações a Serem Tomadas</h2>
            <div className="border border-slate-300 rounded p-4 bg-gray-50 min-h-[80px] whitespace-pre-wrap">
              {nc.acoes}
            </div>
          </section>
        )}

        {/* Registro vinculado */}
        {nc.checklist_ref_tipo && nc.checklist_ref_id && (
          <section>
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider bg-slate-100 px-3 py-1 mb-2">Registro de Referência</h2>
            <p className="text-gray-700">
              Tipo: <span className="font-semibold">{TIPO_LABELS[nc.checklist_ref_tipo] || nc.checklist_ref_tipo}</span>
              {" — "}ID: <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{nc.checklist_ref_id}</span>
            </p>
          </section>
        )}
      </main>

      {/* Assinaturas */}
      <footer className="mt-10 pt-6 grid grid-cols-3 gap-8">
        <div className="text-center">
          <div className="h-16 mb-2 border-b border-gray-500"></div>
          <p className="text-xs text-gray-600">{nc.relatorio_criador || "Gestor Responsável"}</p>
        </div>
        <div className="text-center">
          <div className="h-16 mb-2 border-b border-gray-500"></div>
          <p className="text-xs text-gray-600">{nc.fiscal || "Fiscal"}</p>
        </div>
        <div className="text-center">
          {nc.client_signature?.signed_by ? (
            <>
              <div className="h-16 mb-2 flex flex-col justify-end items-center text-xs text-gray-500">
                <p className="font-semibold">{nc.client_signature.engineer_name}</p>
                {nc.client_signature.crea_number && <p>CREA: {nc.client_signature.crea_number}</p>}
              </div>
              <div className="border-b border-gray-500 pt-2">
                <p className="text-xs text-gray-600">Engenheiro Cliente</p>
              </div>
            </>
          ) : (
            <>
              <div className="h-16 mb-2 border-b border-gray-500"></div>
              <p className="text-xs text-gray-600">Engenheiro Cliente</p>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function VinculadoReport({ tipo, registro, obra, regional, project, creatorUser, user }) {
  if (!tipo || !registro) return null;

  const props = { obra, regional, project, user, creatorUser };

  if (tipo === "DiarioObra") return <RelatorioDiarioComponent diario={registro} {...props} />;
  if (tipo === "ChecklistUsina") return <RelatorioChecklistComponent checklist={registro} {...props} />;
  if (tipo === "ChecklistAplicacao") return <RelatorioChecklistAplicacaoComponent checklist={registro} {...props} />;
  if (tipo === "ChecklistMRAF") return <RelatorioChecklistMRAFComponent checklist={registro} {...props} />;
  if (tipo === "ChecklistConcretagem") return <RelatorioChecklistConcretagemComponent checklist={registro} creatorUser={creatorUser} />;
  if (tipo === "ChecklistTerraplanagem") return <RelatorioChecklistTerraplanagem checklist={registro} creatorUser={creatorUser} />;
  if (tipo === "ChecklistReciclagem") return <RelatorioChecklistReciclagem checklist={registro} {...props} />;
  return null;
}

export default function RelatorioNCPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (!id) throw new Error("ID do RNC não informado");

      const [nc, user, obras, regionais, projects, allUsers] = await Promise.all([
        base44.entities.RelatorioNC.get(id),
        base44.auth.me(),
        base44.entities.Obra.list(),
        base44.entities.Regional.list(),
        base44.entities.Project.list(),
        base44.entities.User.list()
      ]);

      if (!nc) throw new Error("RNC não encontrado");

      const obra = obras.find(o => o.id === nc.obra_id) || null;
      const regional = obra ? regionais.find(r => r.id === obra.regional_id) : null;

      let registroVinculado = null;
      let project = null;
      let creatorUser = null;

      if (nc.checklist_ref_tipo && nc.checklist_ref_id) {
        try {
          registroVinculado = await base44.entities[nc.checklist_ref_tipo].get(nc.checklist_ref_id);
          if (registroVinculado?.project_id) {
            project = projects.find(p => p.id === registroVinculado.project_id) || null;
          }
          if (registroVinculado?.created_by) {
            creatorUser = allUsers.find(u => u.email?.toLowerCase() === registroVinculado.created_by?.toLowerCase()) || null;
          }
        } catch (e) {
          console.warn("Registro vinculado não encontrado:", e);
        }
      }

      setData({ nc, obra, regional, user, registroVinculado, project, creatorUser });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-red-600">Erro: {error}</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 shadow-sm z-10">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Relatório de Não Conformidade {data.nc.numero_rnc ? `– ${data.nc.numero_rnc}` : ""}
          </h2>
          <Button onClick={() => window.print()} className="bg-slate-800 text-white hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      <div className="report-content-container w-full bg-white print:bg-white">
        {/* Relatório da NC */}
        <NCReport nc={data.nc} obra={data.obra} regional={data.regional} />

        {/* Relatório do registro vinculado, na sequência */}
        {data.registroVinculado && (
          <div className="break-before-page">
            <VinculadoReport
              tipo={data.nc.checklist_ref_tipo}
              registro={data.registroVinculado}
              obra={data.obra}
              regional={data.regional}
              project={data.project}
              creatorUser={data.creatorUser}
              user={data.user}
            />
          </div>
        )}

        {/* Fotos do gestor */}
        {data.nc.fotos?.length > 0 && (
          <div className="break-before-page p-8 bg-white font-sans">
            <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex justify-start">
                <img src={data.regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo" className="h-16 object-contain" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-800 uppercase">Relatório Fotográfico</h1>
                <p className="text-sm text-gray-600">{data.nc.numero_rnc ? `RNC: ${data.nc.numero_rnc}` : "Não Conformidade"}</p>
              </div>
              <div></div>
            </header>
            <div className="grid grid-cols-2 gap-4">
              {data.nc.fotos.map((url, i) => (
                <div key={i} className="border border-slate-200 rounded p-2 flex flex-col items-center break-inside-avoid">
                  <img src={url} alt={`Foto ${i + 1}`} className="max-h-64 object-contain w-full" />
                  <p className="text-xs text-center text-gray-500 mt-1">Foto {i + 1}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDFs do gestor */}
        {data.nc.pdfs?.length > 0 && (
          <div className="break-before-page p-8 bg-white font-sans">
            <header className="grid grid-cols-3 items-center border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex justify-start">
                <img src={data.regional?.logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a58d6328b_AE-LogoVerPrincipal_1.png"} alt="Logo" className="h-16 object-contain" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-800 uppercase">Documentos Anexados</h1>
                <p className="text-sm text-gray-600">{data.nc.numero_rnc ? `RNC: ${data.nc.numero_rnc}` : "Não Conformidade"}</p>
              </div>
              <div></div>
            </header>
            <ul className="space-y-3">
              {data.nc.pdfs.map((pdf, i) => (
                <li key={i} className="flex items-center gap-3 border border-slate-200 rounded p-3">
                  <span className="text-sm font-medium text-gray-700">{i + 1}.</span>
                  <span className="flex-1 text-sm text-gray-800">{pdf.nome}</span>
                  <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline print:hidden">Abrir</a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-6 italic print:block hidden">Os documentos PDF listados foram anexados pelo gestor ao relatório de não conformidade e estão disponíveis digitalmente no sistema.</p>
          </div>
        )}
      </div>

      <style>{`
        @media screen {
          .report-content-container {
            max-width: 210mm;
            margin: 0 auto;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          }
        }
        @media print {
          * { box-sizing: border-box; }
          html, body {
            margin: 0 !important; padding: 0 !important;
            height: auto !important; overflow: visible !important;
            background: white !important;
            -webkit-print-color-adjust: exact; color-adjust: exact;
          }
          .print\\:hidden { display: none !important; }
          .report-content-container {
            width: 100% !important; max-width: none !important;
            margin: 0 !important; padding: 0 !important;
            box-shadow: none !important; border: none !important;
            background: white !important;
          }
          .break-before-page { page-break-before: always; break-before: page; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
}