import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ControleCauqSection({
  formData,
  selectedProject,
  handleNestedChange,
  isEditable,
  isApproved,
  validateDecimalInput,
  checkConformidadeAutomatica,
}) {
  const ensaios = [
    { key: 'extracao_ligante_rotarex', label: 'Ext. Ligante (Rotarex)', padrao: selectedProject?.teor_ligante ? `${selectedProject.teor_ligante.min} a ${selectedProject.teor_ligante.max} %` : 'N/A', decimals: 2 },
    { key: 'extracao_ligante_soxhlet', label: 'Ext. Ligante (Soxhlet)', padrao: selectedProject?.teor_ligante ? `${selectedProject.teor_ligante.min} a ${selectedProject.teor_ligante.max} %` : 'N/A', decimals: 2 },
    { key: 'granulometria', label: 'Granulometria', padrao: 'Faixa de trabalho', noResult: true },
    { key: 'densidade_rice', label: 'Densidade RICE', padrao: selectedProject?.densidade_maxima_medida ? `${selectedProject.densidade_maxima_medida} g/cm³` : 'N/A', noConformity: true, decimals: 3 },
    { key: 'densidade_aparente', label: 'Densidade Aparente', padrao: selectedProject?.massa_especifica_aparente ? `${selectedProject.massa_especifica_aparente} g/cm³` : 'N/A', noConformity: true, decimals: 3 },
    { key: 'volume_vazios', label: 'Volume de Vazios', padrao: selectedProject?.volume_vazios ? `${selectedProject.volume_vazios.min} a ${selectedProject.volume_vazios.max} %` : 'N/A', decimals: 1 },
    { key: 'vam_marshall', label: 'VAM', padrao: selectedProject?.vam ? `> ${selectedProject.vam.min} %` : 'N/A', decimals: 1 },
    { key: 'rbv', label: 'RBV', padrao: selectedProject?.rbv ? `${selectedProject.rbv.min} a ${selectedProject.rbv.max} %` : 'N/A', decimals: 1 },
    { key: 'rtcd_25c', label: 'RTCD 25°C', padrao: selectedProject?.rtcd ? `> ${selectedProject.rtcd.min} MPa` : 'N/A', decimals: 2 },
    { key: 'estabilidade', label: 'Estabilidade', padrao: selectedProject?.estabilidade ? `> ${selectedProject.estabilidade.min} N` : 'N/A', decimals: 0 },
    { key: 'fluencia', label: 'Fluência', padrao: selectedProject?.fluencia ? `${selectedProject.fluencia.min} a ${selectedProject.fluencia.max} mm` : 'Indicativo', decimals: 1 },
  ];

  return (
    <Card className="bg-slate-50">
      <CardHeader>
        <CardTitle className="text-lg">Controle de CAUQ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-2 text-sm text-left">Ensaio</th>
                <th className="border border-slate-300 px-2 py-2 text-sm">Realizado</th>
                <th className="border border-slate-300 px-2 py-2 text-sm">Qtde</th>
                <th className="border border-slate-300 px-2 py-2 text-sm">Resultado(s)</th>
                <th className="border border-slate-300 px-2 py-2 text-sm">Padrão do Projeto</th>
                <th className="border border-slate-300 px-1 text-xs text-center" colSpan="2">Conformidade</th>
              </tr>
              <tr className="bg-slate-100">
                <th colSpan="5"></th>
                <th className="border border-slate-300 px-2 py-1 text-xs text-center">✓</th>
                <th className="border border-slate-300 px-2 py-1 text-xs text-center">✗</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {ensaios.map(ensaio => {
                const quantidade = formData.controle_cauq[ensaio.key]?.quantidade || 0;
                const resultados = formData.controle_cauq[ensaio.key]?.resultados || [];
                const conforme = formData.controle_cauq[ensaio.key]?.conforme;
                const isAutoConformity = quantidade === 1 && ('conforme' in (formData.controle_cauq[ensaio.key] ?? {})) && ensaio.key !== 'granulometria' && !ensaio.noConformity;
                
                let stepValue;
                switch (ensaio.decimals) {
                  case 0: stepValue = '1'; break;
                  case 1: stepValue = '0.1'; break;
                  case 2: stepValue = '0.01'; break;
                  case 3: stepValue = '0.001'; break;
                  default: stepValue = 'any';
                }
                
                return (
                  <tr key={ensaio.key}>
                    <td className="border border-slate-300 px-2 py-2 font-medium">{ensaio.label}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {('realizado' in (formData.controle_cauq[ensaio.key] ?? {})) && (
                        <input
                          type="checkbox"
                          checked={formData.controle_cauq[ensaio.key]?.realizado || false}
                          onChange={(e) => handleNestedChange(`controle_cauq.${ensaio.key}.realizado`, e.target.checked)}
                          disabled={!isEditable || isApproved || !selectedProject}
                          className="w-4 h-4"
                        />
                      )}
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      {('quantidade' in (formData.controle_cauq[ensaio.key] ?? {})) && (
                        <Input
                          type="number"
                          min="0"
                          max="3"
                          value={formData.controle_cauq[ensaio.key]?.quantidade || ''}
                          onChange={(e) => handleNestedChange(`controle_cauq.${ensaio.key}.quantidade`, e.target.value ? parseInt(e.target.value) : 0)}
                          disabled={!isEditable || isApproved || !selectedProject}
                          className="h-8 text-sm"
                          placeholder="Qtde"
                        />
                      )}
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      {!ensaio.noResult && ('resultados' in (formData.controle_cauq[ensaio.key] ?? {})) && quantidade > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: quantidade }).map((_, resultIndex) => (
                            <Input
                              key={`result-${resultIndex}`}
                              type={ensaio.key === 'fluencia' ? 'text' : 'number'}
                              min={ensaio.key === 'fluencia' ? undefined : "0"}
                              step={ensaio.key === 'fluencia' ? undefined : stepValue}
                              value={resultados[resultIndex] ?? ''}
                              onChange={(e) => handleNestedChange(
                                `controle_cauq.${ensaio.key}.resultados.${resultIndex}`,
                                e.target.value,
                                ensaio.decimals
                              )}
                              disabled={!isEditable || isApproved || !selectedProject}
                              className="h-8 text-sm"
                              style={{ width: quantidade > 1 ? '80px' : '100%' }}
                              placeholder={quantidade > 1 ? `R${resultIndex + 1}` : 'Resultado'}
                            />
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className={`border border-slate-300 px-2 py-1 text-center text-xs ${selectedProject ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                      {ensaio.padrao}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {('conforme' in (formData.controle_cauq[ensaio.key] ?? {})) && !ensaio.noConformity ? (
                        <input
                          type="checkbox"
                          checked={conforme === true}
                          onChange={(e) => {
                            const newValue = e.target.checked ? true : null;
                            handleNestedChange(`controle_cauq.${ensaio.key}.conforme`, newValue);
                          }}
                          disabled={!isEditable || isApproved || !selectedProject || isAutoConformity}
                          className="w-4 h-4 accent-green-500"
                          title={isAutoConformity ? "Conformidade automática" : ensaio.key === 'granulometria' ? "Sempre manual" : ""}
                        />
                      ) : null}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {('conforme' in (formData.controle_cauq[ensaio.key] ?? {})) && !ensaio.noConformity ? (
                        <input
                          type="checkbox"
                          checked={conforme === false}
                          onChange={(e) => {
                            const newValue = e.target.checked ? false : null;
                            handleNestedChange(`controle_cauq.${ensaio.key}.conforme`, newValue);
                          }}
                          disabled={!isEditable || isApproved || !selectedProject || isAutoConformity}
                          className="w-4 h-4 accent-red-500"
                          title={isAutoConformity ? "Conformidade automática" : ensaio.key === 'granulometria' ? "Sempre manual" : ""}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}