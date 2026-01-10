import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { DiarioObra as DiarioObraEntity } from "@/entities/DiarioObra";
import { Obra } from "@/entities/Obra";
import { Regional } from "@/entities/Regional";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";



// getInitialFormData should be outside component to avoid re-creation on every render
const getInitialFormData = () => ({
  obra_id: "",
  data: new Date().toISOString().split('T')[0],
  tipo_local: "campo",
  usina_selecionada: "",
  rodovia: "",
  trecho: "",
  condicoes_climaticas: "ensolarado",
  temperatura: "",
  atividades_realizadas: "",
  ocorrencias: "",
  observacoes: "",
  fotos: [],
  approved: null,
  rejection_reason: null,
  created_by: "", // Placeholder, actual created_by is set on save/backend
});

// DiarioForm is now a controlled component, receiving all data and handlers as props
const DiarioForm = ({
  formData,
  handleChange,
  handleFileChange,
  handleRemovePhoto,
  handleSubmit,
  onCancel,
  obras,
  regionais,
  user,
  loadingUpload,
  selectedFileNames,
  uploadProgress,
  isEditable,
  isApproved,
  rejectionReason,
  isCreatingNew,
  status
}) => {
  // Calculate selected obra and regional here for display purposes
  const obraSelecionada = obras.find(o => o.id === formData.obra_id);
  const regionalSelecionada = obraSelecionada ? regionais.find(r => r.id === obraSelecionada.regional_id) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === 'rascunho' && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
                <p className="font-semibold text-blue-800">Em Rascunho</p>
                <p className="text-sm text-blue-700">Este registro ainda está em edição e não será visível aos gestores até que você o finalize.</p>
            </div>
        </div>
      )}

      {rejectionReason && (
          <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                  <p className="font-semibold text-red-800">Motivo da Reprovação:</p>
                  <p className="text-sm text-red-700">{rejectionReason}</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seleção de Obra */}
        <div className="space-y-2">
          <Label htmlFor="obra_id">Obra *</Label>
          <Select
            value={formData.obra_id || ""}
            onValueChange={(value) => handleChange('obra_id', value)}
            required
            disabled={!isEditable || isApproved || !isCreatingNew} // Disable if not editable, approved, or if editing an existing entry
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a obra" />
            </SelectTrigger>
            <SelectContent>
              {obras.map(obra => {
                const regional = regionais.find(r => r.id === obra.regional_id);
                return (
                  <SelectItem key={obra.id} value={obra.id}>
                    {obra.name} - {obra.code}
                    {regional && ` (${regional.nome})`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        {/* Display regional and client info if an obra and regional are selected */}
        {regionalSelecionada && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-1 text-sm">
              <p className="text-blue-800">
                <strong>📍 Regional:</strong> {regionalSelecionada.nome} - {regionalSelecionada.codigo}
              </p>
              {regionalSelecionada.cliente && (
                <p className="text-blue-800">
                  <strong>👤 Cliente:</strong> {regionalSelecionada.cliente}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="data">Data *</Label>
        <Input
          id="data"
          name="data"
          type="date"
          value={formData.data}
          onChange={(e) => handleChange(e.target.name, e.target.value)}
          required
          disabled={!isEditable || isApproved}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Local do Registro *</Label>
        <div className="flex items-center space-x-4">
            <label className="flex items-center">
                <input type="radio" name="tipo_local" value="campo" checked={formData.tipo_local === 'campo'} onChange={(e) => handleChange(e.target.name, e.target.value)} disabled={!isEditable || isApproved} className="mr-2"/>
                Campo
            </label>
            <label className="flex items-center">
                <input type="radio" name="tipo_local" value="usina" checked={formData.tipo_local === 'usina'} onChange={(e) => handleChange(e.target.name, e.target.value)} disabled={!isEditable || isApproved} className="mr-2"/>
                Usina
            </label>
        </div>
      </div>

      {formData.tipo_local === 'campo' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rodovia">Rodovia</Label>
            <Input id="rodovia" name="rodovia" value={formData.rodovia} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="Ex: BR-277" disabled={!isEditable || isApproved} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trecho">Trecho</Label>
            <Input id="trecho" name="trecho" value={formData.trecho} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="Ex: km 10 ao km 15" disabled={!isEditable || isApproved} />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="usina_selecionada">Usina</Label>
          <Input id="usina_selecionada" name="usina_selecionada" value={formData.usina_selecionada} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="Nome da usina" disabled={!isEditable || isApproved} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="condicoes_climaticas">Condições Climáticas *</Label>
          <select id="condicoes_climaticas" name="condicoes_climaticas" value={formData.condicoes_climaticas} onChange={(e) => handleChange(e.target.name, e.target.value)} required disabled={!isEditable || isApproved} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="ensolarado">Ensolarado</option>
            <option value="nublado">Nublado</option>
            <option value="chuvoso">Chuvoso</option>
            <option value="garoa">Garoa</option>
            <option value="vento_forte">Vento Forte</option>
            <option value="neblina">Neblina</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="temperatura">Temperatura (°C)</Label>
          <Input id="temperatura" name="temperatura" type="number" value={formData.temperatura} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="Ex: 25" disabled={!isEditable || isApproved} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="atividades_realizadas">Atividades Realizadas *</Label>
        <Textarea
          id="atividades_realizadas"
          name="atividades_realizadas"
          value={formData.atividades_realizadas}
          onChange={(e) => handleChange(e.target.name, e.target.value)}
          placeholder="Descreva as atividades realizadas no dia."
          rows={4}
          required
          disabled={!isEditable || isApproved}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ocorrencias">Ocorrências</Label>
        <Textarea
          id="ocorrencias"
          name="ocorrencias"
          value={formData.ocorrencias}
          onChange={(e) => handleChange(e.target.name, e.target.value)}
          placeholder="Descreva quaisquer ocorrências ou problemas."
          rows={3}
          disabled={!isEditable || isApproved}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações Gerais</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          value={formData.observacoes}
          onChange={(e) => handleChange(e.target.name, e.target.value)}
          placeholder="Outras observações importantes."
          rows={3}
          disabled={!isEditable || isApproved}
        />
      </div>

      <div className="space-y-2">
        <Label>Relatório Fotográfico</Label>
        {isEditable && !isApproved && (
          <div>
            <Input
              id="fotos"
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={loadingUpload}
              className="hidden"
            />
            <Label 
              htmlFor="fotos" 
              className={`flex items-center justify-between w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background cursor-pointer hover:bg-slate-50 ${loadingUpload ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="truncate text-slate-500">{selectedFileNames}</span>
              <span className="flex-shrink-0 ml-4 px-3 py-1 rounded-md text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100">
                {loadingUpload ? 'Enviando...' : 'Escolher Ficheiros'}
              </span>
            </Label>
          </div>
        )}
        {loadingUpload && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando fotos...
            </p>
            {uploadProgress.length > 0 && (
              <div className="text-xs space-y-1 mt-2">
                {uploadProgress.map((progress) => (
                  <div key={progress.id} className="flex items-center gap-2">
                    <span className="w-4">
                      {progress.status === 'pending' && '⚪'}
                      {progress.status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                      {progress.status === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
                      {progress.status === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
                    </span>
                    <span className={`${progress.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                      {progress.fileName} - {progress.status === 'pending' && 'Aguardando'}
                      {progress.status === 'uploading' && 'Enviando...'}
                      {progress.status === 'success' && 'Sucesso'}
                      {progress.status === 'error' && `Erro: ${progress.error}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {formData.fotos && formData.fotos.map((url, index) => (
            <div key={index} className="relative group">
              <img src={url} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded-md border" />
              {isEditable && !isApproved && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemovePhoto(index)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {(!formData.fotos || formData.fotos.length === 0) && !loadingUpload && (
          <p className="text-sm text-gray-500 mt-2">Nenhuma foto adicionada.</p>
        )}
      </div>

      <div className="flex justify-end gap-4 mt-6">
         <Button type="button" variant="outline" onClick={onCancel}>
           Cancelar
         </Button>
         {isEditable && !isApproved && (
           <>
             <Button 
               type="button" 
               variant="outline"
               disabled={loadingUpload}
               onClick={async (e) => {
                 e.preventDefault();
                 await handleSubmit(e, 'rascunho');
               }}
               className="border-blue-500 text-blue-600 hover:bg-blue-50"
             >
               <Save className="mr-2 h-4 w-4" /> Salvar Progresso
             </Button>
             <Button type="submit" disabled={loadingUpload}>
               <Save className="mr-2 h-4 w-4" /> Finalizar
             </Button>
           </>
         )}
         {isApproved && (
           <Badge className="bg-green-500 hover:bg-green-500 px-4 py-2 text-md">
             <CheckCircle className="mr-2 h-4 w-4" /> Aprovado
           </Badge>
         )}
       </div>
    </form>
  );
};

export default function DiarioObraPage() {
  const [obras, setObras] = useState([]);
  const [regionais, setRegionais] = useState([]);
  const [user, setUser] = useState(null);
  const [editingDiarioOriginal, setEditingDiarioOriginal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lifted form state and handlers from DiarioForm
  const [formData, setFormData] = useState(getInitialFormData());
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState("Nenhum ficheiro selecionado");
  const [uploadProgress, setUploadProgress] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  // Unified handleChange for all form fields
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não suportado: ${file.type}. Use apenas JPEG, PNG, GIF ou WebP.`);
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 10MB.`);
    }

    return true;
  };

  const uploadFileWithRetry = async (file, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/${maxRetries} para upload: ${file.name}`);
        const result = await UploadFile({ file });
        console.log(`Upload bem-sucedido: ${file.name}`, result);
        return result;
      } catch (error) {
        console.error(`Tentativa ${attempt} falhou para ${file.name}:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`Upload falhou após ${maxRetries} tentativas: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
        setSelectedFileNames("Nenhum ficheiro selecionado");
        return;
    }

    console.log(`Iniciando upload de ${files.length} arquivo(s)`);
    
    try {
      files.forEach(file => validateFile(file));
    } catch (error) {
      alert(error.message);
      e.target.value = '';
      return;
    }

    setLoadingUpload(true);
    if (files.length === 1) {
        setSelectedFileNames(files[0].name);
    } else {
        setSelectedFileNames(`${files.length} ficheiros selecionados`);
    }

    setUploadProgress(files.map((file, index) => ({ id: `${file.name}-${index}`, fileName: file.name, status: 'pending', error: null })));

    try {
      const uploadedUrls = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const currentFileId = `${file.name}-${i}`;

        try {
          console.log(`Processando arquivo ${i + 1}/${files.length}: ${file.name}`);
          
          setUploadProgress(prev => 
            prev.map(p => p.id === currentFileId ? { ...p, status: 'uploading' } : p)
          );

          const result = await uploadFileWithRetry(file);
          uploadedUrls.push(result.file_url);
          
          setUploadProgress(prev => 
            prev.map(p => p.id === currentFileId ? { ...p, status: 'success' } : p)
          );
          
        } catch (error) {
          console.error(`Erro no upload do arquivo ${file.name}:`, error);
          errors.push({ fileName: file.name, error: error.message });
          
          setUploadProgress(prev => 
            prev.map(p => p.id === currentFileId ? { ...p, status: 'error', error: error.message } : p)
          );
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          fotos: [...(prev.fotos || []), ...uploadedUrls],
        }));
      }

      if (errors.length > 0) {
        const errorMessage = `${uploadedUrls.length} de ${files.length} arquivos enviados com sucesso.\n\nErros:\n` +
          errors.map(e => `• ${e.fileName}: ${e.error}`).join('\n');
        alert(errorMessage);
      } else {
        console.log(`Todos os ${files.length} arquivo(s) enviados com sucesso!`);
      }

    } catch (error) {
      console.error("Erro geral no upload:", error);
      alert(`Erro geral no upload: ${error.message}`);
    } finally {
      setLoadingUpload(false);
      setUploadProgress([]);
      e.target.value = ''; // Clear file input
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async (e, saveStatus = 'finalizado') => {
    e.preventDefault();
    
    // Validações obrigatórias apenas quando finalizando
    if (saveStatus === 'finalizado') {
      if (!formData.obra_id) {
        alert("Por favor, selecione uma obra.");
        return;
      }
      if (!formData.atividades_realizadas) {
        alert("Por favor, preencha as atividades realizadas.");
        return;
      }
    } else {
      // Para salvar progresso, apenas obra é obrigatória
      if (!formData.obra_id) {
        alert("Por favor, selecione uma obra.");
        return;
      }
    }
    
    const dataToSave = {
      ...formData,
      status: saveStatus,
      temperatura: formData.temperatura === "" ? null : Number(formData.temperatura)
    };
    
    try {
      if (editingDiarioOriginal?.id) {
        const updateData = { ...dataToSave };
        if (editingDiarioOriginal.approved === false) {
          updateData.approved = null;
          updateData.rejection_reason = null;
          updateData.approved_by = null;
          updateData.approved_date = null;
        }
        await DiarioObraEntity.update(editingDiarioOriginal.id, updateData);
        alert(saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Diário finalizado com sucesso!");
      } else {
        await DiarioObraEntity.create({ ...dataToSave, created_by: user?.email, laboratorista_name: user?.laboratorista_name || user?.full_name });
        alert(saveStatus === 'rascunho' ? "Progresso salvo com sucesso!" : "Diário criado com sucesso!");
      }
      navigate(createPageUrl('MeusEnsaios'));
    } catch (error) {
      console.error("Erro ao salvar diário:", error);
      alert("Ocorreu um erro ao salvar o diário.");
    }
  };


  useEffect(() => {
    const loadData = async () => { // Renamed from loadInitialData
      setLoading(true);
      try {
        console.log("🚀 === DIÁRIO OBRA: INÍCIO DO CARREGAMENTO ===");
        const currentUser = await User.me();
        setUser(currentUser);

        console.log("📥 Carregando obras e regionais...");
        const [obrasData, regionaisData] = await Promise.all([
          Obra.list(),
          Regional.list()
        ]);
        console.log("✅ Obras carregadas:", obrasData.length, "Regionais carregadas:", regionaisData.length);
        setRegionais(regionaisData); // Set regionals once

        const currentUserAccessLevel = currentUser.access_level || (currentUser.role === 'admin' ? 'admin' : 'user');
        let availableObras = obrasData;
        
        if (currentUserAccessLevel === 'user') {
          console.log("🔍 Filtrando obras para laboratorista...");
          const regionalDoLaboratorista = regionaisData.find(regional => {
            const laboratoristas = regional.laboratoristas_responsaveis || [];
            return laboratoristas.some(email => email.toLowerCase() === currentUser.email.toLowerCase());
          });
          
          if (regionalDoLaboratorista) {
            console.log("✅ Regional encontrada:", regionalDoLaboratorista.nome);
            // Filtrar apenas obras em andamento
            availableObras = obrasData.filter(obra => 
              obra.regional_id === regionalDoLaboratorista.id &&
              obra.status === 'em_andamento'
            );
            console.log("✅ Obras em andamento da regional:", availableObras.length);
          } else {
            console.log("⚠️ Laboratorista não atribuído a nenhuma regional. Nenhuma obra disponível.");
            availableObras = [];
          }
        } else {
          console.log("✅ Usuário pode ver todas as obras");
        }
        setObras(availableObras); // Set filtered obras

        const params = new URLSearchParams(location.search);
        const editId = params.get('editId');
        
        if (editId) {
          const diarioToEdit = await DiarioObraEntity.get(editId);
          // Store original for permission checks and header display
          setEditingDiarioOriginal(diarioToEdit);

          // Check permissions to edit
          if (currentUser.role === 'admin' || (diarioToEdit.created_by === currentUser.email && diarioToEdit.approved !== true)) {
            setFormData({
              ...getInitialFormData(), // Start with default to ensure all fields are present
              ...diarioToEdit,
              data: diarioToEdit.data ? new Date(diarioToEdit.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              fotos: Array.isArray(diarioToEdit.fotos) ? diarioToEdit.fotos : [],
              temperatura: diarioToEdit.temperatura ?? "",
            });
            console.log("📝 Editando diário:", editId);
          } else {
            alert("Você não tem permissão para editar este registro.");
            navigate(createPageUrl('MeusEnsaios'));
            return; // Stop loading and redirect
          }
        } else {
          // Creating a new Diario: initialize formData, auto-select obra if available
          const initialNewFormData = getInitialFormData();
          if (availableObras.length > 0) {
            initialNewFormData.obra_id = availableObras[0].id;
          }
          setFormData(initialNewFormData);
          setEditingDiarioOriginal(null); // Ensure no original diario is set when creating new
          console.log("➕ Criando novo diário.");
        }
      } catch (error) {
        console.error("❌ DiarioObra - Erro ao carregar dados:", error);
        alert("Não foi possível carregar os dados. Verifique sua conexão e tente novamente.");
        navigate(createPageUrl('MeusEnsaios'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [location.search, navigate]); // Dependencies for useEffect

  // Permissions and status derived from formData and user
  const isApproved = formData.approved === true;
  // userCanEdit considers role or if user created it and it's not approved yet
  const userCanEdit = user?.role === 'admin' || (formData.created_by === user?.email && formData.approved !== true);
  // isEditable determines if fields should be active: if it's a new entry (no original ID) OR if user has specific permission to edit
  const isEditable = !editingDiarioOriginal?.id || userCanEdit;

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Determine if we are creating a new entry or editing an existing one
  const isCreatingNew = !editingDiarioOriginal?.id;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{editingDiarioOriginal?.id ? "Editar Diário de Obra" : "Novo Diário de Obra"}</CardTitle>
            <CardDescription>
              {editingDiarioOriginal?.id ? `Editando registro de ${new Date(editingDiarioOriginal.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : "Preencha as informações abaixo para criar um novo registro."}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <DiarioForm
              formData={formData}
              handleChange={handleChange}
              handleFileChange={handleFileChange}
              handleRemovePhoto={handleRemovePhoto}
              handleSubmit={handleSubmit}
              onCancel={() => navigate(createPageUrl('MeusEnsaios'))}
              obras={obras}
              regionais={regionais}
              user={user}
              loadingUpload={loadingUpload}
              selectedFileNames={selectedFileNames}
              uploadProgress={uploadProgress}
              isEditable={isEditable}
              isApproved={isApproved}
              rejectionReason={formData.rejection_reason}
              isCreatingNew={isCreatingNew}
              status={formData.status}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}