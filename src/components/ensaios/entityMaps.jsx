import { base44 } from "@/api/base44Client";
import { DiarioObra } from "@/entities/DiarioObra";
import { EnsaioDensidade } from "@/entities/EnsaioDensidade";
import { ChecklistUsina } from "@/entities/ChecklistUsina";
import { ChecklistAplicacao } from "@/entities/ChecklistAplicacao";
import { ChecklistMRAF } from "@/entities/ChecklistMRAF";
import { ChecklistConcretagem } from "@/entities/ChecklistConcretagem";

export const getEntityMap = () => ({
  "DiarioObra": DiarioObra,
  "EnsaioCAUQ": base44.entities.EnsaioCAUQ,
  "EnsaioMRAF": base44.entities.EnsaioMRAF,
  "EnsaioDensidade": EnsaioDensidade,
  "EnsaioDensidadeInSitu": base44.entities.EnsaioDensidadeInSitu,
  "EnsaioTaxaPinturaImprimacao": base44.entities.EnsaioTaxaPinturaImprimacao,
  "EnsaioVigaBenkelman": base44.entities.EnsaioVigaBenkelman,
  "ChecklistUsina": ChecklistUsina,
  "ChecklistAplicacao": base44.entities.ChecklistAplicacao,
  "ChecklistMRAF": ChecklistMRAF,
  "ChecklistConcretagem": ChecklistConcretagem,
  "ChecklistTerraplanagem": base44.entities.ChecklistTerraplanagem,
  "ChecklistReciclagem": base44.entities.ChecklistReciclagem,
  "EnsaioSondagem": base44.entities.EnsaioSondagem,
  "EnsaioGranulometriaIndividual": base44.entities.EnsaioGranulometriaIndividual,
  "AcompanhamentoUsinagem": base44.entities.AcompanhamentoUsinagem,
  "AcompanhamentoCarga": base44.entities.AcompanhamentoCarga,
  "EnsaioManchaPendulo": base44.entities.EnsaioManchaPendulo,
  "EnsaioTaxaMRAF": base44.entities.EnsaioTaxaMRAF,
  "BoletimSondagem": base44.entities.BoletimSondagem,
  "BoletimSondagemTrado": base44.entities.BoletimSondagemTrado
});