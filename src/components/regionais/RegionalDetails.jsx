import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

const DetailItem = ({ label, value }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-sm font-medium text-[#00233B]/80">{label}</p>
            <p className="text-sm text-[#00233B]">{value}</p>
        </div>
    );
};

const DetailList = ({ label, items, allItems, displayKey, valueKey }) => {
    const resolvedItems = useMemo(() => {
        if (!items) return [];
        return items.map(itemId => {
            const found = allItems.find(item => item[valueKey] === itemId);
            return found ? found[displayKey] : itemId;
        }).filter(Boolean)
    }, [items, allItems, displayKey, valueKey]);

    if (resolvedItems.length === 0) return null;

    return (
        <div>
            <p className="text-sm font-medium text-[#00233B]/80 mb-2">{label}</p>
            <div className="flex flex-wrap gap-2">
                {resolvedItems.map((item, index) => (
                    <Badge key={index} variant="secondary" className="bg-black/5 text-[#00233B]">{item}</Badge>
                ))}
            </div>
        </div>
    );
};

export default function RegionalDetails({ regional, users, projects }) {
    // Buscar projetos vinculados de duas formas:
    // 1. Projetos listados em project_ids (forma antiga)
    // 2. Projetos com regional_id = regional.id (forma nova)
    const projetosVinculados = useMemo(() => {
        if (!regional || !projects) return [];
        
        const projectIdsSet = new Set(regional.project_ids || []);
        
        // Buscar projetos das duas formas
        const projetosEncontrados = projects.filter(project => {
            // Verifica se está no array project_ids OU se tem regional_id igual
            return projectIdsSet.has(project.id) || project.regional_id === regional.id;
        });
        
        // Remover duplicatas por ID
        const uniqueProjects = Array.from(
            new Map(projetosEncontrados.map(p => [p.id, p])).values()
        );
        
        return uniqueProjects;
    }, [projects, regional]);

    const gestor = useMemo(() => {
        if (!regional || !users) return null;
        return users.find(u => u.email === regional.gestor_contrato_responsavel);
    }, [users, regional]);

    // Verificação DEPOIS dos hooks
    if (!regional) return null;

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-2xl font-bold text-[#00233B]">{regional.nome}</h3>
                <p className="text-[#00233B]/80">{regional.codigo}</p>
            </div>

            <Separator className="bg-white/20" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem label="Cliente" value={regional.cliente} />
                <DetailItem label="Estado (UF)" value={regional.estado} />
                <DetailItem label="Descrição" value={regional.descricao} />
                <DetailItem label="Status" value={regional.status === 'ativa' ? 'Ativa' : 'Inativa'} />
                {regional.jornada?.horario_inicio && regional.jornada?.horario_fim && (
                    <DetailItem 
                        label="Jornada de Trabalho" 
                        value={`${regional.jornada.horario_inicio} - ${regional.jornada.horario_fim}`} 
                    />
                )}
            </div>

            <Separator className="bg-white/20" />
            
            <div className="space-y-4">
                <DetailItem label="Gestor de Contrato" value={gestor?.laboratorista_name || regional.gestor_contrato_responsavel} />

                {projetosVinculados.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-[#00233B]/80">Projetos Vinculados ({projetosVinculados.length})</p>
                        
                        {/* Projetos CAUQ */}
                        {projetosVinculados.filter(p => p.tipo_projeto === 'CAUQ').length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <p className="text-sm font-medium text-blue-800">Projetos CAUQ</p>
                                </div>
                                <div className="flex flex-wrap gap-2 ml-6">
                                    {projetosVinculados.filter(p => p.tipo_projeto === 'CAUQ').map((projeto) => (
                                        <Badge key={projeto.id} variant="secondary" className="bg-blue-100 text-blue-800">
                                            {projeto.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projetos MRAF */}
                        {projetosVinculados.filter(p => p.tipo_projeto === 'MRAF').length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                    <p className="text-sm font-medium text-purple-800">Projetos MRAF</p>
                                </div>
                                <div className="flex flex-wrap gap-2 ml-6">
                                    {projetosVinculados.filter(p => p.tipo_projeto === 'MRAF').map((projeto) => (
                                        <Badge key={projeto.id} variant="secondary" className="bg-purple-100 text-purple-800">
                                            {projeto.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projetos BGS */}
                        {projetosVinculados.filter(p => p.tipo_projeto === 'BGS').length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-amber-600" />
                                    <p className="text-sm font-medium text-amber-800">Projetos BGS</p>
                                </div>
                                <div className="flex flex-wrap gap-2 ml-6">
                                    {projetosVinculados.filter(p => p.tipo_projeto === 'BGS').map((projeto) => (
                                        <Badge key={projeto.id} variant="secondary" className="bg-amber-100 text-amber-800">
                                            {projeto.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Carta Traço de Concreto */}
                        {projetosVinculados.filter(p => p.tipo_projeto === 'CARTA_TRACO_CONCRETO').length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-green-600" />
                                    <p className="text-sm font-medium text-green-800">Cartas Traço de Concreto</p>
                                </div>
                                <div className="flex flex-wrap gap-2 ml-6">
                                    {projetosVinculados.filter(p => p.tipo_projeto === 'CARTA_TRACO_CONCRETO').map((projeto) => (
                                        <Badge key={projeto.id} variant="secondary" className="bg-green-100 text-green-800">
                                            {projeto.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <DetailList 
                    label="Laboratoristas Responsáveis"
                    items={regional.laboratoristas_responsaveis}
                    allItems={users}
                    displayKey="laboratorista_name"
                    valueKey="email"
                />

                <DetailList 
                    label="Salas Técnicas"
                    items={regional.salas_tecnicas_responsaveis}
                    allItems={users}
                    displayKey="laboratorista_name"
                    valueKey="email"
                />

                <DetailList 
                    label="Clientes Responsáveis"
                    items={regional.clientes_responsaveis}
                    allItems={users}
                    displayKey="laboratorista_name"
                    valueKey="email"
                />
            </div>
        </div>
    );
}