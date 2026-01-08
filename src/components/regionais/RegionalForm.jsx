import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const MultiSelect = ({ options, selected, onSelectedChange, placeholder }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (value) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        onSelectedChange(newSelected);
    };

    const selectedOptions = options.filter(option => selected.includes(option.value));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-[40px]">
                    <div className="flex flex-wrap gap-1">
                        {selectedOptions.length > 0 ? selectedOptions.map(option => (
                            <Badge key={option.value} variant="secondary" className="bg-black/10 text-[#00233B]">
                                {option.label}
                            </Badge>
                        )) : placeholder}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Pesquisar..." />
                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-auto">
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                onSelect={() => handleSelect(option.value)}
                            >
                                <Check className={`mr-2 h-4 w-4 ${selected.includes(option.value) ? "opacity-100" : "opacity-0"}`} />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default function RegionalForm({ regional, users, projects, onSave, onCancel, isAdmin }) {
    const [formData, setFormData] = useState({
        nome: regional?.nome || "",
        codigo: regional?.codigo || "",
        cliente: regional?.cliente || "",
        estado: regional?.estado || "",
        status: regional?.status || "ativa",
        project_ids: regional?.project_ids || [],
        laboratoristas_responsaveis: regional?.laboratoristas_responsaveis || [],
        gestor_contrato_responsavel: regional?.gestor_contrato_responsavel || "",
        salas_tecnicas_responsaveis: regional?.salas_tecnicas_responsaveis || [],
        clientes_responsaveis: regional?.clientes_responsaveis || [],
        descricao: regional?.descricao || "",
    });

    const userOptions = users.map(u => ({ value: u.email, label: u.laboratorista_name || u.email }));
    const projectOptions = projects.map(p => ({ value: p.id, label: p.name }));

    const handleMultiSelectChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="nome">Nome da Regional *</Label>
                    <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
                </div>
                <div>
                    <Label htmlFor="codigo">Código *</Label>
                    <Input id="codigo" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} required />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input id="cliente" value={formData.cliente} onChange={(e) => setFormData({ ...formData, cliente: e.target.value })} />
                </div>
                <div>
                    <Label htmlFor="estado">Estado (UF)</Label>
                    <Input id="estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} />
                </div>
            </div>

             <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
            </div>

             <div>
                <Label>Projetos Vinculados</Label>
                <MultiSelect
                    options={projectOptions}
                    selected={formData.project_ids}
                    onSelectedChange={(value) => handleMultiSelectChange('project_ids', value)}
                    placeholder="Selecione os projetos"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Laboratoristas Responsáveis</Label>
                     <MultiSelect
                        options={userOptions.filter(u => users.find(user => user.email === u.value && user.access_level === 'user'))}
                        selected={formData.laboratoristas_responsaveis}
                        onSelectedChange={(value) => handleMultiSelectChange('laboratoristas_responsaveis', value)}
                        placeholder="Selecione os laboratoristas"
                    />
                </div>
                 <div>
                    <Label>Gestor de Contrato</Label>
                    <Select value={formData.gestor_contrato_responsavel} onValueChange={(value) => setFormData({ ...formData, gestor_contrato_responsavel: value })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o gestor" /></SelectTrigger>
                        <SelectContent>
                            {userOptions.filter(u => users.find(user => user.email === u.value && user.access_level === 'gestor_contrato')).map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Salas Técnicas</Label>
                    <MultiSelect
                        options={userOptions.filter(u => users.find(user => user.email === u.value && user.access_level === 'sala_tecnica_afirmaevias'))}
                        selected={formData.salas_tecnicas_responsaveis}
                        onSelectedChange={(value) => handleMultiSelectChange('salas_tecnicas_responsaveis', value)}
                        placeholder="Selecione as salas técnicas"
                    />
                </div>
                <div>
                    <Label>Clientes Responsáveis</Label>
                     <MultiSelect
                        options={userOptions.filter(u => {
                            const user = users.find(user => user.email === u.value);
                            return user && user.access_level === 'cliente';
                        })}
                        selected={formData.clientes_responsaveis || []}
                        onSelectedChange={(value) => handleMultiSelectChange('clientes_responsaveis', value)}
                        placeholder="Selecione os clientes"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="inativa">Inativa</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="hover:bg-black/10 border-[#00233B]/20 text-[#00233B]">Cancelar</Button>
                <Button type="submit" className="bg-[#00233B] hover:bg-[#00233B]/90 text-[#F2F1EF]">
                    {regional ? "Atualizar Regional" : "Criar Regional"}
                </Button>
            </div>
        </form>
    );
}