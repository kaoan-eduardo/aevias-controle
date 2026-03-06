// Dados LOCAL > CATEGORIA > PARÂMETROS
export const NC_DATA = [
  // ─── CAMPO ───────────────────────────────────────────────────────────────
  { local: "CAMPO", categoria: "Mobilização", parametros: ["EQUIPAMENTOS", "PESSOAL"] },
  { local: "CAMPO", categoria: "Equipamentos - Calibração", parametros: [] },
  { local: "CAMPO", categoria: "Equipamentos - Condição", parametros: [] },
  { local: "CAMPO", categoria: "Condições climáticas", parametros: ["CHUVA"] },
  { local: "CAMPO", categoria: "Pintura de ligação", parametros: ["ROMPIMENTO", "TAXA", "RECORTE", "SUPERFÍCIE ÚMIDA"] },
  { local: "CAMPO", categoria: "Resíduo da emulsão", parametros: ["RECORTE"] },
  { local: "CAMPO", categoria: "Execução - Pavimento Flexível", parametros: ["Nº DE FECHAS", "TEMPERATURA DE APLICAÇÃO", "APLICAÇÃO COM CHUVA", "DEFLEXÃO"] },
  { local: "CAMPO", categoria: "Execução - Pavimento Rígido", parametros: ["GEOGRELHA", "CAIXARIA", "ARMAÇÃO", "RESISTÊNCIA", "SLUMP"] },
  { local: "CAMPO", categoria: "Execução - Pavimento MRAF", parametros: ["UMIDADE", "TRILHOS DE RODA", "ESPESSURA", "TAXA APLICADA", "TEMPERATURA DA MISTURA"] },
  { local: "CAMPO", categoria: "Execução - Drenagem", parametros: ["ÂNGULO DE QUEDA", "MATERIAL DRENANTE", "MANTA GEOTÊXTIL", "ÂNGULO DE SAÍDA"] },
  { local: "CAMPO", categoria: "Execução - Manutenção", parametros: ["ROÇADA", "LIMPEZA", "TROCA DE DISPOSITIVOS"] },
  { local: "CAMPO", categoria: "Execução - OAE", parametros: ["SLUMP", "TRAÇO DE CONCRETO", "ARMAÇÃO", "RESISTÊNCIA"] },
  { local: "CAMPO", categoria: "Execução - Terraplanagem", parametros: ["DEFLEXÃO", "ISC", "EXPANSÃO", "VARIAÇÃO DE UMIDADE", "GRAU DE COMPACTAÇÃO", "TAXA DE IMPRIMAÇÃO"] },
  { local: "CAMPO", categoria: "Execução - Sinalização", parametros: ["PINTURA", "PLACAS DE SINALIZAÇÃO"] },
  { local: "CAMPO", categoria: "Execução - Reciclagem", parametros: ["RESISTÊNCIA", "GRAU DE COMPACTAÇÃO", "VARIAÇÃO DE UMIDADE", "DEFLEXÃO", "TAXA DE CIMENTO", "TAXA DE IMPRIMAÇÃO"] },
  { local: "CAMPO", categoria: "Patologias", parametros: ["ACABAMENTO", "AFUNDAMENTO", "DEFORMAÇÃO", "PANELAS", "TRINCAS/FISSURAS", "SEGREGAÇÃO", "EXSUDAÇÃO", "GEOMETRIA", "DESPRENDIMENTO"] },
  { local: "CAMPO", categoria: "Ensaios - Empreiteira", parametros: ["PARÂMETROS", "NÃO REALIZAÇÃO"] },
  { local: "CAMPO", categoria: "Ensaios - Fiscalização (spotcheck)", parametros: ["PARÂMETROS"] },
  { local: "CAMPO", categoria: "Teor de ligante", parametros: ["PARÂMETROS"] },
  { local: "CAMPO", categoria: "Granulometria", parametros: ["PARÂMETROS"] },
  { local: "CAMPO", categoria: "Liberação de camada", parametros: ["ANTES DO PRAZO", "SEM LIBERAR POR ENSAIO", "ALTA TEMPERATURA", "SEM ROMPIMENTO", "SEM GRAU DE COMPACTAÇÃO"] },
  { local: "CAMPO", categoria: "Liberação do tráfego com altas temperaturas", parametros: [] },
  { local: "CAMPO", categoria: "Resistência concreto - Axial", parametros: [] },
  { local: "CAMPO", categoria: "Resistência concreto - Diametral", parametros: [] },
  { local: "CAMPO", categoria: "Sinalização Temporária", parametros: ["AGULHA", "BANDEIRINHA"] },
  { local: "CAMPO", categoria: "Sinalização Vertical", parametros: ["RETRORREFLETIVIDADE"] },
  { local: "CAMPO", categoria: "Sinalização Horizontal", parametros: ["RETRORREFLETIVIDADE"] },
  { local: "CAMPO", categoria: "Temperatura - Aplicação", parametros: [] },
  { local: "CAMPO", categoria: "Temperatura - Emulsão", parametros: [] },
  { local: "CAMPO", categoria: "Temperatura - Ambiente", parametros: ["MENOR QUE ESPECIFICADO"] },
  { local: "CAMPO", categoria: "Transparência de resultados", parametros: [] },
  { local: "CAMPO", categoria: "Grau de compactação", parametros: ["VAZIOS DE PISTA"] },
  { local: "CAMPO", categoria: "Pós execução", parametros: ["MANCHA", "PÊNDULO", "MERLIN", "VIGA BENKELMAN"] },

  // ─── USINA ───────────────────────────────────────────────────────────────
  { local: "USINA", categoria: "Equipamentos - Calibração", parametros: [] },
  { local: "USINA", categoria: "Equipamentos - Condição", parametros: [] },
  { local: "USINA", categoria: "Condições climáticas", parametros: ["CHUVA"] },
  { local: "USINA", categoria: "Usina - Agregados", parametros: ["DENSIDADE", "CONTAMINAÇÃO", "UMIDADE", "EQUIVALENTE DE AREIA"] },
  { local: "USINA", categoria: "Usina - Mistura asfáltica", parametros: ["VOLUME DE VAZIOS", "V.A.M.", "V.C.B.", "R.B.V.", "ESTABILIDADE", "FLUÊNCIA", "RTCD 25ºC"] },
  { local: "USINA", categoria: "Usina - Diversos", parametros: [] },
  { local: "USINA", categoria: "Usina - Ligante", parametros: ["VISCOSIDADE", "PONTO DE AMOLECIMENTO", "RECUPERAÇÃO ELÁSTICA", "PENETRAÇÃO", "PONTO DE FULGOR"] },
  { local: "USINA", categoria: "Ensaios - Empreiteira", parametros: ["PARÂMETROS", "NÃO REALIZAÇÃO"] },
  { local: "USINA", categoria: "Ensaios - Fiscalização (spotcheck)", parametros: ["PARÂMETROS"] },
  { local: "USINA", categoria: "Teor de ligante", parametros: ["PARÂMETROS"] },
  { local: "USINA", categoria: "Granulometria", parametros: ["PARÂMETROS"] },
  { local: "USINA", categoria: "Temperatura - Usinagem", parametros: [] },
  { local: "USINA", categoria: "Temperatura - Ligante", parametros: [] },
  { local: "USINA", categoria: "Temperatura - Ambiente", parametros: ["MENOR QUE ESPECIFICADO"] },
  { local: "USINA", categoria: "Transparência de resultados", parametros: [] },
];

export const LOCAIS = ["CAMPO", "USINA"];

export function getCategoriasByLocal(local) {
  return NC_DATA.filter(d => d.local === local).map(d => d.categoria);
}

export function getParametrosByLocalCategoria(local, categoria) {
  const found = NC_DATA.find(d => d.local === local && d.categoria === categoria);
  return found ? found.parametros : [];
}