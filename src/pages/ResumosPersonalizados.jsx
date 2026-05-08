import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Loader2, X, FileSpreadsheet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";

const TIPOS_ENSAIO = [
  { value: "EnsaioCAUQ", label: "Ensaio CAUQ" },
  { value: "EnsaioSondagem", label: "Sondagem" },
  { value: "EnsaioDensidadeInSitu", label: "Densidade In Situ" },
  { value: "EnsaioTaxaPinturaImprimacao", label: "Taxa de Pintura/Imprimação" },
  { value: "EnsaioManchaPendulo", label: "Mancha + Pêndulo" },
  { value: "ChecklistUsina", label: "Checklist de Usina" },
  { value: "ChecklistAplicacao", label: "Checklist de Aplicação" },
  { value: "ChecklistMRAF", label: "Checklist MRAF" },
  { value: "ChecklistConcretagem", label: "Checklist de Concretagem" },
  { value: "ChecklistTerraplanagem", label: "Checklist de Terraplanagem" },
  { value: "ChecklistReciclagem", label: "Checklist de Reciclagem" },
  { value: "DiarioObra", label: "Diário de Obra" }
];

const CAMPOS_POR_TIPO = {
  EnsaioCAUQ: [
    { key: "data_ensaio", label: "Data" },
    { key: "laboratorista_name", label: "Laboratorista" },
    { key: "rodovia", label: "Rodovia" },
    { key: "usina_fornecedora", label: "Usina" },
    { key: "project_name", label: "Projeto" },
    { key: "extracao_ligante.teor_ligante", label: "Teor Ligante (%)" },
    { key: "extracao_ligante.teor_ligante_real", label: "Teor Ligante Real (%)" },
    { key: "granulometria", label: "Granulometria (% passante)", subfields: [
      { key: "peneira_75_0mm", label: 'Nº 3"', astm: 'Nº 3"' },
      { key: "peneira_63_0mm", label: 'Nº 2½"', astm: 'Nº 2½"' },
      { key: "peneira_50_0mm", label: 'Nº 2"', astm: 'Nº 2"' },
      { key: "peneira_37_5mm", label: 'Nº 1½"', astm: 'Nº 1½"' },
      { key: "peneira_25_0mm", label: 'Nº 1"', astm: 'Nº 1"' },
      { key: "peneira_19_0mm", label: 'Nº ¾"', astm: 'Nº ¾"' },
      { key: "peneira_16_0mm", label: 'Nº ⅝"', astm: 'Nº ⅝"' },
      { key: "peneira_12_5mm", label: 'Nº ½"', astm: 'Nº ½"' },
      { key: "peneira_9_5mm", label: 'Nº ⅜"', astm: 'Nº ⅜"' },
      { key: "peneira_4_75mm", label: "Nº 4", astm: "Nº 4" },
      { key: "peneira_2_36mm", label: "Nº 8", astm: "Nº 8" },
      { key: "peneira_2_0mm", label: "Nº 10", astm: "Nº 10" },
      { key: "peneira_1_18mm", label: "Nº 16", astm: "Nº 16" },
      { key: "peneira_0_6mm", label: "Nº 30", astm: "Nº 30" },
      { key: "peneira_0_42mm", label: "Nº 40", astm: "Nº 40" },
      { key: "peneira_0_3mm", label: "Nº 50", astm: "Nº 50" },
      { key: "peneira_0_18mm", label: "Nº 80", astm: "Nº 80" },
      { key: "peneira_0_15mm", label: "Nº 100", astm: "Nº 100" },
      { key: "peneira_0_075mm", label: "Nº 200", astm: "Nº 200" }
    ]},
    { key: "corpos_prova_marshall", label: "Parâmetros Marshall", subfields: [
      { key: "densidade_aparente", label: "Densidade Aparente (g/cm³)" },
      { key: "volume_vazios", label: "Volume Vazios (%)" },
      { key: "vam", label: "VAM (%)" },
      { key: "rbv", label: "RBV (%)" },
      { key: "rtcd_valor", label: "RTCD (MPa)" },
      { key: "estabilidade_corrigida", label: "Estabilidade (Kgf/cm²)" },
      { key: "fluencia", label: "Fluência (mm)" }
    ]},
    { key: "densidade_rice.densidade_rice", label: "RICE - Densidade (g/cm³)" },
    { key: "approved", label: "Status Aprovação" }
  ],
  EnsaioSondagem: [
    { key: "data", label: "Data Ensaio" },
    { key: "project_name", label: "Projeto" },
    { key: "usina_fornecedora", label: "Usina" },
    { key: "dens_aparente_projeto", label: "Dens. Aparente Projeto (g/cm³)" },
    { key: "corpos_prova", label: "Corpos de Prova", subfields: [
      { key: "data_execucao", label: "Data Execução CP" },
      { key: "estaca", label: "Estaca" },
      { key: "lado", label: "Lado" },
      { key: "media_espessura", label: "Espessura Média (cm)" },
      { key: "densidade", label: "Dens. Aparente CP (g/cm³)" },
      { key: "dens_rice_do_dia", label: "Dens. RICE do Dia (g/cm³)" },
      { key: "gc_dens_projeto", label: "GC Dens. Projeto (%)" },
      { key: "gc_dens_rice_dia", label: "GC RICE do Dia (%)" },
      { key: "rtcd_25c", label: "RTCD (MPa)" }
    ]},
    { key: "approved", label: "Status Aprovação" }
  ],
  EnsaioDensidadeInSitu: [
    { key: "data_ensaio", label: "Data" },
    { key: "camada", label: "Camada" },
    { key: "material", label: "Material" },
    { key: "furos", label: "Dados do Furo", subfields: [
      { key: "estaca", label: "Estaca" },
      { key: "densidade_seca_solo", label: "Densidade Seca Solo (g/cm³)" },
      { key: "umidade", label: "Umidade (%)" }
    ]},
    { key: "dados_proctor.densidade_seca_max", label: "Densidade Seca Max Proctor (g/cm³)" },
    { key: "dados_proctor.umidade_otima", label: "Umidade Ótima Proctor (%)" },
    { key: "furos_variacao", label: "Dados do Furo Final", subfields: [
      { key: "desvio_umidade", label: "Variação Umidade (%)" },
      { key: "grau_compactacao", label: "Grau Compactação (%)" }
    ]}
  ],
  EnsaioTaxaPinturaImprimacao: [
    { key: "data_ensaio", label: "Data" },
    { key: "tipo_servico", label: "Serviço" },
    { key: "ensaios", label: "Dados do Ensaio", subfields: [
      { key: "camada", label: "Camada" },
      { key: "material_camada", label: "Material" },
      { key: "estaca", label: "Estaca" },
      { key: "taxa_aplicada", label: "Taxa Aplicada (l/m²)" },
      { key: "taxa_residual", label: "Taxa Residual (l/m²)" },
      { key: "taxa_emulsao_aplicada", label: "Taxa Emulsão (l/m²)" },
      { key: "ensaio_residuo.data", label: "Data Ensaio Resíduo" },
      { key: "ensaio_residuo.residuo", label: "% Resíduo" }
    ]}
  ],
  EnsaioManchaPendulo: [
    { key: "laboratorista_name", label: "Laboratorista" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "camada", label: "Camada" },
    { key: "pista", label: "Pista" },
    { key: "orgao", label: "Orgão" },
    { key: "data_ensaio", label: "Data Ensaio" },
    { key: "data_aplicacao", label: "Data Aplicação" },
    { key: "media_hs", label: "Média HS (mm)" },
    { key: "classificacao_media_hs", label: "Classificação HS" },
    { key: "media_vrd", label: "Média VRD" },
    { key: "classificacao_media_vrd", label: "Classificação VRD" },
    { key: "condicao_conformidade", label: "Conformidade" }
  ],

  ChecklistUsina: [
    { key: "laboratorista_name", label: "Laboratorista" },
    { key: "project_name", label: "Projeto" },
    { key: "faixa_especificada", label: "Faixa" },
    { key: "ligante", label: "Ligante" },
    { key: "pedreira", label: "Pedreira" },
    { key: "usina", label: "Usina" },
    { key: "fornecedora_ligante", label: "Fornecedora Ligante" },
    { key: "equivalente_areia_resultados", label: "Equiv. Areia", subfields: [
      { key: "resultado_1", label: "Equiv. Areia 1 (%)" },
      { key: "resultado_2", label: "Equiv. Areia 2 (%)" },
      { key: "resultado_3", label: "Equiv. Areia 3 (%)" }
    ]},
    { key: "controle_ligante.nota_fiscal", label: "Ligante - NF" },
    { key: "controle_ligante.fornecedor", label: "Ligante - Fornecedor" },
    { key: "controle_ligante.placa_carreta", label: "Ligante - Placa" },
    { key: "controle_ligante.quantidade_toneladas", label: "Ligante - Qtd (t)" },
    { key: "controle_ligante.viscosidade_1_resultado", label: "Ligante - Visc. 1 (cP)" },
    { key: "controle_ligante.viscosidade_1_conforme", label: "Ligante - Visc. 1 Conforme" },
    { key: "controle_ligante.viscosidade_2_resultado", label: "Ligante - Visc. 2 (cP)" },
    { key: "controle_ligante.viscosidade_2_conforme", label: "Ligante - Visc. 2 Conforme" },
    { key: "controle_ligante.viscosidade_3_resultado", label: "Ligante - Visc. 3 (cP)" },
    { key: "controle_ligante.viscosidade_3_conforme", label: "Ligante - Visc. 3 Conforme" },
    { key: "controle_ligante.recuperacao_elastica_resultado", label: "Ligante - Recup. Elástica (%)" },
    { key: "controle_ligante.recuperacao_elastica_conforme", label: "Ligante - Recup. Elástica Conforme" },
    { key: "controle_ligante.penetracao_resultado", label: "Ligante - Penetração (0,1mm)" },
    { key: "controle_ligante.penetracao_conforme", label: "Ligante - Penetração Conforme" },
    { key: "controle_ligante.ponto_amolecimento_resultado", label: "Ligante - Pto. Amolec. (°C)" },
    { key: "controle_ligante.ponto_amolecimento_conforme", label: "Ligante - Pto. Amolec. Conforme" },
    { key: "controle_ligante.ponto_fulgor_resultado", label: "Ligante - Pto. Fulgor (°C)" },
    { key: "controle_ligante.ponto_fulgor_conforme", label: "Ligante - Pto. Fulgor Conforme" },
    { key: "rodadas_producao", label: "Rodadas Produção", subfields: [
      { key: "quantidade_produzida", label: "Qtd. Produzida (t)" }
    ]},
    { key: "controle_cauq", label: "Controle CAUQ", subfields: [
      { key: "teor_ligante.rotarex_1", label: "Teor Ligante Rotarex 1 (%)" },
      { key: "teor_ligante.rotarex_2", label: "Teor Ligante Rotarex 2 (%)" },
      { key: "teor_ligante.rotarex_3", label: "Teor Ligante Rotarex 3 (%)" },
      { key: "teor_ligante.soxhlet_1", label: "Teor Ligante Soxhlet 1 (%)" },
      { key: "teor_ligante.soxhlet_2", label: "Teor Ligante Soxhlet 2 (%)" },
      { key: "teor_ligante.soxhlet_3", label: "Teor Ligante Soxhlet 3 (%)" },
      { key: "teor_ligante.quantidade", label: "Qtd. Teor Ligante" },
      { key: "teor_ligante.conforme", label: "Teor Ligante Conforme" },
      { key: "densidade_aparente.resultados", label: "Densidade Aparente (g/cm³)" },
      { key: "densidade_aparente.quantidade", label: "Qtd. Densidade Aparente" },
      { key: "densidade_rice.resultados", label: "Densidade RICE (g/cm³)" },
      { key: "densidade_rice.quantidade", label: "Qtd. Densidade RICE" },
      { key: "volume_vazios.resultados", label: "Volume Vazios (%)" },
      { key: "volume_vazios.quantidade", label: "Qtd. Volume Vazios" },
      { key: "volume_vazios.conforme", label: "Volume Vazios Conforme" },
      { key: "rbv.resultados", label: "RBV (%)" },
      { key: "rbv.quantidade", label: "Qtd. RBV" },
      { key: "rbv.conforme", label: "RBV Conforme" },
      { key: "estabilidade.resultados", label: "Estabilidade (Kgf)" },
      { key: "estabilidade.quantidade", label: "Qtd. Estabilidade" },
      { key: "estabilidade.conforme", label: "Estabilidade Conforme" },
      { key: "fluencia.resultados", label: "Fluência (mm)" },
      { key: "fluencia.quantidade", label: "Qtd. Fluência" },
      { key: "fluencia.conforme", label: "Fluência Conforme" },
      { key: "rtcd_25c.resultados", label: "RTCD (MPa)" },
      { key: "rtcd_25c.quantidade", label: "Qtd. RTCD" },
      { key: "rtcd_25c.conforme", label: "RTCD Conforme" }
    ]},
    { key: "acoes_corretivas_realizado", label: "Ações Corretivas" }
  ],
  ChecklistAplicacao: [
    { key: "laboratorista_name", label: "Laboratorista" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "usina", label: "Usina" },
    { key: "fresagem_preparacao.superficie_limpa", label: "Superfície Limpa Após Fresagem" },
    { key: "fresagem_preparacao.destinacao_material_fresado", label: "Destinação Material Fresado" },
    { key: "fresagem_preparacao.material_solto_removido", label: "Remoção Material Solto" },
    { key: "fresagem_preparacao.pavimento_pronto_pintura", label: "Pavimento em Condições para Pintura" },
    { key: "pintura_ligacao.pintura_barra_espargidora.realizado", label: "Pintura Barra Espargidora" },
    { key: "pintura_ligacao.tempo_rompimento_cura.realizado", label: "Tempo Rompimento/Cura" },
    { key: "pintura_ligacao.taxa_pintura.resultado", label: "Taxa de Pintura (l/m²)" },
    { key: "pintura_ligacao.taxa_pintura.conforme", label: "Taxa de Pintura Conforme" },
    { key: "pintura_ligacao.residuo_emulsao.resultado", label: "Resíduo da Emulsão (%)" },
    { key: "pintura_ligacao.taxa_pintura_residual.resultado", label: "Taxa de Pintura Residual (l/m²)" },
    { key: "pintura_ligacao.taxa_pintura_residual.conforme", label: "Taxa de Pintura Residual Conforme" },
    { key: "controle_aplicacao.temp_aplicacao_cargas.quantidade", label: "Temp. Aplicação Qtd" },
    { key: "controle_aplicacao.temp_aplicacao_cargas.conforme", label: "Temp. Aplicação Conforme" },
    { key: "controle_aplicacao.espessura_camada.quantidade", label: "Espessura Camada Qtd" },
    { key: "controle_aplicacao.espessura_camada.conforme", label: "Espessura Camada Conforme" },
    { key: "acoes_corretivas_realizado", label: "Ações Corretivas" }
  ],
  ChecklistMRAF: [
    { key: "laboratorista_name", label: "Laboratorista" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "project_name", label: "Projeto" },
    { key: "empreiteira", label: "Empreiteira" },
    { key: "condicionamento_insumos.agregados_separados", label: "Agregados Separados" },
    { key: "condicionamento_insumos.agregados_cobertos", label: "Agregados Cobertos" },
    { key: "condicionamento_insumos.filler_utilizado", label: "Filler Utilizado" },
    { key: "condicionamento_insumos.utilizacao_aditivos", label: "Utilização de Aditivos" },
    { key: "condicionamento_insumos.agua_contaminada", label: "Água Contaminada" },
    { key: "preparacao_superficie.superficie_umida", label: "Superfície Úmida" },
    { key: "preparacao_superficie.temperatura_pavimento", label: "Temp. Pavimento (°C)" },
    { key: "preparacao_superficie.pavimento_patologias", label: "Pavimento com Patologias" },
    { key: "preparacao_superficie.superficie_fresada", label: "Superfície Fresada" },
    { key: "preparacao_superficie.superficie_limpa", label: "Superfície Limpa" },
    { key: "acompanhamento_aplicacao.tempo_rompimento_cura.realizado", label: "Tempo Rompimento/Cura" },
    { key: "acompanhamento_aplicacao.taxa_aplicacao.realizado", label: "Taxa Aplicação Realizado" },
    { key: "acompanhamento_aplicacao.taxa_aplicacao.resultado", label: "Taxa Aplicação (kg/m²)" },
    { key: "acompanhamento_aplicacao.taxa_aplicacao.conforme", label: "Taxa Aplicação Conforme" },
    { key: "acompanhamento_aplicacao.residuo_emulsao.realizado", label: "Resíduo Emulsão Realizado" },
    { key: "acompanhamento_aplicacao.residuo_emulsao.resultado", label: "Resíduo Emulsão (%)" },
    { key: "acompanhamento_aplicacao.residuo_emulsao.conforme", label: "Resíduo Emulsão Conforme" },
    { key: "acompanhamento_aplicacao.espessura_camada.realizado", label: "Espessura Camada Realizado" },
    { key: "acompanhamento_aplicacao.espessura_camada.resultado", label: "Espessura Camada (cm)" },
    { key: "acompanhamento_aplicacao.espessura_camada.conforme", label: "Espessura Camada Conforme" },
    { key: "controle_aplicacao.km_estaca_inicial", label: "KM/Estaca Inicial" },
    { key: "controle_aplicacao.lado_inicial", label: "Lado Inicial" },
    { key: "controle_aplicacao.km_estaca_final", label: "KM/Estaca Final" },
    { key: "controle_aplicacao.lado_final", label: "Lado Final" },
    { key: "controle_aplicacao.quantidade_aplicada_m2", label: "Quantidade Aplicada (m²)" },
    { key: "acoes_corretivas_realizado", label: "Ações Corretivas" }
  ],
  ChecklistConcretagem: [
    { key: "data", label: "Data" },
    { key: "laboratorista_name", label: "Laboratorista" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "concreteira", label: "Concreteira" },
    { key: "fck", label: "FCK (MPa)" },
    { key: "volume", label: "Volume (m³)" },
    { key: "cargas_concreto", label: "Cargas de Concreto", subfields: [
      { key: "numero_carga", label: "Nº Carga" },
      { key: "nota_fiscal", label: "Nota Fiscal" },
      { key: "slump_test.resultado", label: "Slump (cm)" },
      { key: "slump_test.conforme", label: "Slump Conforme" },
      { key: "espessura_camada.resultado", label: "Espessura (cm)" },
      { key: "espessura_camada.conforme", label: "Espessura Conforme" },
      { key: "superficie_tratada_limpa", label: "Superfície Tratada e Limpa" },
      { key: "adensamento_realizado", label: "Adensamento Realizado" },
      { key: "qtd_cps_3d", label: "Qtd CPs 3 dias" },
      { key: "tipo_ruptura_3d", label: "Tipo Ruptura 3 dias" },
      { key: "qtd_cps_7d", label: "Qtd CPs 7 dias" },
      { key: "tipo_ruptura_7d", label: "Tipo Ruptura 7 dias" },
      { key: "qtd_cps_28d", label: "Qtd CPs 28 dias" },
      { key: "tipo_ruptura_28d", label: "Tipo Ruptura 28 dias" }
    ]},
    { key: "acoes_corretivas_realizado", label: "Ações Corretivas" }
  ],
  ChecklistTerraplanagem: [
    { key: "laboratorista_name", label: "Laboratorista" },
    { key: "rodovia", label: "Rodovia" },
    { key: "empreiteira", label: "Empreiteira" },
    { key: "estaca", label: "Estaca" },
    { key: "camada", label: "Camada" },
    { key: "material", label: "Material" },
    { key: "acompanhamento_execucao.remocao_material_existente", label: "Remoção Material" },
    { key: "acompanhamento_execucao.espalhamento_material_novo", label: "Espalhamento Material" },
    { key: "acompanhamento_execucao.compactacao_conforme_projeto", label: "Compactação Conforme" },
    { key: "acompanhamento_execucao.ensaio_viga_benkelman", label: "Viga Benkelman" },
    { key: "acompanhamento_execucao.teste_carga", label: "Teste de Carga" },
    { key: "acompanhamento_execucao.falha_compactacao", label: "Falha Compactação" },
    { key: "ensaios_empreiteira.compactacao_proctor.quantidade", label: "Proctor - Qtde" },
    { key: "ensaios_empreiteira.compactacao_proctor.resultados", label: "Proctor - Resultados (g/cm³)" },
    { key: "ensaios_empreiteira.compactacao_proctor.conforme", label: "Proctor - Conforme" },
    { key: "umidade_otima_proctor", label: "Umidade Ótima (%)" },
    { key: "ensaios_empreiteira.isc.quantidade", label: "ISC - Qtde" },
    { key: "ensaios_empreiteira.isc.resultados", label: "ISC - Resultados (%)" },
    { key: "ensaios_empreiteira.isc.conforme", label: "ISC - Conforme" },
    { key: "ensaios_empreiteira.massa_especifica_in_situ.quantidade", label: "Massa Específica In Situ - Qtde" },
    { key: "ensaios_empreiteira.massa_especifica_in_situ.resultados", label: "Massa Específica In Situ - Resultados (g/cm³)" },
    { key: "ensaios_empreiteira.massa_especifica_in_situ.conforme", label: "Massa Específica In Situ - Conforme" },
    { key: "umidade_in_situ", label: "Umidade In Situ (%)" },
    { key: "ensaios_empreiteira.granulometria.quantidade", label: "Granulometria - Qtde" },
    { key: "ensaios_empreiteira.granulometria.conforme", label: "Granulometria - Conforme" },
    { key: "variacao_umidade_valor", label: "Variação Umidade (%)" },
    { key: "grau_compactacao_valor", label: "Grau Compactação (%)" },
    { key: "acoes_corretivas_realizado", label: "Ações Corretivas" }
  ],
  ChecklistReciclagem: [
    { key: "laboratorista_name", label: "Laboratorista" },
    { key: "rodovia", label: "Rodovia" },
    { key: "empreiteira", label: "Empreiteira" },
    { key: "estaca", label: "Estaca" },
    { key: "trecho", label: "Trecho" },
    { key: "faixa", label: "Faixa" },
    { key: "material", label: "Material" },
    { key: "inspetor_fiscal", label: "Inspetor Fiscal" },
    { key: "acompanhamento_execucao.remocao_material_existente", label: "Remoção Material" },
    { key: "acompanhamento_execucao.espalhamento_material_novo", label: "Espalhamento Material" },
    { key: "acompanhamento_execucao.compactacao_conforme_projeto", label: "Compactação Conforme" },
    { key: "acompanhamento_execucao.ensaio_viga_benkelman", label: "Viga Benkelman" },
    { key: "acompanhamento_execucao.teste_carga", label: "Teste de Carga" },
    { key: "acompanhamento_execucao.falha_compactacao", label: "Falha Compactação" },
    { key: "ensaios_empreiteira.compactacao_proctor.quantidade", label: "Proctor - Qtde" },
    { key: "ensaios_empreiteira.compactacao_proctor.resultados", label: "Proctor - Resultados (g/cm³)" },
    { key: "ensaios_empreiteira.compactacao_proctor.conforme", label: "Proctor - Conforme" },
    { key: "ensaios_empreiteira.taxa_agregado.quantidade", label: "Taxa Agregado - Qtde" },
    { key: "ensaios_empreiteira.taxa_agregado.resultados", label: "Taxa Agregado - Resultados" },
    { key: "ensaios_empreiteira.taxa_agregado.conforme", label: "Taxa Agregado - Conforme" },
    { key: "ensaios_empreiteira.taxa_cimento.quantidade", label: "Taxa Cimento - Qtde" },
    { key: "ensaios_empreiteira.taxa_cimento.resultados", label: "Taxa Cimento - Resultados" },
    { key: "ensaios_empreiteira.taxa_cimento.conforme", label: "Taxa Cimento - Conforme" },
    { key: "ensaios_empreiteira.umidade_frigideira.quantidade", label: "Umidade Frigideira - Qtde" },
    { key: "ensaios_empreiteira.umidade_frigideira.resultados", label: "Umidade Frigideira - Resultados (%)" },
    { key: "ensaios_empreiteira.umidade_frigideira.conforme", label: "Umidade Frigideira - Conforme" },
    { key: "ensaios_empreiteira.massa_especifica_in_situ.quantidade", label: "Massa Específica In Situ - Qtde" },
    { key: "ensaios_empreiteira.massa_especifica_in_situ.resultados", label: "Massa Específica In Situ - Resultados (g/cm³)" },
    { key: "ensaios_empreiteira.massa_especifica_in_situ.conforme", label: "Massa Específica In Situ - Conforme" },
    { key: "ensaios_empreiteira.granulometria.quantidade", label: "Granulometria - Qtde" },
    { key: "ensaios_empreiteira.granulometria.conforme", label: "Granulometria - Conforme" },
    { key: "ensaios_empreiteira.moldagem_resistencia.quantidade", label: "Moldagem Resistência - Qtde" },
    { key: "ensaios_empreiteira.moldagem_resistencia.conforme", label: "Moldagem Resistência - Conforme" },
    { key: "ensaios_empreiteira.viga_benkelman.quantidade", label: "Viga Benkelman - Qtde" },
    { key: "ensaios_empreiteira.viga_benkelman.conforme", label: "Viga Benkelman - Conforme" },
    { key: "ensaios_empreiteira.taxa_pintura_ligacao.quantidade", label: "Taxa Pintura Ligação - Qtde" },
    { key: "ensaios_empreiteira.taxa_pintura_ligacao.conforme", label: "Taxa Pintura Ligação - Conforme" },
    { key: "ensaios_empreiteira.finura_cimento.quantidade", label: "Finura Cimento - Qtde" },
    { key: "ensaios_empreiteira.finura_cimento.conforme", label: "Finura Cimento - Conforme" },
    { key: "acoes_corretivas_realizado", label: "Ações Corretivas" }
  ],
  DiarioObra: [
    { key: "laboratorista_name", label: "Colaborador" },
    { key: "tipo_local", label: "Tipo Local" },
    { key: "rodovia", label: "Rodovia" },
    { key: "trecho", label: "Trecho" },
    { key: "condicoes_climaticas", label: "Condições Climáticas" },
    { key: "temperatura", label: "Temperatura (°C)" },
    { key: "acoes_corretivas_realizado", label: "Ações Corretivas" },
    { key: "acoes_corretivas_descricao", label: "Descrição Ações Corretivas" }
  ]
};

