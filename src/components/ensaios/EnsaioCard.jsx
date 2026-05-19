// Card de ensaio para a interface de laboratorista
import React, { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Edit, MessageSquare, MapPin, User as UserIconSmall, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getEnsaioTypeInfo, getReportLink, getDataFormatted } from "@/components/ensaios/ensaioMappers";
import { getLocalInfo, getLaboratoristaInfo, getResponsavelInfo, getEmpireiteiraInfo, getRodoviaInfo, getTrechoInfo, getNaoConformidades, getStatusInfo } from "@/components/ensaios/utils";
import { assinarEnsaio } from "@/services/ensaiosService";

const EnsaioCard = React.memo(({ ensaio, obra, user, allUsers }) => {
  const status = getStatusInfo(ensaio);
  const { name, icon: TypeIcon } = getEnsaioTypeInfo(ensaio);
  const reportUrl = getReportLink(ensaio);
  const laboratorista = getLaboratoristaInfo(ensaio, allUsers);
  const dataFormatted = getDataFormatted(ensaio);

  const editLink = createPageUrl(`${ensaio.entityType}?editId=${ensaio.id}`);
  const isCliente = user?.access_level === 'cliente';
  const podeVerPDF = ensaio.approved === true || ensaio.client_signature?.signed_by;
  const podeEditar = ensaio.created_by === user?.email && !isCliente && (ensaio.status === 'rascunho' || ensaio.approved === false) && !ensaio.client_signature?.signed_by;
  const podeAssinar = isCliente && ensaio.approved === true && !ensaio.client_signature?.signed_by;
  const jaAssinado = ensaio.client_signature?.signed_by === user?.email;

  const handleAssinar = useCallback(async () => {
    if (!window.confirm(`Confirma a assinatura digital do registro "${ensaio.sample_id || ensaio.id}"?`)) return;
    try {
      await assinarEnsaio(ensaio, user);
      alert('Registro assinado com sucesso!');
      window.location.reload();
    } catch (error) {
      alert(`Erro ao assinar registro: ${error?.message || 'Erro desconhecido'}.`);
    }
  }, [user, ensaio]);

  const renderNcBadge = () => {
    const naoConformidades = getNaoConformidades(ensaio);
    const temAcoesCorretivas = ensaio.acoes_corretivas_realizado === true;
    const temDeflexaoExcessiva = ensaio.tem_deflexao_excessiva === true;
    if (naoConformidades.length > 0) {
      const msg = temAcoesCorretivas
        ? `Não conformidades:\n${naoConformidades.join('\n')}\n\n✓ Ações corretivas foram realizadas`
        : `Não conformidades:\n${naoConformidades.join('\n')}`;
      return <span className="text-red-600 cursor-help text-xl" title={msg}>⚠️</span>;
    }
    if (temDeflexaoExcessiva) return <span className="cursor-help text-xl" title="Pontos com deflexão acima do limite admissível">🟡</span>;
    if (temAcoesCorretivas) return <span className="text-orange-500 cursor-help text-xl" title="Ações corretivas realizadas">⚠️</span>;
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 bg-white/20 backdrop-blur-lg border border-white/20 text-[#00233B]">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-[#00233B] text-lg flex items-center gap-2">
                <TypeIcon className="w-5 h-5 text-[#BFCF99]" /> {name}
                {renderNcBadge()}
              </h3>
              <p className="text-sm text-[#00233B]/70">{dataFormatted}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${status.className} gap-1.5`}>
                <status.icon className="w-3 h-3" />
                {status.text}
              </Badge>
              {status.wasRejected && <Badge className="bg-orange-100/80 text-orange-800 border border-orange-300/50 text-xs">🔄 Editado após reprovação</Badge>}
              {jaAssinado && <Badge className="bg-[#00233B]/10 text-[#00233B] border border-[#00233B]/30 text-xs">✍️ Assinado por você</Badge>}
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 pb-2 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#00233B]/80">
              <div className="flex items-center gap-1.5" title="Obra">
                <Building className="w-4 h-4 text-[#BFCF99] shrink-0" />
                <span className="font-medium text-[#00233B]">{obra?.name || 'N/A'}</span>
                <span className="text-xs">({obra?.code || 'N/A'})</span>
              </div>
              <div className="flex items-center gap-1.5" title="Laboratorista">
                <UserIconSmall className="w-4 h-4 text-[#BFCF99] shrink-0" />
                <span>{laboratorista}</span>
              </div>
              {getRodoviaInfo(ensaio) && (
                <div className="flex items-center gap-1.5" title="Rodovia">
                  <MapPin className="w-4 h-4 text-[#BFCF99] shrink-0" />
                  <span className="font-medium">{getRodoviaInfo(ensaio)}</span>
                </div>
              )}
              {getTrechoInfo(ensaio) && (
                <div className="flex items-center gap-1.5" title="Trecho">
                  <MapPin className="w-4 h-4 text-[#BFCF99] shrink-0" />
                  <span className="text-xs">Trecho: {getTrechoInfo(ensaio)}</span>
                </div>
              )}
              {getResponsavelInfo(ensaio) && (
                <div className="flex items-center gap-1.5" title="Responsável">
                  <Building className="w-4 h-4 text-[#BFCF99] shrink-0" />
                  <span className="font-medium">{getResponsavelInfo(ensaio)}</span>
                </div>
              )}
            </div>

            {ensaio.sample_id && (
              <div className="text-sm">
                <span className="font-medium text-[#00233B]">Amostra/ID: </span>
                <span className="text-[#00233B]/90">{ensaio.sample_id}</span>
              </div>
            )}

            {ensaio.client_signature?.signed_by && (
              <div className="text-sm bg-[#00233B]/5 p-2 rounded border border-[#00233B]/20">
                <span className="font-medium text-[#00233B]">Assinado por: </span>
                <span className="text-[#00233B]/80">{ensaio.client_signature.engineer_name}</span>
                {ensaio.client_signature.crea_number && (
                  <><br /><span className="font-medium text-[#00233B]">CREA: </span><span className="text-[#00233B]/80">{ensaio.client_signature.crea_number}</span></>
                )}
                <br />
                <span className="text-xs text-[#00233B]/70">{new Date(ensaio.client_signature.signed_date).toLocaleString('pt-BR')}</span>
              </div>
            )}

            {ensaio.rejection_reason && (
              <div className="text-sm bg-[#800020]/5 p-2 rounded border border-[#800020]/20">
                <span className="font-medium text-[#800020]">Motivo da Reprovação: </span>
                <span className="text-[#800020]/80">{ensaio.rejection_reason}</span>
              </div>
            )}
          </div>

          <div className="border-t border-white/20 pt-3 flex items-center gap-2 flex-wrap min-h-[38px]">
            {podeVerPDF && (
              <Button asChild variant="outline" size="sm" className="text-[#00233B] hover:bg-black/10 border-white/20">
                <Link to={reportUrl} target="_blank">
                  <FileText className="w-4 h-4 mr-1 text-[#BFCF99]" /> Ver PDF
                </Link>
              </Button>
            )}
            {podeAssinar && (
              <Button size="sm" style={{ backgroundColor: '#566E3D' }} className="text-white hover:opacity-90 transition-opacity" onClick={handleAssinar}>
                <MessageSquare className="w-4 h-4 mr-1" /> Assinar Registro
              </Button>
            )}
            {podeEditar && (
              <Button asChild size="sm" className="bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90">
                <Link to={editLink}>
                  <Edit className="w-4 h-4 mr-1 text-[#BFCF99]" /> Editar
                </Link>
              </Button>
            )}
            {ensaio.status === 'finalizado' && ensaio.approved === null && !isCliente && (
              <p className="text-sm text-[#00233B]/70 italic">Aguardando aprovação do administrador.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

EnsaioCard.displayName = 'EnsaioCard';
export default EnsaioCard;