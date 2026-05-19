// Linha de tabela para ClienteInterface
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Link } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { getEnsaioTypeInfo, getReportLink, getDataFormatted } from "@/components/ensaios/ensaioMappers";
import { getLocalInfo, getLaboratoristaInfo, getEmpireiteiraInfo, getNaoConformidades, getStatusInfo } from "@/components/ensaios/utils";
import { CopyIdButton } from "@/components/ensaios/TableFilters";

const TableRowCliente = React.memo(({ ensaio, obra, projeto, index, allUsers, onAssinar }) => {
  const status = getStatusInfo(ensaio);
  const { name, icon: TypeIcon } = getEnsaioTypeInfo(ensaio);
  const reportUrl = getReportLink(ensaio);
  const localInfo = getLocalInfo(ensaio);
  const laboratorista = getLaboratoristaInfo(ensaio, allUsers);
  const dataFormatted = getDataFormatted(ensaio);
  const podeAssinar = ensaio.approved === true && !ensaio.client_signature?.signed_by;
  const naoConformidades = getNaoConformidades(ensaio);
  const temAcoesCorretivas = ensaio.acoes_corretivas_realizado === true;

  return (
    <tr className={`border-b border-white/10 hover:bg-black/5 ${index % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.02]'}`}>
      <td className="px-2 py-2">
        <div className="font-medium text-[#00233B] flex items-center gap-1 text-xs">
          <TypeIcon className="w-3 h-3 text-[#BFCF99]" />
          <span className="truncate max-w-[120px]" title={name}>{name}</span>
          <CopyIdButton id={ensaio.id} />
          {naoConformidades.length > 0 && <span className="text-red-600 cursor-help" title={`Não conformidades:\n${naoConformidades.join('\n')}`}>⚠️</span>}
          {!naoConformidades.length && temAcoesCorretivas && <span className="text-orange-500 cursor-help" title="Ações corretivas realizadas">⚠️</span>}
        </div>
      </td>
      <td className="px-2 py-2 text-[#00233B]/90 text-xs whitespace-nowrap">{dataFormatted}</td>
      <td className="px-2 py-2">
        <div className="font-medium text-[#00233B] text-xs truncate max-w-[140px]" title={obra?.name}>{obra?.name || 'N/A'}</div>
        <div className="text-[10px] text-[#00233B]/70">{obra?.code}</div>
      </td>
      <td className="px-2 py-2 text-[#00233B]/90 text-xs truncate max-w-[100px]" title={laboratorista}>{laboratorista}</td>
      <td className="px-2 py-2">
        <div className="text-[#00233B]/90 text-xs">{localInfo.tipo}</div>
        <div className="text-[10px] text-[#00233B]/70 truncate max-w-[120px]" title={localInfo.detalhes}>{localInfo.detalhes}</div>
      </td>
      <td className="px-2 py-2">{getEmpireiteiraInfo(ensaio) ? <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]">{getEmpireiteiraInfo(ensaio)}</div> : <div className="text-[#00233B]/50 text-center text-xs">-</div>}</td>
      <td className="px-2 py-2">{projeto ? <div className="text-[#00233B]/90 text-xs truncate max-w-[100px]" title={projeto.name}>{projeto.name}</div> : <div className="text-[#00233B]/50 text-center text-xs">-</div>}</td>
      <td className="px-2 py-2 text-center">
        <Badge className={`${status.className} gap-1 text-[10px] px-2 py-0.5`}><status.icon className="w-3 h-3" />{status.text}</Badge>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="sm" className="text-[#00233B] hover:bg-[#00233B]/10 border-white/20 h-7 px-2">
            <RouterLink to={reportUrl} target="_blank"><FileText className="w-3 h-3" /></RouterLink>
          </Button>
          {podeAssinar && (
            <Button size="sm" style={{ backgroundColor: '#566E3D' }} className="text-white hover:opacity-90 h-7 px-2" onClick={() => onAssinar(ensaio)} title="Assinar">
              <MessageSquare className="w-3 h-3" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
});

TableRowCliente.displayName = 'TableRowCliente';
export default TableRowCliente;