// ─── Helpers de módulo ────────────────────────────────────────────────────────

const getLabelTipo = (tipo) =>
  getLabelTipo(tipo);

const obrasDeRegionais = (regionais, obras) => {
  const ids = new Set(
    regionais.flatMap(r => obras.filter(o => o.regional_id === r.id).map(o => o.id))
  );
  return obras.filter(o => ids.has(o.id));
};

const filtrarObrasPorAcesso = (obras, regionais, accessLevel, email) => {
  const emailLow = email.toLowerCase();

  if (accessLevel === 'cliente') {
    const regionaisDoUsuario = regionais.filter(r =>
      (r.clientes_responsaveis || []).some(e => e.toLowerCase() === emailLow)
    );
    return obrasDeRegionais(regionaisDoUsuario, obras);
  }

  if (accessLevel === 'sala_tecnica_afirmaevias') {
    const regionaisDoUsuario = regionais.filter(r =>
      (r.salas_tecnicas_responsaveis || []).some(e => e.toLowerCase() === emailLow)
    );
    return obrasDeRegionais(regionaisDoUsuario, obras);
  }

  if (accessLevel === 'gestor_contrato') {
    const regionaisDoUsuario = regionais.filter(r =>
      r.gestor_contrato_responsavel?.toLowerCase() === emailLow ||
      (r.gestores_contrato_responsaveis || []).some(e => e.toLowerCase() === emailLow)
    );
    return obrasDeRegionais(regionaisDoUsuario, obras);
  }

  return obras; // admin / sala_tecnica sem restrição adicional
};

