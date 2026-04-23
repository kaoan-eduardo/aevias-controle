import React, { useMemo, useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Settings,
  Users,
  FolderOpen,
  Home,
  FlaskConical,
  LogOut,
  User as UserIcon,
  Grid,
  FilePlus,
  Book,
  FileText,
  HardHat,
  Construction,
  Wrench,
  AlertTriangle,
  Gauge,
  ArrowLeftRight,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Trash2
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/PullToRefresh";
import { User } from "@/entities/User";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TAB_ZONES = {
  home: ['/'],
  regionais: ['/Regionais', '/Obra', '/Regional'],
  projects: ['/Projects', '/Project'],
  registros: ['/MeusEnsaios', '/Ensaio', '/Checklist', '/Diario', '/Acompanhamento', '/Boletim'],
};

function getTabZone(pathname) {
  for (const [zone, prefixes] of Object.entries(TAB_ZONES)) {
    if (prefixes.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))) {
      return zone;
    }
  }
  return null;
}

// Bottom Navigation Bar para mobile
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Início', icon: Home, path: '/', zone: 'home' },
    { label: 'Obras', icon: FolderOpen, path: createPageUrl('Regionais'), zone: 'regionais' },
    { label: 'Projetos', icon: Grid, path: createPageUrl('Projects'), zone: 'projects' },
    { label: 'Registros', icon: LayoutDashboard, path: createPageUrl('MeusEnsaios'), zone: 'registros' },
  ];

  useEffect(() => {
    const zone = getTabZone(location.pathname);
    if (zone) sessionStorage.setItem(`tab_stack_${zone}`, location.pathname + location.search);
  }, [location]);

  const handleTabPress = useCallback((item) => {
    const currentZone = getTabZone(location.pathname);
    if (currentZone === item.zone) {
      navigate(item.path);
    } else {
      const saved = sessionStorage.getItem(`tab_stack_${item.zone}`);
      navigate(saved || item.path);
    }
  }, [location.pathname, navigate]);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F2F1EF] border-t border-black/10 flex items-center justify-around"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map((item) => {
        const currentZone = getTabZone(location.pathname);
        const isActive = currentZone === item.zone;
        return (
          <button
            key={item.label}
            onClick={() => handleTabPress(item)}
            className={`flex flex-col items-center gap-1 py-3 px-6 transition-colors select-none ${
              isActive ? 'text-[#00233B]' : 'text-[#00233B]/50'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive ? 'text-[#BFCF99]' : ''}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// Mobile Header — back button + new record button (rendered inside AppLayout for Dialog access)
// Placeholder kept for structural reference; actual header is inlined in AppLayout below.

// Memoizar componente de diálogo para evitar re-renders
const CreateEnsaioDialog = React.memo(({ onSelect, user, obrasDoUsuario }) => {
  const navigate = useNavigate();

  const diarioObra = useMemo(() => ({
    title: "Diário de Obra",
    url: createPageUrl("DiarioObra"),
    icon: Book,
    description: "Registro diário de atividades"
  }), []);

  const tiposObraDisponiveis = useMemo(() => {
    if (!obrasDoUsuario || obrasDoUsuario.length === 0) {
      return new Set();
    }
    return new Set(obrasDoUsuario.map(obra => obra.tipo_obra).filter(Boolean));
  }, [obrasDoUsuario]);

  const categorias = useMemo(() => [
    {
      nome: "Supervisão",
      icon: HardHat,
      cor: "text-[#00233B]",
      corFundo: "bg-[#BFCF99]/20 border-[#BFCF99]/30",
      tipo_obra: "supervisao",
      ensaios: [
        { title: "Checklist de Usina", url: createPageUrl("ChecklistUsina"), icon: FileText },
        { title: "Checklist de Aplicação", url: createPageUrl("ChecklistAplicacao"), icon: FileText },
        { title: "Checklist de MRAF", url: createPageUrl("ChecklistMRAF"), icon: FileText },
        { title: "Checklist de Concretagem", url: createPageUrl("ChecklistConcretagem"), icon: FileText },
        { title: "Checklist de Terraplanagem", url: createPageUrl("ChecklistTerraplanagem"), icon: FileText },
        { title: "Checklist de Reciclagem", url: createPageUrl("ChecklistReciclagem"), icon: FileText },
        { title: "Ensaio de CAUQ", url: createPageUrl("EnsaioCAUQ"), icon: FlaskConical },
        { title: "Acompanhamento de Usinagem", url: createPageUrl("AcompanhamentoUsinagem"), icon: FlaskConical },
        { title: "Taxa de Pintura/Imprimação", url: createPageUrl("EnsaioTaxaPinturaImprimacao"), icon: FlaskConical },
        { title: "Rompimento Concreto", url: createPageUrl("EnsaioRompimentoConcreto"), icon: FlaskConical },
        { title: "Mancha + Pêndulo", url: createPageUrl("EnsaioManchaPendulo"), icon: Gauge },
        { title: "Sondagem", url: createPageUrl("EnsaioSondagem"), icon: Gauge },
        { title: "Viga Benkelman", url: createPageUrl("EnsaioVigaBenkelman"), icon: Gauge },
        { title: "Taxa MRAF", url: createPageUrl("EnsaioTaxaMRAF"), icon: FlaskConical }
      ]
    },
    {
      nome: "Implantação",
      icon: Construction,
      cor: "text-[#00233B]",
      corFundo: "bg-[#BFCF99]/20 border-[#BFCF99]/30",
      tipo_obra: "implantacao",
      ensaios: [
        { title: "Ensaio MRAF", url: createPageUrl("EnsaioMRAF"), icon: FlaskConical },
        { title: "Acompanhamento de Usinagem", url: createPageUrl("AcompanhamentoUsinagem"), icon: FlaskConical },
        { title: "Taxa de Pintura/Imprimação", url: createPageUrl("EnsaioTaxaPinturaImprimacao"), icon: FlaskConical },
        { title: "Granulometria Individual", url: createPageUrl("EnsaioGranulometriaIndividual"), icon: FlaskConical },
        { title: "Granulometria da Mistura", url: createPageUrl("EnsaioGranMistura"), icon: FlaskConical },
        { title: "Rompimento Concreto", url: createPageUrl("EnsaioRompimentoConcreto"), icon: FlaskConical },
        { title: "Mancha + Pêndulo", url: createPageUrl("EnsaioManchaPendulo"), icon: Gauge },
        { title: "Densidade In Situ", url: createPageUrl("EnsaioDensidadeInSitu"), icon: Gauge },
        { title: "Sondagem", url: createPageUrl("EnsaioSondagem"), icon: Gauge },
        { title: "Viga Benkelman", url: createPageUrl("EnsaioVigaBenkelman"), icon: Gauge },
        { title: "Taxa MRAF", url: createPageUrl("EnsaioTaxaMRAF"), icon: FlaskConical },
        { title: "Ensaio Proctor", url: createPageUrl("EnsaioProctor"), icon: FlaskConical }
      ]
    },
    {
      nome: "Conservação",

      icon: Wrench,
      cor: "text-[#00233B]",
      corFundo: "bg-[#BFCF99]/20 border-[#BFCF99]/30",
      tipo_obra: "conservacao",
      ensaios: [
        { title: "Ensaio de CAUQ", url: createPageUrl("EnsaioCAUQ"), icon: FlaskConical },
        { title: "Ensaio MRAF", url: createPageUrl("EnsaioMRAF"), icon: FlaskConical },
        { title: "Acompanhamento de Usinagem", url: createPageUrl("AcompanhamentoUsinagem"), icon: FlaskConical },
        { title: "Acompanhamento de Cargas", url: createPageUrl("AcompanhamentoCarga"), icon: FlaskConical },
        { title: "Taxa de Pintura/Imprimação", url: createPageUrl("EnsaioTaxaPinturaImprimacao"), icon: FlaskConical },
        { title: "Granulometria + Equiv. Areia", url: createPageUrl("EnsaioGranAreia"), icon: FlaskConical },
        { title: "Granulometria Individual", url: createPageUrl("EnsaioGranulometriaIndividual"), icon: FlaskConical },
        { title: "Granulometria da Mistura", url: createPageUrl("EnsaioGranMistura"), icon: FlaskConical },
        { title: "Rompimento Concreto", url: createPageUrl("EnsaioRompimentoConcreto"), icon: FlaskConical },
        { title: "Mancha + Pêndulo", url: createPageUrl("EnsaioManchaPendulo"), icon: Gauge },
        { title: "Densidade In Situ", url: createPageUrl("EnsaioDensidadeInSitu"), icon: Gauge },
        { title: "Sondagem", url: createPageUrl("EnsaioSondagem"), icon: Gauge },
        { title: "Viga Benkelman", url: createPageUrl("EnsaioVigaBenkelman"), icon: Gauge },
        { title: "Taxa MRAF", url: createPageUrl("EnsaioTaxaMRAF"), icon: FlaskConical },
        { title: "Ensaio Proctor", url: createPageUrl("EnsaioProctor"), icon: FlaskConical }
      ]
    },
    {
      nome: "Sondagem",
      icon: Gauge,
      cor: "text-[#00233B]",
      corFundo: "bg-[#BFCF99]/20 border-[#BFCF99]/30",
      tipo_obra: "sondagem",
      ensaios: [
        { title: "Boletim de Sondagem (PI)", url: createPageUrl("BoletimSondagem"), icon: FileText },
        { title: "Boletim de Sondagem a Trado", url: createPageUrl("BoletimSondagemTrado"), icon: FileText },
        { title: "Ensaio Proctor", url: createPageUrl("EnsaioProctor"), icon: FlaskConical }
      ]
    },
    {
      nome: "Levantamentos",
      icon: FileText,
      cor: "text-[#00233B]",
      corFundo: "bg-[#BFCF99]/20 border-[#BFCF99]/30",
      tipo_obra: "levantamentos",
      ensaios: [
        { title: "Mancha + Pêndulo", url: createPageUrl("EnsaioManchaPendulo"), icon: Gauge },
        { title: "Viga Benkelman", url: createPageUrl("EnsaioVigaBenkelman"), icon: Gauge }
      ]
    }
  ], []);

  const categoriasDisponiveis = useMemo(() =>
    categorias.filter(categoria => tiposObraDisponiveis.has(categoria.tipo_obra)),
    [categorias, tiposObraDisponiveis]
  );

  const handleSelect = useCallback((url) => {
    navigate(url);
    onSelect();
  }, [navigate, onSelect]);

  if (user && user.access_level === 'user' && obrasDoUsuario && obrasDoUsuario.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <AlertTriangle className="w-16 h-16 text-[#BFCF99] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#00233B] mb-2">
          Nenhuma obra disponível
        </h3>
        <p className="text-[#00233B]/80">
          Você não está alocado em nenhuma obra no momento. Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <h3 className="text-sm font-semibold text-[#00233B]/90 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#BFCF99]" />
          Registro Geral
        </h3>
        <button
          onClick={() => handleSelect(diarioObra.url)}
          className="w-full flex items-center gap-4 p-4 border-2 rounded-lg hover:bg-white/10 transition-colors duration-200 text-left border-white/20 hover:border-[#BFCF99]/50"
        >
          <div className="w-12 h-12 bg-[#BFCF99]/30 rounded-lg flex items-center justify-center shrink-0">
            <diarioObra.icon className="w-6 h-6 text-[#00233B]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#00233B]">{diarioObra.title}</p>
            <p className="text-sm text-[#00233B]/70">{diarioObra.description}</p>
          </div>
        </button>
      </div>

      {categoriasDisponiveis.length > 0 && (
        <>
          <Separator className="bg-white/20"/>
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-[#00233B]/90 flex items-center gap-2">
              <Grid className="w-4 h-4 text-[#BFCF99]" />
              Ensaios por Tipo de Obra
            </h3>

            {categoriasDisponiveis.map((categoria) => (
              <div key={categoria.nome} className={`border-2 rounded-lg p-4 ${categoria.corFundo}`}>
                <div className="flex items-center gap-2 mb-3">
                  <categoria.icon className={`w-5 h-5 ${categoria.cor}`} />
                  <h4 className={`font-bold ${categoria.cor}`}>{categoria.nome}</h4>
                  {categoria.ensaios.length > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-black/10 text-[#00233B]">
                      {categoria.ensaios.length} {categoria.ensaios.length === 1 ? 'ensaio' : 'ensaios'}
                    </Badge>
                  )}
                </div>

                {categoria.ensaios.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {categoria.ensaios.map((ensaio) => (
                      <button
                        key={ensaio.title}
                        onClick={() => handleSelect(ensaio.url)}
                        className="flex items-center gap-3 p-3 bg-[#F2F1EF]/30 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-200 text-left"
                      >
                        <ensaio.icon className="w-5 h-5 text-[#BFCF99]" />
                        <p className="font-medium text-[#00233B] text-sm">{ensaio.title}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-black/5 rounded-lg border border-dashed border-white/20">
                    <p className="text-sm text-[#00233B]/60 italic">
                      Ensaios específicos para {categoria.nome.toLowerCase()} serão adicionados em breve
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {categoriasDisponiveis.length === 0 && (!user || user.access_level !== 'user' || (user.access_level === 'user' && obrasDoUsuario && obrasDoUsuario.length > 0)) && (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-[#BFCF99] mx-auto mb-3" />
          <p className="text-sm text-[#00233B]/80">
            Nenhum tipo de ensaio disponível para as obras alocadas.
          </p>
        </div>
      )}
    </div>
  );
});

CreateEnsaioDialog.displayName = 'CreateEnsaioDialog';

// Componente de link que fecha a sidebar no mobile ao ser clicado
const NavLink = ({ to, children, className }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <Link
      to={to}
      className={className}
      onClick={() => { if (isMobile) setOpenMobile(false); }}
    >
      {children}
    </Link>
  );
};

const AppLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [obrasDoUsuario, setObrasDoUsuario] = React.useState([]);
  const [isCreateEnsaioOpen, setIsCreateEnsaioOpen] = React.useState(false);
  const [loadingUser, setLoadingUser] = React.useState(true);
  const [pendingTransfers, setPendingTransfers] = React.useState(0);
  const [naoConformidadesOpen, setNaoConformidadesOpen] = React.useState(false);
  const [minhasObrasOpen, setMinhasObrasOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  useEffect(() => {
    // Desabilitar tradução automática
    document.documentElement.setAttribute('translate', 'no');
    document.documentElement.setAttribute('lang', 'pt-BR');
    
    const metaTag = document.querySelector('meta[name="google"]');
    if (!metaTag) {
      const meta = document.createElement('meta');
      meta.name = 'google';
      meta.content = 'notranslate';
      document.head.appendChild(meta);
    }
  }, []);

  React.useEffect(() => {
    loadUserAndObras();
  }, []);

  // Atualizar last_login apenas uma vez por sessão do browser
  React.useEffect(() => {
    const sessionKey = 'lastLoginUpdated';
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
    base44.functions.invoke('updateLastLogin', {}).catch(() => {});
  }, []);

  const loadUserAndObras = useCallback(async () => {
    setLoadingUser(true);
    try {
      const userData = await User.me();
      
      // Verificar se o usuário está inativo
      if (userData && userData.is_active === false) {
        await User.logout();
        return;
      }
      
      setUser(userData);

      const userAccessLevel = userData?.access_level || (userData?.role === 'admin' ? 'admin' : 'user');

      if (userAccessLevel === 'user') {
        const [obrasData, regionaisData] = await Promise.all([
          Obra.list(),
          Regional.list()
        ]);

        const regionalDoLaboratorista = regionaisData.find(regional => {
          const laboratoristas = regional.laboratoristas_responsaveis || [];
          return laboratoristas.some(email => email.toLowerCase() === userData.email.toLowerCase());
        });

        if (regionalDoLaboratorista) {
          const obrasRegional = obrasData.filter(obra =>
            obra.regional_id === regionalDoLaboratorista.id &&
            obra.status === 'em_andamento'
          );
          setObrasDoUsuario(obrasRegional);
        } else {
          setObrasDoUsuario([]);
        }
      } else {
        // For admin, gestor, and sala_tecnica, show all types for creation
        setObrasDoUsuario([{ tipo_obra: 'supervisao' }, { tipo_obra: 'implantacao' }, { tipo_obra: 'conservacao' }, { tipo_obra: 'sondagem' }, { tipo_obra: 'levantamentos' }]);
      }

      // Carregar transferências pendentes para gestores
      if (userAccessLevel === 'gestor_contrato' || userAccessLevel === 'sala_tecnica_afirmaevias') {
        const [regionaisData, transferenciaObra, transferenciaRegional] = await Promise.all([
          Regional.list(),
          base44.entities.SolicitacaoTransferenciaObra.list(),
          base44.entities.SolicitacaoTransferenciaRegional.list()
        ]);

        const regionaisDoGestor = regionaisData.filter(r => 
          r.gestor_contrato_responsavel?.toLowerCase() === userData.email?.toLowerCase() ||
          (r.gestores_contrato_responsaveis || []).some(email => email.toLowerCase() === userData.email?.toLowerCase()) ||
          (r.salas_tecnicas_responsaveis || []).some(email => email.toLowerCase() === userData.email?.toLowerCase())
        );

        const regionaisIds = regionaisDoGestor.map(r => r.id);

        const obrasPendentes = transferenciaObra.filter(t => 
          t.status === 'pendente' && (regionaisIds.includes(t.obra_destino_id) || regionaisIds.includes(t.obra_atual_id))
        );

        const regionaisPendentes = transferenciaRegional.filter(t => 
          t.status === 'pendente' && regionaisIds.includes(t.regional_destino_id)
        );

        setPendingTransfers(obrasPendentes.length + regionaisPendentes.length);
      }
    } catch (error) {
      console.error("Erro ao carregar usuário e obras:", error);
      setUser(null);
      setObrasDoUsuario([]);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await User.logout();
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    await User.logout();
  }, []);

  const userAccessLevel = user?.access_level || (user?.role === 'admin' ? 'admin' : 'user');
  const isAdmin = userAccessLevel === 'admin' || user?.role === 'admin';
  const isSalaTecnica = userAccessLevel === 'sala_tecnica_afirmaevias';
  const isGestorContrato = userAccessLevel === 'gestor_contrato';
  const isCliente = userAccessLevel === 'cliente';
  const canManageSystem = isAdmin;
  const canCreateRecords = !loadingUser && (isAdmin || (!isSalaTecnica && !isGestorContrato && !isCliente));

  const mainNavigation = useMemo(() => [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard, allowedLevels: ['admin', 'gestor_contrato', 'sala_tecnica_afirmaevias', 'cliente'] },
    { title: "Regionais", url: createPageUrl("Regionais"), icon: Grid, allowedLevels: ['admin', 'gestor_contrato', 'sala_tecnica_afirmaevias', 'user'] }
  ], []);

  const adminNavigation = useMemo(() => [
    { title: "Usuários", url: createPageUrl("Users"), icon: Users, allowedLevels: ['admin', 'gestor_contrato', 'sala_tecnica_afirmaevias', 'cliente'] },
    { title: "Produtividade", url: createPageUrl("Produtividade"), icon: BarChart3, allowedLevels: ['admin', 'gestor_contrato', 'sala_tecnica_afirmaevias'] },
    { title: "Controle Laboratoristas", url: createPageUrl("ControleLaboratoristas"), icon: Users, allowedLevels: ['admin'] },
    { title: "Faixas Granulométricas", url: createPageUrl("FaixasGranulometricas"), icon: Grid, allowedLevels: ['admin'] },
    { title: "Migração de Dados", url: createPageUrl("MigracaoDados"), icon: Grid, allowedLevels: ['admin'] },
    { title: "Monitor de Produtividade", url: createPageUrl("MonitorProdutividade"), icon: TrendingUp, allowedLevels: ['admin'] },
    { title: "Configurações", url: createPageUrl("Settings"), icon: Settings, allowedLevels: ['admin'] }
  ], []);

  return (
    <SidebarProvider>
      <Dialog open={isCreateEnsaioOpen} onOpenChange={setIsCreateEnsaioOpen}>
        <div className="min-h-screen flex w-full bg-[#F2F1EF] overflow-x-hidden">
          <Sidebar className="border-r border-white/10 bg-white/10 backdrop-blur-xl">
            <SidebarHeader className="border-b border-white/10 p-4">
              <div className="flex items-center justify-center">
                {/* Light mode logo */}
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68a7599ee3fb9205cfb852ec/b2878d2bd_image.png"
                  alt="Afirmaevias Logo"
                  className="h-16 w-auto dark:hidden"
                  loading="lazy"
                />
                {/* Dark mode logo */}
                <img
                  src="https://media.base44.com/images/public/68a7599ee3fb9205cfb852ec/7d9853579_LogoDarkmode.jpg"
                  alt="Afirmaevias Logo"
                  className="h-16 w-auto hidden dark:block"
                  loading="lazy"
                />
              </div>
            </SidebarHeader>

            <SidebarContent className="p-3">
              {canCreateRecords && (
                <DialogTrigger asChild>
                  <Button className="w-full bg-[#00233B] text-[#F2F1EF] hover:bg-[#00233B]/90 mb-4 hidden lg:flex">
                    <FilePlus className="w-5 h-5 mr-2 text-[#BFCF99]" />
                    Novo Registro
                  </Button>
                </DialogTrigger>
              )}

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-[#00233B]/70 uppercase tracking-wider px-3 py-2">
                  Principal
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {mainNavigation.map((item) => {
                      const canViewAdminOnly = !item.adminOnly || canManageSystem;
                      const canViewAllowedLevels = !item.allowedLevels || item.allowedLevels.includes(userAccessLevel);
                      const showNotification = item.showBadge && pendingTransfers > 0 && (isGestorContrato || isSalaTecnica);

                      return (canViewAdminOnly && canViewAllowedLevels) && (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === item.url ? 'bg-black/10' : ''}`}
                          >
                            <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5 relative">
                              <item.icon className="w-5 h-5 text-[#BFCF99]" />
                              <span className="font-medium text-[#00233B]">{item.title}</span>
                              {showNotification && (
                                <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                  {pendingTransfers}
                                </Badge>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}

                    {/* Minhas Obras - menu expansível */}
                    {(['admin', 'gestor_contrato', 'sala_tecnica_afirmaevias', 'cliente', 'user'].includes(userAccessLevel)) && (
                      <>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 cursor-pointer`}
                            onClick={() => setMinhasObrasOpen(prev => !prev)}
                          >
                            <div className="flex items-center gap-3 px-3 py-2.5 w-full">
                              <FolderOpen className="w-5 h-5 text-[#BFCF99]" />
                              <span className="font-medium text-[#00233B] flex-1">Minhas Obras</span>
                              {minhasObrasOpen
                                ? <ChevronDown className="w-4 h-4 text-[#00233B]/60" />
                                : <ChevronRight className="w-4 h-4 text-[#00233B]/60" />
                              }
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        {minhasObrasOpen && (
                          <>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === createPageUrl("Projects") ? 'bg-black/10' : ''}`}
                              >
                                <NavLink to={createPageUrl("Projects")} className="flex items-center gap-3 pl-10 pr-3 py-2.5">
                                  <FolderOpen className="w-4 h-4 text-[#BFCF99]" />
                                  <span className="font-medium text-[#00233B] text-sm">Projetos</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === createPageUrl("MeusEnsaios") ? 'bg-black/10' : ''}`}
                              >
                                <NavLink to={createPageUrl("MeusEnsaios")} className="flex items-center gap-3 pl-10 pr-3 py-2.5">
                                  <FileText className="w-4 h-4 text-[#BFCF99]" />
                                  <span className="font-medium text-[#00233B] text-sm">Ensaios Realizados</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === createPageUrl("ResumosPersonalizados") ? 'bg-black/10' : ''}`}
                              >
                                <NavLink to={createPageUrl("ResumosPersonalizados")} className="flex items-center gap-3 pl-10 pr-3 py-2.5">
                                  <BarChart3 className="w-4 h-4 text-[#BFCF99]" />
                                  <span className="font-medium text-[#00233B] text-sm">Resumos</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === createPageUrl("SolicitacoesTransferencia") ? 'bg-black/10' : ''}`}
                              >
                                <NavLink to={createPageUrl("SolicitacoesTransferencia")} className="flex items-center gap-3 pl-10 pr-3 py-2.5">
                                  <ArrowLeftRight className="w-4 h-4 text-[#BFCF99]" />
                                  <span className="font-medium text-[#00233B] text-sm">Transferências</span>
                                  {pendingTransfers > 0 && (isGestorContrato || isSalaTecnica) && (
                                    <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                      {pendingTransfers}
                                    </Badge>
                                  )}
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            {(isGestorContrato || isAdmin) && (
                              <SidebarMenuItem>
                                <SidebarMenuButton
                                  asChild
                                  className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === '/ImpressionEtiquetas' ? 'bg-black/10' : ''}`}
                                >
                                  <NavLink to="/ImpressionEtiquetas" className="flex items-center gap-3 pl-10 pr-3 py-2.5">
                                    <FileText className="w-4 h-4 text-[#BFCF99]" />
                                    <span className="font-medium text-[#00233B] text-sm">Impressão de Etiquetas</span>
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {/* Não Conformidades - menu expansível */}
                    {(['admin', 'gestor_contrato', 'sala_tecnica_afirmaevias', 'cliente'].includes(userAccessLevel)) && (
                      <>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 cursor-pointer`}
                            onClick={() => setNaoConformidadesOpen(prev => !prev)}
                          >
                            <div className="flex items-center gap-3 px-3 py-2.5 w-full">
                              <AlertTriangle className="w-5 h-5 text-[#BFCF99]" />
                              <span className="font-medium text-[#00233B] flex-1">Não Conformidades</span>
                              {naoConformidadesOpen
                                ? <ChevronDown className="w-4 h-4 text-[#00233B]/60" />
                                : <ChevronRight className="w-4 h-4 text-[#00233B]/60" />
                              }
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        {naoConformidadesOpen && (
                          <>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === createPageUrl("NaoConformidades") ? 'bg-black/10' : ''}`}
                              >
                                <NavLink to={createPageUrl("NaoConformidades")} className="flex items-center gap-3 pl-10 pr-3 py-2.5">
                                  <BarChart3 className="w-4 h-4 text-[#BFCF99]" />
                                  <span className="font-medium text-[#00233B] text-sm">Dashboard de NCs</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === createPageUrl("GestaoNC") ? 'bg-black/10' : ''}`}
                              >
                                <NavLink to={createPageUrl("GestaoNC")} className="flex items-center gap-3 pl-10 pr-3 py-2.5">
                                  <FileText className="w-4 h-4 text-[#BFCF99]" />
                                  <span className="font-medium text-[#00233B] text-sm">Gestão de NCs</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            {(isGestorContrato || isAdmin) && (
                              <SidebarMenuItem>
                                <SidebarMenuButton
                                  asChild
                                  className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === createPageUrl("NovaNC") ? 'bg-black/10' : ''}`}
                                >
                                  <NavLink to={createPageUrl("NovaNC")} className="flex items-center gap-3 pl-10 pr-3 py-2.5">
                                    <AlertTriangle className="w-4 h-4 text-[#BFCF99]" />
                                    <span className="font-medium text-[#00233B] text-sm">Nova NC</span>
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {canManageSystem && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-semibold text-[#00233B]/70 uppercase tracking-wider px-3 py-2">
                    Administração
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminNavigation.map((item) => {
                        const canViewAllowedLevels = !item.allowedLevels || item.allowedLevels.includes(userAccessLevel);

                        return canViewAllowedLevels && (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === item.url ? 'bg-black/10' : ''}`}
                            >
                              <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                                <item.icon className="w-5 h-5 text-[#BFCF99]" />
                                <span className="font-medium text-[#00233B]">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              {!canManageSystem && (isGestorContrato || isSalaTecnica || isCliente) && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-semibold text-[#00233B]/70 uppercase tracking-wider px-3 py-2">
                    Gestão
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminNavigation.map((item) => {
                        const canViewAllowedLevels = !item.allowedLevels || item.allowedLevels.includes(userAccessLevel);

                        return canViewAllowedLevels && (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              className={`hover:bg-black/5 transition-all duration-200 rounded-lg mb-1 ${location.pathname === item.url ? 'bg-black/10' : ''}`}
                            >
                              <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                                <item.icon className="w-5 h-5 text-[#BFCF99]" />
                                <span className="font-medium text-[#00233B]">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </SidebarContent>

            <SidebarFooter className="border-t border-white/10 p-4">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3 hover:bg-black/5">
                      <div className="w-8 h-8 bg-[#00233B] rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-[#BFCF99]" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-[#00233B] text-sm truncate">{user.laboratorista_name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[#00233B]/70 truncate">{user.email}</p>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-black/10 text-[#00233B]"
                          >
                            {isAdmin ? "Admin" :
                             isSalaTecnica ? "Sala Técnica" :
                             isGestorContrato ? "Gestor" :
                             isCliente ? "Cliente" :
                             "Colaborador"}
                          </Badge>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#F2F1EF]/80 backdrop-blur-lg border-white/20 text-[#00233B]">
                    <DropdownMenuItem onClick={() => navigate('/Settings')} className="cursor-pointer focus:bg-white/10">
                      <Settings className="w-4 h-4 mr-2 text-[#BFCF99]" />
                      Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-red-500 cursor-pointer focus:bg-white/10 focus:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Conta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:bg-white/10 focus:text-red-500">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarFooter>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Sua conta e todos os seus dados serão permanentemente removidos do sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, excluir minha conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Sidebar>

          <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
            {/* Mobile unified header */}
            <div
              className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#F2F1EF]/95 backdrop-blur-md border-b border-black/10 flex items-center justify-between px-4"
              style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(3rem + env(safe-area-inset-top))' }}
            >
              {/* Left: back button or logo + profile on home */}
              {location.pathname !== '/' && (
                <button
                  onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
                  className="flex items-center gap-1 text-[#00233B] font-medium select-none py-2 pr-6 pl-1 min-h-[44px] min-w-[80px] active:opacity-70"
                >
                <div className="flex items-center gap-2 py-3">
                  {user && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-[#00233B]/10 hover:bg-[#00233B]/20">
                          <UserIcon className="w-4 h-4 text-[#00233B]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20 text-[#00233B]">
                        <div className="px-3 py-2 border-b border-black/10">
                          <p className="text-xs font-medium text-[#00233B] truncate">{user.email}</p>
                          <p className="text-[10px] text-[#00233B]/60 truncate">{user.laboratorista_name || user.full_name}</p>
                        </div>
                        <DropdownMenuItem onClick={() => navigate('/Settings')} className="cursor-pointer focus:bg-white/10">
                          <Settings className="w-4 h-4 mr-2 text-[#BFCF99]" />
                          Configurações
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:bg-white/10">
                          <LogOut className="w-4 h-4 mr-2" />
                          Sair
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <span className="text-base font-bold text-[#00233B]">Afirmaevias</span>
                </div>
                </button>
              )}

{/* Right: new record button */}
              <div className="flex items-center gap-2">
                {canCreateRecords && (
                  <DialogTrigger asChild>
                    <Button size="icon" className="bg-[#00233B] text-[#F2F1EF] shadow-lg ring-2 ring-white/20 hover:bg-[#00233B]/90 transition-colors h-11 w-11 active:scale-95">
                      <FilePlus className="w-5 h-5 text-[#BFCF99]"/>
                    </Button>
                  </DialogTrigger>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                className="flex-1 flex flex-col"
              >
                <PullToRefresh>
                  <div className="pb-16 lg:pb-0 lg:pt-0 overflow-x-hidden" style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top))' }}>
                    {children}
                  </div>
                </PullToRefresh>
              </motion.div>
            </AnimatePresence>
            <BottomNav />
          </main>
        </div>

        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden bg-[#F2F1EF]/80 backdrop-blur-xl border-white/20 text-[#00233B]">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#00233B]">Iniciar Novo Registro</DialogTitle>
            <p className="text-sm text-[#00233B]/80">Selecione o tipo de registro que deseja criar</p>
          </DialogHeader>
          <CreateEnsaioDialog
            onSelect={() => setIsCreateEnsaioOpen(false)}
            user={user}
            obrasDoUsuario={obrasDoUsuario}
          />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default function Layout({ children, currentPageName }) {
  const reportPages = useMemo(() => ["RelatorioEnsaio", "RelatorioDiario", "RelatorioChecklist", "RelatorioChecklistAplicacao", "RelatorioChecklistMRAF", "RelatorioChecklistConcretagem", "RelatorioChecklistTerraplanagem", "RelatorioChecklistReciclagem", "RelatorioSondagem", "RelatorioDensidadeInSitu", "RelatorioTaxaPinturaImprimacao", "RelatorioConsolidado", "RelatorioCAUQ", "RelatorioGranulometriaIndividual", "RelatorioAcompanhamentoUsinagem", "RelatorioAcompanhamentoCarga", "RelatorioManchaPendulo", "RelatorioVigaBenkelman", "RelatorioTaxaMRAF", "RelatorioNC", "RelatorioBoletimSondagem", "RelatorioBoletimSondagemTrado", "RelatorioProctor", "RelatorioRompimentoConcreto", "RelatorioGranMistura"], []);

  if (reportPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}