/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AcompanhamentoUsinagem from './pages/AcompanhamentoUsinagem';
import ChecklistAplicacao from './pages/ChecklistAplicacao';
import ChecklistConcretagem from './pages/ChecklistConcretagem';
import ChecklistMRAF from './pages/ChecklistMRAF';
import ChecklistReciclagem from './pages/ChecklistReciclagem';
import ChecklistTerraplanagem from './pages/ChecklistTerraplanagem';
import ChecklistUsina from './pages/ChecklistUsina';
import Dashboard from './pages/Dashboard';
import DiarioObra from './pages/DiarioObra';
import EnsaioCAUQ from './pages/EnsaioCAUQ';
import EnsaioDensidade from './pages/EnsaioDensidade';
import EnsaioDensidadeInSitu from './pages/EnsaioDensidadeInSitu';
import EnsaioGranulometriaIndividual from './pages/EnsaioGranulometriaIndividual';
import EnsaioMRAF from './pages/EnsaioMRAF';
import EnsaioSondagem from './pages/EnsaioSondagem';
import EnsaioTaxaPinturaImprimacao from './pages/EnsaioTaxaPinturaImprimacao';
import FaixasGranulometricas from './pages/FaixasGranulometricas';
import Home from './pages/Home';
import MeusEnsaios from './pages/MeusEnsaios';
import MigracaoDados from './pages/MigracaoDados';
import MonitorProdutividade from './pages/MonitorProdutividade';
import NaoConformidades from './pages/NaoConformidades';
import Produtividade from './pages/Produtividade';
import Projects from './pages/Projects';
import Regionais from './pages/Regionais';
import RelatorioAcompanhamentoUsinagem from './pages/RelatorioAcompanhamentoUsinagem';
import RelatorioCAUQ from './pages/RelatorioCAUQ';
import RelatorioChecklist from './pages/RelatorioChecklist';
import RelatorioChecklistAplicacao from './pages/RelatorioChecklistAplicacao';
import RelatorioChecklistConcretagem from './pages/RelatorioChecklistConcretagem';
import RelatorioChecklistMRAF from './pages/RelatorioChecklistMRAF';
import RelatorioChecklistPage from './pages/RelatorioChecklistPage';
import RelatorioChecklistReciclagem from './pages/RelatorioChecklistReciclagem';
import RelatorioChecklistTerraplanagem from './pages/RelatorioChecklistTerraplanagem';
import RelatorioConsolidado from './pages/RelatorioConsolidado';
import RelatorioDensidadeInSitu from './pages/RelatorioDensidadeInSitu';
import RelatorioDiario from './pages/RelatorioDiario';
import RelatorioEnsaio from './pages/RelatorioEnsaio';
import RelatorioGranulometriaIndividual from './pages/RelatorioGranulometriaIndividual';
import RelatorioSondagem from './pages/RelatorioSondagem';
import RelatorioTaxaPinturaImprimacao from './pages/RelatorioTaxaPinturaImprimacao';
import SolicitacoesTransferencia from './pages/SolicitacoesTransferencia';
import Users from './pages/Users';
import ResumosPersonalizados from './pages/ResumosPersonalizados';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcompanhamentoUsinagem": AcompanhamentoUsinagem,
    "ChecklistAplicacao": ChecklistAplicacao,
    "ChecklistConcretagem": ChecklistConcretagem,
    "ChecklistMRAF": ChecklistMRAF,
    "ChecklistReciclagem": ChecklistReciclagem,
    "ChecklistTerraplanagem": ChecklistTerraplanagem,
    "ChecklistUsina": ChecklistUsina,
    "Dashboard": Dashboard,
    "DiarioObra": DiarioObra,
    "EnsaioCAUQ": EnsaioCAUQ,
    "EnsaioDensidade": EnsaioDensidade,
    "EnsaioDensidadeInSitu": EnsaioDensidadeInSitu,
    "EnsaioGranulometriaIndividual": EnsaioGranulometriaIndividual,
    "EnsaioMRAF": EnsaioMRAF,
    "EnsaioSondagem": EnsaioSondagem,
    "EnsaioTaxaPinturaImprimacao": EnsaioTaxaPinturaImprimacao,
    "FaixasGranulometricas": FaixasGranulometricas,
    "Home": Home,
    "MeusEnsaios": MeusEnsaios,
    "MigracaoDados": MigracaoDados,
    "MonitorProdutividade": MonitorProdutividade,
    "NaoConformidades": NaoConformidades,
    "Produtividade": Produtividade,
    "Projects": Projects,
    "Regionais": Regionais,
    "RelatorioAcompanhamentoUsinagem": RelatorioAcompanhamentoUsinagem,
    "RelatorioCAUQ": RelatorioCAUQ,
    "RelatorioChecklist": RelatorioChecklist,
    "RelatorioChecklistAplicacao": RelatorioChecklistAplicacao,
    "RelatorioChecklistConcretagem": RelatorioChecklistConcretagem,
    "RelatorioChecklistMRAF": RelatorioChecklistMRAF,
    "RelatorioChecklistPage": RelatorioChecklistPage,
    "RelatorioChecklistReciclagem": RelatorioChecklistReciclagem,
    "RelatorioChecklistTerraplanagem": RelatorioChecklistTerraplanagem,
    "RelatorioConsolidado": RelatorioConsolidado,
    "RelatorioDensidadeInSitu": RelatorioDensidadeInSitu,
    "RelatorioDiario": RelatorioDiario,
    "RelatorioEnsaio": RelatorioEnsaio,
    "RelatorioGranulometriaIndividual": RelatorioGranulometriaIndividual,
    "RelatorioSondagem": RelatorioSondagem,
    "RelatorioTaxaPinturaImprimacao": RelatorioTaxaPinturaImprimacao,
    "SolicitacoesTransferencia": SolicitacoesTransferencia,
    "Users": Users,
    "ResumosPersonalizados": ResumosPersonalizados,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};