// ─────────────────────────────────────────────────────────────────────────────

export default function ResumosPersonalizadosPage() {
  const [user, setUser] = useState(null);
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  // Filtros
  const [obraId, setObraId] = useState("");
  const [tipoEnsaioSelecionado, setTipoEnsaioSelecionado] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [laboratoristaFiltro, setLaboratoristaFiltro] = useState("");
  
  // Dados
  const [dadosConsolidados, setDadosConsolidados] = useState([]);
  const [laboratoristas, setLaboratoristas] = useState([]);
  const [rawEnsaios, setRawEnsaios] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const userAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');

      const [obrasData, regionaisData] = await Promise.all([
        Obra.list(),
        Regional.list()
      ]);

      setRegionais(regionaisData);

      // Filtrar obras por permissão
      const availableObras = filtrarObrasPorAcesso(obrasData, regionaisData, userAccessLevel, userData.email);

      setObras(availableObras);

      // Auto-selecionar primeira obra se houver apenas uma
      if (availableObras.length === 1) {
        setObraId(availableObras[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleObraChange = (newObraId) => {
    setObraId(newObraId);
    setLaboratoristaFiltro("");
    setLaboratoristas([]);
    setDadosConsolidados([]);
  };

  const handleTipoEnsaioChange = (tipo) => {
    setTipoEnsaioSelecionado(tipo);
    setLaboratoristaFiltro("");
    setLaboratoristas([]);
    setDadosConsolidados([]);
  };





  const getNestedValue = (obj, path) => {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return null;
      }
    }
    return value;
  };

  const calcularMediaArray = (array, campo) => {
    if (!array || array.length === 0) return null;
    const valores = array.map(item => parseFloat(getNestedValue(item, campo))).filter(v => !isNaN(v));
    if (valores.length === 0) return null;
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    return media.toFixed(2);
  };

  const processarSubfieldControleCauq = (subfield, controleCauq) => {
    const extracaoRotarex = controleCauq.extracao_ligante_rotarex;
    const extracaoSoxhlet = controleCauq.extracao_ligante_soxhlet;

    if (subfield.key.startsWith('teor_ligante.rotarex_')) {
      const idx = parseInt(subfield.key.split('_').pop()) - 1;
      return extracaoRotarex?.resultados?.[idx] ?? undefined;
    }
    if (subfield.key.startsWith('teor_ligante.soxhlet_')) {
      const idx = parseInt(subfield.key.split('_').pop()) - 1;
      return extracaoSoxhlet?.resultados?.[idx] ?? undefined;
    }
    if (subfield.key === 'teor_ligante.quantidade') {
      return (extracaoRotarex?.quantidade || 0) + (extracaoSoxhlet?.quantidade || 0);
    }
    if (subfield.key === 'teor_ligante.conforme') {
      const cr = extracaoRotarex?.conforme;
      const cs = extracaoSoxhlet?.conforme;
      if (cr === null && cs === null) return null;
      if (cr === false || cs === false) return false;
      if (cr === true || cs === true) return true;
      return undefined;
    }
    if (subfield.key.startsWith('vam.')) {
      const vam = controleCauq.vam_marshall;
      if (subfield.key === 'vam.resultados') return vam?.resultados?.join(', ');
      if (subfield.key === 'vam.quantidade') return vam?.quantidade;
      if (subfield.key === 'vam.conforme') return vam?.conforme;
    }
    if (subfield.key === 'rtcd_25c.resultados') return controleCauq.rtcd_25c?.resultados?.join(', ');
    if (subfield.key === 'rtcd_25c.quantidade') return controleCauq.rtcd_25c?.quantidade;
    if (subfield.key === 'rtcd_25c.conforme') return controleCauq.rtcd_25c?.conforme;
    return getNestedValue(controleCauq, subfield.key);
  };

  const calcularGranulometriaPassante = (ensaio, peneira) => {
    if (!ensaio?.granulometria?.peso_retido_peneiras) return null;
    
    const PENEIRAS = [
      'peneira_75_0mm', 'peneira_63_0mm', 'peneira_50_0mm', 'peneira_37_5mm',
      'peneira_25_0mm', 'peneira_19_0mm', 'peneira_16_0mm', 'peneira_12_5mm',
      'peneira_9_5mm', 'peneira_4_75mm', 'peneira_2_36mm', 'peneira_2_0mm',
      'peneira_1_18mm', 'peneira_0_6mm', 'peneira_0_42mm', 'peneira_0_3mm',
      'peneira_0_18mm', 'peneira_0_15mm', 'peneira_0_075mm'
    ];
    
    const pesos = ensaio.granulometria.peso_retido_peneiras;
    const pesoInicial = ensaio.extracao_ligante?.amostra_sem_ligante || 0;
    
    if (pesoInicial === 0) return null;
    
    const indice = PENEIRAS.indexOf(peneira);
    if (indice === -1) return null;
    
    // Verificar se a peneira foi preenchida no ensaio
    const pesoRetidoPeneira = parseFloat(pesos[peneira]) || 0;
    let temDados = false;
    for (let i = 0; i < PENEIRAS.length; i++) {
      if (parseFloat(pesos[PENEIRAS[i]]) > 0) {
        temDados = true;
        break;
      }
    }
    
    if (!temDados) return null;
    
    let pesoRetidoAcumulado = 0;
    for (let i = 0; i <= indice; i++) {
      pesoRetidoAcumulado += parseFloat(pesos[PENEIRAS[i]]) || 0;
    }
    
    const percentualPassante = ((pesoInicial - pesoRetidoAcumulado) / pesoInicial) * 100;
    return percentualPassante.toFixed(2);
  };

  const formatValue = (value, campo) => {
    // Se o valor é um objeto com estrutura {sim, nao, na}, retornar a resposta
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      if ('sim' in value && 'nao' in value && 'na' in value) {
        if (value.sim === true) return 'Sim';
        if (value.nao === true) return 'Não';
        if (value.na === true) return 'N/A';
        return '-';
      }
      // Outros objetos retornam '-'
      return '-';
    }
    
    // Verificar campos de conformidade e aprovação ANTES do check de null
    if (campo && (campo.includes('approved') || campo.includes('conforme'))) {
      if (value === true) return 'Sim';
      if (value === false) return 'Não';
      if (value === null || value === undefined) return 'N/A';
      return 'Pendente';
    }
    
    if (value === null || value === undefined) return '-';
    
    if (campo.toLowerCase().includes('data') || campo.toLowerCase().includes('date')) {
      try {
        return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      } catch {
        return value;
      }
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    
    if (typeof value === 'number') {
      // 0 casas decimais para campos de quantidade
      if (campo.includes('quantidade')) {
        return Math.round(value).toString();
      }
      // 3 casas decimais para campos de densidade
      if (campo.includes('densidade') || campo.includes('dens_')) {
        return value.toFixed(3);
      }
      // 2 casas decimais para grau de compactação
      if (campo.includes('gc_') || campo.includes('grau_compactacao')) {
        return value.toFixed(2);
      }
      return value.toFixed(2);
    }
    
    return value;
  };

  const carregarDados = async () => {
    if (!obraId || !tipoEnsaioSelecionado) {
      alert("Selecione uma obra e um tipo de ensaio.");
      return;
    }

    console.log('Carregando dados:', { obraId, tipoEnsaioSelecionado });
    setLoadingData(true);
    try {
      const resultados = [];
      const tipo = tipoEnsaioSelecionado;
      const campos = CAMPOS_POR_TIPO[tipo].map(c => c.key);
      console.log('Campos:', campos);

      // Usar base44.entities para todas as entidades
      const ensaios = await base44.entities[tipo].filter({ obra_id: obraId });
      
      console.log('Ensaios carregados:', ensaios.length);

      // Filtrar por período
      let ensaiosFiltrados = ensaios;
      if (dataInicio || dataFim || laboratoristaFiltro) {
        ensaiosFiltrados = ensaios.filter(e => {
          // Filtro por data
          const dataEnsaio = e.data_ensaio || e.data || e.extraction_date;
          if (dataInicio || dataFim) {
            if (!dataEnsaio) return false;

            const dataEnsaioObj = new Date(dataEnsaio);

            if (dataInicio) {
              const dataInicioObj = new Date(dataInicio);
              if (dataEnsaioObj < dataInicioObj) return false;
            }

            if (dataFim) {
              const dataFimObj = new Date(dataFim);
              if (dataEnsaioObj > dataFimObj) return false;
            }
          }

          // Filtro por laboratorista
          if (laboratoristaFiltro && e.laboratorista_name !== laboratoristaFiltro) {
            return false;
          }

          return true;
        });
      }

      // Coletar laboratoristas únicos
      const labsUnicos = new Set();
      ensaios.forEach(e => {
        if (e.laboratorista_name) {
          labsUnicos.add(e.laboratorista_name);
        }
      });
      setLaboratoristas(Array.from(labsUnicos).sort());

      // Carregar projetos para nomes (CAUQ, Sondagem, ChecklistUsina e ChecklistMRAF)
      let todosOsProjetos = [];
      if (tipo === 'EnsaioCAUQ' || tipo === 'EnsaioSondagem' || tipo === 'ChecklistUsina' || tipo === 'ChecklistMRAF') {
        todosOsProjetos = await base44.entities.Project.list();
      }

      // Para CAUQ, usar todas as peneiras
      let peneirasRelevantes = [];
      if (tipo === 'EnsaioCAUQ') {
        peneirasRelevantes = CAMPOS_POR_TIPO.EnsaioCAUQ.find(c => c.key === 'granulometria')?.subfields || [];
      }

      // Processar cada ensaio
      ensaiosFiltrados.forEach(ensaio => {
        // Adicionar nome do projeto se for CAUQ, Sondagem, ChecklistUsina ou ChecklistMRAF
        if ((tipo === 'EnsaioCAUQ' || tipo === 'EnsaioSondagem' || tipo === 'ChecklistUsina' || tipo === 'ChecklistMRAF') && ensaio.project_id) {
          const projeto = todosOsProjetos.find(p => p.id === ensaio.project_id);
          ensaio.project_name = projeto?.name || '-';
          // Adicionar fornecedora do ligante para ChecklistUsina
          if (tipo === 'ChecklistUsina') {
            ensaio.fornecedora_ligante = projeto?.ligante?.fornecedor || '-';
          }
        }

        // Para Sondagem, criar uma linha para cada CP
        if (tipo === 'EnsaioSondagem') {
          const cps = ensaio.corpos_prova || [];
          
          cps.forEach((cp, idx) => {
            const linha = {
              tipo: getLabelTipo(tipo),
              id: `${ensaio.id}_CP${idx + 1}`,
              data: ensaio.data_ensaio || ensaio.data || ensaio.extraction_date || '-'
            };

            // Adicionar campos do ensaio
            campos.forEach(campoKey => {
              const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);
              
              if (campoKey === 'corpos_prova') {
                // Para cada subfield, pegar o valor do CP atual
                campo.subfields.forEach(subfield => {
                  const value = getNestedValue(cp, subfield.key);
                  linha[subfield.label] = formatValue(value, subfield.key);
                });
              } else {
                // Campos do ensaio (não do CP)
                const value = getNestedValue(ensaio, campoKey);
                linha[campo.label] = formatValue(value, campoKey);
              }
            });

            resultados.push(linha);
          });
        } else if (tipo === 'EnsaioDensidadeInSitu') {
          // Para Densidade In Situ, criar uma linha para cada furo
          const furos = ensaio.furos || [];
          
          furos.forEach((furo, idx) => {
            const linha = {
              tipo: getLabelTipo(tipo),
              id: `${ensaio.id}_Furo${idx + 1}`,
              data: ensaio.data_ensaio || ensaio.data || ensaio.extraction_date || '-'
            };

            // Adicionar campos do ensaio e do furo
            campos.forEach(campoKey => {
              const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);
              
              if (campoKey === 'furos' || campoKey === 'furos_variacao') {
                // Para cada subfield, pegar o valor do furo atual
                campo.subfields.forEach(subfield => {
                  const value = getNestedValue(furo, subfield.key);
                  linha[subfield.label] = formatValue(value, subfield.key);
                });
              } else {
                // Campos do ensaio (não do furo)
                const value = getNestedValue(ensaio, campoKey);
                linha[campo.label] = formatValue(value, campoKey);
              }
            });

            resultados.push(linha);
          });
        } else if (tipo === 'EnsaioTaxaPinturaImprimacao') {
          // Para Taxa de Pintura, criar uma linha para cada ensaio (bandeja)
          const ensaiosArray = ensaio.ensaios || [];
          
          ensaiosArray.forEach((ens, idx) => {
            const linha = {
              tipo: getLabelTipo(tipo),
              id: `${ensaio.id}_Ensaio${idx + 1}`,
              data: ensaio.data_ensaio || ensaio.data || ensaio.extraction_date || '-'
            };

            // Adicionar campos do ensaio e do item do array
            campos.forEach(campoKey => {
              const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);
              
              if (campoKey === 'ensaios') {
                // Para cada subfield, pegar o valor do ensaio atual
                campo.subfields.forEach(subfield => {
                  const value = getNestedValue(ens, subfield.key);
                  linha[subfield.label] = formatValue(value, subfield.key);
                });
              } else {
                // Campos do ensaio principal (não do item do array)
                const value = getNestedValue(ensaio, campoKey);
                linha[campo.label] = formatValue(value, campoKey);
              }
            });

            resultados.push(linha);
          });
        } else if (tipo === 'ChecklistConcretagem') {
          // Para ChecklistConcretagem, criar uma linha por carga de concreto
          const cargas = ensaio.cargas_concreto || [];

          if (cargas.length > 0) {
            cargas.forEach((carga, idx) => {
              const linha = {
                tipo: getLabelTipo(tipo),
                id: `${ensaio.id}_Carga${idx + 1}`,
                data: formatValue(ensaio.data, 'data')
              };

              campos.forEach(campoKey => {
                const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);

                if (campoKey === 'cargas_concreto') {
                  // Para cada subfield da carga, pegar o valor da carga atual
                  campo.subfields.forEach(subfield => {
                    if (subfield.key.startsWith('qtd_cps_') || subfield.key.startsWith('tipo_ruptura_')) {
                      // Processar contagem de CPs por dias de ruptura
                      const diasRuptura = parseInt(subfield.key.match(/\d+/)[0]);
                      const cps = carga.corpos_prova || [];
                      
                      if (subfield.key.startsWith('qtd_cps_')) {
                        const qtd = cps.filter(cp => cp.dias_ruptura === diasRuptura).length;
                        linha[subfield.label] = qtd > 0 ? qtd : '-';
                      } else if (subfield.key.startsWith('tipo_ruptura_')) {
                        const tiposRuptura = cps
                          .filter(cp => cp.dias_ruptura === diasRuptura)
                          .map(cp => {
                            if (cp.tipo_ruptura === 'compressao_axial') return 'Compressão Axial';
                            if (cp.tipo_ruptura === 'comp_diametral') return 'Compressão Diametral';
                            if (cp.tipo_ruptura === 'tracao_flexao') return 'Tração Flexão';
                            return cp.tipo_ruptura;
                          });
                        linha[subfield.label] = tiposRuptura.length > 0 ? tiposRuptura.join(', ') : '-';
                      }
                    } else {
                      const value = getNestedValue(carga, subfield.key);
                      linha[subfield.label] = formatValue(value, subfield.key);
                    }
                  });
                } else {
                  // Campos do ensaio principal
                  const value = getNestedValue(ensaio, campoKey);
                  linha[campo.label] = formatValue(value, campoKey);
                }
              });

              resultados.push(linha);
            });
          } else {
            // Se não houver cargas, criar uma linha única
            const linha = {
              tipo: getLabelTipo(tipo),
              id: ensaio.id,
              data: formatValue(ensaio.data, 'data')
            };

            campos.forEach(campoKey => {
              const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);
              if (campo?.subfields) {
                campo.subfields.forEach(subfield => {
                  linha[subfield.label] = '-';
                });
              } else {
                const value = getNestedValue(ensaio, campoKey);
                linha[campo.label] = formatValue(value, campoKey);
              }
            });

            resultados.push(linha);
          }
        } else if (tipo === 'ChecklistUsina') {
          // Para ChecklistUsina, criar uma linha por rodada de produção se houver
          const rodadas = ensaio.rodadas_producao || [];

          if (rodadas.length > 0) {
            rodadas.forEach((rodada, idx) => {
              const linha = {
                tipo: getLabelTipo(tipo),
                id: `${ensaio.id}_Rodada${idx + 1}`,
                data: formatValue(ensaio.data, 'data')
              };

              campos.forEach(campoKey => {
                const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);

                if (campoKey === 'equivalente_areia_resultados') {
                  // Tratar equivalente de areia
                  const resultados = ensaio.equivalente_areia_resultados || [];
                  campo.subfields.forEach((subfield, sfIdx) => {
                    linha[subfield.label] = resultados[sfIdx] !== undefined ? formatValue(resultados[sfIdx], 'number') : '-';
                  });
                } else if (campoKey === 'rodadas_producao') {
                  // Para cada subfield da rodada, pegar o valor da rodada atual
                  campo.subfields.forEach(subfield => {
                    const value = getNestedValue(rodada, subfield.key);
                    linha[subfield.label] = formatValue(value, subfield.key);
                  });
                } else if (campoKey === 'controle_cauq') {
                  const controleCauq = ensaio.controle_cauq || {};
                  campo.subfields.forEach(subfield => {
                    const value = processarSubfieldControleCauq(subfield, controleCauq);
                    linha[subfield.label] = formatValue(value, subfield.key);
                  });
                } else {
                  // Campos do ensaio principal
                  const value = getNestedValue(ensaio, campoKey);
                  linha[campo.label] = formatValue(value, campoKey);
                }
              });

              resultados.push(linha);
            });
          } else {
            // Se não houver rodadas, criar uma linha única
            const linha = {
              tipo: getLabelTipo(tipo),
              id: ensaio.id,
              data: formatValue(ensaio.data, 'data')
            };

            campos.forEach(campoKey => {
              const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);

              if (campoKey === 'equivalente_areia_resultados') {
                const resultados = ensaio.equivalente_areia_resultados || [];
                campo.subfields.forEach((subfield, sfIdx) => {
                  linha[subfield.label] = resultados[sfIdx] !== undefined ? formatValue(resultados[sfIdx], 'number') : '-';
                });
              } else if (campoKey === 'controle_cauq') {
                const controleCauq = ensaio.controle_cauq || {};
                campo.subfields.forEach(subfield => {
                  const value = processarSubfieldControleCauq(subfield, controleCauq);
                  linha[subfield.label] = formatValue(value, subfield.key);
                });
              } else if (campo?.subfields) {
                // Outros campos com subfields
                const arrayData = getNestedValue(ensaio, campoKey);
                campo.subfields.forEach(subfield => {
                  const media = calcularMediaArray(arrayData, subfield.key);
                  linha[subfield.label] = media !== null ? media : '-';
                });
              } else {
                const value = getNestedValue(ensaio, campoKey);
                linha[campo.label] = formatValue(value, campoKey);
              }
            });

            resultados.push(linha);
          }
        } else if (tipo === 'ChecklistTerraplanagem' || tipo === 'ChecklistReciclagem') {
          // Para ChecklistTerraplanagem e ChecklistReciclagem
          const linha = {
            tipo: getLabelTipo(tipo),
            id: ensaio.id,
            data: ensaio.data_ensaio || ensaio.data || ensaio.extraction_date || '-'
          };

          campos.forEach(campoKey => {
            const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);
            
            if (campoKey === 'variacao_umidade_valor') {
              // Calcular variação de umidade (apenas ChecklistTerraplanagem)
              const umidadeOtima = ensaio.umidade_otima_proctor;
              const umidadeInSitu = ensaio.umidade_in_situ;
              if (umidadeOtima != null && umidadeInSitu != null) {
                const variacao = umidadeInSitu - umidadeOtima;
                linha[campo.label] = variacao.toFixed(2);
              } else {
                linha[campo.label] = '-';
              }
            } else if (campoKey === 'grau_compactacao_valor') {
              // Calcular grau de compactação (apenas ChecklistTerraplanagem)
              const densidadeProctor = ensaio.ensaios_empreiteira?.compactacao_proctor?.resultados;
              const densidadeInSitu = ensaio.ensaios_empreiteira?.massa_especifica_in_situ?.resultados;
              
              if (densidadeProctor && densidadeInSitu) {
                // Pegar primeiro valor do array ou valor direto
                const densProc = Array.isArray(densidadeProctor) ? parseFloat(densidadeProctor[0]) : parseFloat(densidadeProctor);
                const densIS = Array.isArray(densidadeInSitu) ? parseFloat(densidadeInSitu[0]) : parseFloat(densidadeInSitu);
                
                if (!isNaN(densProc) && !isNaN(densIS) && densProc > 0) {
                  const grauComp = (densIS / densProc) * 100;
                  linha[campo.label] = grauComp.toFixed(2);
                } else {
                  linha[campo.label] = '-';
                }
              } else {
                linha[campo.label] = '-';
              }
            } else if (campo?.subfields) {
              // Calcular médias para arrays
              const arrayData = getNestedValue(ensaio, campoKey);
              campo.subfields.forEach(subfield => {
                const media = calcularMediaArray(arrayData, subfield.key);
                linha[`${campoKey}.${subfield.key}`] = media !== null ? media : '-';
              });
            } else {
              const value = getNestedValue(ensaio, campoKey);
              linha[campo.label] = formatValue(value, campoKey);
            }
          });

          resultados.push(linha);
        } else {
          // Para outros tipos de ensaio
          
          // Para EnsaioManchaPendulo: calcular campos derivados on-the-fly se não estiverem salvos
          if (tipo === 'EnsaioManchaPendulo') {
            const manchaValidos = (ensaio.ensaios_mancha || []).filter(e => e && e.hs_mm != null);
            const penduloValidos = (ensaio.ensaios_pendulo || []).filter(e => e && e.vrd != null);

            if (!ensaio.media_hs && manchaValidos.length > 0) {
              ensaio.media_hs = manchaValidos.reduce((sum, e) => sum + e.hs_mm, 0) / manchaValidos.length;
            }
            if (!ensaio.media_vrd && penduloValidos.length > 0) {
              ensaio.media_vrd = penduloValidos.reduce((sum, e) => sum + e.vrd, 0) / penduloValidos.length;
            }
            if (!ensaio.classificacao_media_hs && ensaio.media_hs != null) {
              const v = ensaio.media_hs;
              ensaio.classificacao_media_hs = v < 0.2 ? 'Muito Fina' : v < 0.4 ? 'Fina' : v < 0.8 ? 'Média' : v < 1.2 ? 'Grossa' : 'Muito Grossa';
            }
            if (!ensaio.classificacao_media_vrd && ensaio.media_vrd != null) {
              const v = ensaio.media_vrd;
              ensaio.classificacao_media_vrd = v < 25 ? 'Perigosa' : v <= 31 ? 'Muito Lisa' : v <= 39 ? 'Lisa' : v <= 46 ? 'Insuf. Rugosa' : v <= 54 ? 'Median. Rugosa' : v <= 75 ? 'Rugosa' : 'Muito Rugosa';
            }
            if (!ensaio.condicao_conformidade && ensaio.media_hs != null && ensaio.media_vrd != null) {
              const limites = { 'DER/PR': 50, 'DNIT': 55, 'ECO-RODOVIAS': 47 };
              const vrdMin = limites[ensaio.orgao] || 47;
              const manchaOk = ensaio.media_hs >= 0.6 && ensaio.media_hs <= 1.2;
              const penduloOk = ensaio.media_vrd >= vrdMin;
              ensaio.condicao_conformidade = (manchaOk && penduloOk) ? 'CONFORME' : 'NÃO CONFORME';
            }
          }

          const linha = {
            tipo: getLabelTipo(tipo),
            id: ensaio.id,
            data: ensaio.data_ensaio || ensaio.data || ensaio.extraction_date || '-'
          };

          campos.forEach(campoKey => {
            const campo = CAMPOS_POR_TIPO[tipo].find(c => c.key === campoKey);
            
            if (!campo) return;

            if (campo?.subfields) {
              // Tratar granulometria de forma especial
              if (campoKey === 'granulometria') {
                const peneirasParaExibir = peneirasRelevantes.length > 0 ? peneirasRelevantes : campo.subfields;
                peneirasParaExibir.forEach(subfield => {
                  const percentualPassante = calcularGranulometriaPassante(ensaio, subfield.key);
                  if (percentualPassante !== null) {
                    linha[`${campoKey}.${subfield.astm}`] = percentualPassante;
                  }
                });
              } else {
                // Calcular médias para arrays (outros tipos)
                const arrayData = getNestedValue(ensaio, campoKey);
                campo.subfields.forEach(subfield => {
                  const media = calcularMediaArray(arrayData, subfield.key);
                  linha[`${campoKey}.${subfield.key}`] = media !== null ? media : '-';
                });
              }
            } else {
              const value = getNestedValue(ensaio, campoKey);
              linha[campo.label] = formatValue(value, campoKey);
            }
          });

          resultados.push(linha);
        }
      });

      console.log('Resultados processados:', resultados.length);
      setDadosConsolidados(resultados);
      setRawEnsaios(ensaiosFiltrados);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados dos ensaios: " + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  const exportarMedicaoGeometrica = (linhaId) => {
    const ensaio = rawEnsaios.find(e => e.id === linhaId || linhaId?.startsWith(e.id));
    if (!ensaio) return;

    const med = ensaio.medicoes_geometricas;
    const medicoes = med?.medicoes || [];

    if (medicoes.length === 0) {
      alert('Este checklist não possui medições geométricas.');
      return;
    }

    const wsData = [
      ['Subtrecho', med.subtrecho || '-'],
      ['Serviço', med.servico || '-'],
      [],
      ['Estaca Inicial', 'Estaca Final', 'Lado', 'Faixa', 'Comprimento (m)', 'Largura (m)', 'Altura (cm)', 'Placa', 'Quantidade', 'Temperatura (°C)', 'Observações'],
      ...medicoes.map(m => [
        m.estaca_inicial || '-',
        m.estaca_final || '-',
        m.lado || '-',
        m.faixa || '-',
        m.comprimento ?? '-',
        m.largura ?? '-',
        m.altura ?? '-',
        m.placa || '-',
        m.quantidade ?? '-',
        m.temperatura ?? '-',
        m.observacoes || '-'
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Medição Geométrica');
    const dataStr = ensaio.data ? new Date(ensaio.data).toLocaleDateString('pt-BR') : '';
    XLSX.writeFile(wb, `medicao_geometrica_${dataStr}.xlsx`);
  };

  const normalizarTexto = (texto) => {
    if (typeof texto !== 'string') return texto;
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\u0000-\u007F]/g, '');
  };

  const exportarParaCSV = () => {
    if (dadosConsolidados.length === 0) {
      alert("Nenhum dado para exportar.");
      return;
    }

    const headers = Object.keys(dadosConsolidados[0]);
    const csvContent = [
      headers.map(h => normalizarTexto(h)).join(';'),
      ...dadosConsolidados.map(row => 
        headers.map(h => normalizarTexto(String(row[h] || ''))).join(';')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resumo_personalizado_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const obraSelecionada = useMemo(() => obras.find(o => o.id === obraId), [obras, obraId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#00233B]">Resumos</h1>
          <p className="text-[#00233B]/80 mt-1">
            Selecione os ensaios, período e campos para gerar relatórios consolidados
          </p>
        </div>

        {/* Filtros */}
        <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-[#00233B] flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#BFCF99]" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Obra */}
            <div>
              <Label htmlFor="obra" className="text-[#00233B]">Obra *</Label>
              <select
                id="obra"
                value={obraId}
                onChange={(e) => handleObraChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
              >
                <option value="">Selecione uma obra</option>
                {obras.map(obra => {
                  const regional = regionais.find(r => r.id === obra.regional_id);
                  return (
                    <option key={obra.id} value={obra.id}>
                      {obra.name} - {obra.code} {regional && `(${regional.nome})`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Tipo de Ensaio */}
            <div>
              <Label htmlFor="tipoEnsaio" className="text-[#00233B]">Tipo de Ensaio *</Label>
              <select
                id="tipoEnsaio"
                value={tipoEnsaioSelecionado}
                onChange={(e) => handleTipoEnsaioChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
              >
                <option value="">Selecione um tipo de ensaio</option>
                {TIPOS_ENSAIO.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataInicio" className="text-[#00233B]">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-white/50 border-white/20 text-[#00233B]"
                />
              </div>
              <div>
                <Label htmlFor="dataFim" className="text-[#00233B]">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-white/50 border-white/20 text-[#00233B]"
                />
              </div>
            </div>

            {/* Filtro por Laboratorista */}
            {laboratoristas.length > 0 && (
              <div>
                <Label htmlFor="laboratorista" className="text-[#00233B]">Laboratorista</Label>
                <select
                  id="laboratorista"
                  value={laboratoristaFiltro}
                  onChange={(e) => setLaboratoristaFiltro(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/50 px-3 py-2 text-sm text-[#00233B]"
                >
                  <option value="">Todos</option>
                  {laboratoristas.map(lab => (
                    <option key={lab} value={lab}>{lab}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={carregarDados} 
                disabled={loadingData || !obraId || !tipoEnsaioSelecionado}
                className="bg-[#00233B] text-white hover:bg-[#00233B]/90"
              >
                {loadingData ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Gerar Resumo'
                )}
              </Button>
              {dadosConsolidados.length > 0 && (
                <Button 
                  onClick={exportarParaCSV} 
                  variant="outline"
                  className="border-[#00233B] text-[#00233B] hover:bg-[#00233B]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {dadosConsolidados.length > 0 && (
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-[#00233B]">
                  Resultados - {dadosConsolidados.length} registro(s)
                </CardTitle>
                {obraSelecionada && (
                  <Badge className="bg-[#566E3D] text-white">
                    {obraSelecionada.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#00233B] text-white">
                     <th className="border border-white/20 px-2 py-2 text-left">Tipo</th>
                     <th className="border border-white/20 px-2 py-2 text-left">Data</th>
                     {tipoEnsaioSelecionado === 'ChecklistAplicacao' && (
                       <th className="border border-white/20 px-2 py-2 text-center">Medição Geométrica</th>
                     )}
                      {Object.keys(dadosConsolidados[0])
                        .filter(key => key !== 'tipo' && key !== 'data' && key !== 'id')
                        .map(key => (
                          <th key={key} className="border border-white/20 px-2 py-2 text-left">
                            {key.replace('granulometria.', '')}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dadosConsolidados.map((linha, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white/50' : 'bg-white/30'}>
                       <td className="border border-white/20 px-2 py-2 font-medium text-[#00233B]">
                         {linha.tipo}
                       </td>
                       <td className="border border-white/20 px-2 py-2 text-[#00233B]">
                         {formatValue(linha.data, 'data')}
                       </td>
                       {tipoEnsaioSelecionado === 'ChecklistAplicacao' && (
                         <td className="border border-white/20 px-2 py-2 text-center">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => exportarMedicaoGeometrica(linha.id)}
                             className="h-7 text-xs border-[#00233B]/30 text-[#00233B] hover:bg-[#00233B]/10 gap-1"
                           >
                             <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                             Excel
                           </Button>
                         </td>
                       )}
                        {Object.keys(linha)
                          .filter(key => key !== 'tipo' && key !== 'data' && key !== 'id')
                          .map(key => (
                            <td key={key} className="border border-white/20 px-2 py-2 text-[#00233B]">
                              {linha[key]}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {dadosConsolidados.length === 0 && !loadingData && tipoEnsaioSelecionado && obraId && (
          <Card className="bg-white/20 backdrop-blur-lg border border-white/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-[#00233B]/10 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-[#00233B]/50" />
              </div>
              <p className="text-[#00233B]/80 text-center">
                Clique em "Gerar Resumo" para visualizar os dados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}