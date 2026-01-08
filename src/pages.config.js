import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Users from './pages/Users';
import EnsaioDensidade from './pages/EnsaioDensidade';
import RelatorioEnsaio from './pages/RelatorioEnsaio';
import DiarioObra from './pages/DiarioObra';
import Home from './pages/Home';
import FaixasGranulometricas from './pages/FaixasGranulometricas';
import RelatorioDiario from './pages/RelatorioDiario';
import MeusEnsaios from './pages/MeusEnsaios';
import Regionais from './pages/Regionais';
import MigracaoDados from './pages/MigracaoDados';
import ChecklistUsina from './pages/ChecklistUsina';
import RelatorioChecklist from './pages/RelatorioChecklist';
import RelatorioChecklistPage from './pages/RelatorioChecklistPage';
import SolicitacoesTransferencia from './pages/SolicitacoesTransferencia';
import ChecklistAplicacao from './pages/ChecklistAplicacao';
import RelatorioChecklistAplicacao from './pages/RelatorioChecklistAplicacao';
import ChecklistMRAF from './pages/ChecklistMRAF';
import RelatorioChecklistMRAF from './pages/RelatorioChecklistMRAF';
import ChecklistConcretagem from './pages/ChecklistConcretagem';
import RelatorioChecklistConcretagem from './pages/RelatorioChecklistConcretagem';
import ChecklistTerraplanagem from './pages/ChecklistTerraplanagem';
import RelatorioChecklistTerraplanagem from './pages/RelatorioChecklistTerraplanagem';
import EnsaioSondagem from './pages/EnsaioSondagem';
import RelatorioSondagem from './pages/RelatorioSondagem';
import EnsaioDensidadeInSitu from './pages/EnsaioDensidadeInSitu';
import RelatorioDensidadeInSitu from './pages/RelatorioDensidadeInSitu';
import EnsaioTaxaPinturaImprimacao from './pages/EnsaioTaxaPinturaImprimacao';
import RelatorioTaxaPinturaImprimacao from './pages/RelatorioTaxaPinturaImprimacao';
import RelatorioConsolidado from './pages/RelatorioConsolidado';
import EnsaioCAUQ from './pages/EnsaioCAUQ';
import RelatorioCAUQ from './pages/RelatorioCAUQ';
import ResumosPersonalizados from './pages/ResumosPersonalizados';
import NaoConformidades from './pages/NaoConformidades';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "Users": Users,
    "EnsaioDensidade": EnsaioDensidade,
    "RelatorioEnsaio": RelatorioEnsaio,
    "DiarioObra": DiarioObra,
    "Home": Home,
    "FaixasGranulometricas": FaixasGranulometricas,
    "RelatorioDiario": RelatorioDiario,
    "MeusEnsaios": MeusEnsaios,
    "Regionais": Regionais,
    "MigracaoDados": MigracaoDados,
    "ChecklistUsina": ChecklistUsina,
    "RelatorioChecklist": RelatorioChecklist,
    "RelatorioChecklistPage": RelatorioChecklistPage,
    "SolicitacoesTransferencia": SolicitacoesTransferencia,
    "ChecklistAplicacao": ChecklistAplicacao,
    "RelatorioChecklistAplicacao": RelatorioChecklistAplicacao,
    "ChecklistMRAF": ChecklistMRAF,
    "RelatorioChecklistMRAF": RelatorioChecklistMRAF,
    "ChecklistConcretagem": ChecklistConcretagem,
    "RelatorioChecklistConcretagem": RelatorioChecklistConcretagem,
    "ChecklistTerraplanagem": ChecklistTerraplanagem,
    "RelatorioChecklistTerraplanagem": RelatorioChecklistTerraplanagem,
    "EnsaioSondagem": EnsaioSondagem,
    "RelatorioSondagem": RelatorioSondagem,
    "EnsaioDensidadeInSitu": EnsaioDensidadeInSitu,
    "RelatorioDensidadeInSitu": RelatorioDensidadeInSitu,
    "EnsaioTaxaPinturaImprimacao": EnsaioTaxaPinturaImprimacao,
    "RelatorioTaxaPinturaImprimacao": RelatorioTaxaPinturaImprimacao,
    "RelatorioConsolidado": RelatorioConsolidado,
    "EnsaioCAUQ": EnsaioCAUQ,
    "RelatorioCAUQ": RelatorioCAUQ,
    "ResumosPersonalizados": ResumosPersonalizados,
    "NaoConformidades": NaoConformidades,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};