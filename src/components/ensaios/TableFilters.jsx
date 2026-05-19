// Componentes de filtro reutilizáveis para tabelas de ensaios
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter } from "lucide-react";

export const CopyIdButton = React.memo(({ id }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  // Import icons inline to avoid circular deps
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copiar ID: ${id}`}
      className="inline-flex items-center gap-1 text-[9px] font-mono bg-black/10 hover:bg-[#BFCF99]/40 px-1.5 py-0.5 rounded transition-colors text-[#00233B]/70 hover:text-[#00233B]">
      <span className="truncate max-w-[60px]">{copied ? '✓' : id.slice(0, 8) + '…'}</span>
    </button>
  );
});
CopyIdButton.displayName = 'CopyIdButton';

export const DateRangePicker = React.memo(({ startDate, endDate, onStartChange, onEndChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDateRange = () => {
    if (!startDate && !endDate) return "Filtrar período";
    if (startDate && !endDate) return `≥ ${new Date(startDate).toLocaleDateString('pt-BR')}`;
    if (!startDate && endDate) return `≤ ${new Date(endDate).toLocaleDateString('pt-BR')}`;
    return `${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-normal hover:bg-black/10">
          <Filter className={`w-3 h-3 mr-1 ${startDate || endDate ? 'text-[#BFCF99]' : ''}`} />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20" align="start">
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-[#00233B]/80">Data Início</Label>
            <Input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)}
              className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
          </div>
          <div>
            <Label className="text-xs text-[#00233B]/80">Data Fim</Label>
            <Input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)}
              className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
          </div>
          <Button size="sm" variant="outline" className="w-full h-7 text-xs"
            onClick={() => { onStartChange(''); onEndChange(''); setIsOpen(false); }}>
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});
DateRangePicker.displayName = 'DateRangePicker';

export const TextColumnFilter = React.memo(({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-normal hover:bg-black/10">
          <Filter className={`w-3 h-3 ${value ? 'text-[#BFCF99]' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20" align="start">
        <div className="space-y-2">
          <Label className="text-xs text-[#00233B]/80">{placeholder}</Label>
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
          <Button size="sm" variant="outline" className="w-full h-7 text-xs"
            onClick={() => { onChange(''); setIsOpen(false); }}>
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});
TextColumnFilter.displayName = 'TextColumnFilter';

export const SelectColumnFilter = React.memo(({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs font-normal hover:bg-black/10">
          <Filter className={`w-3 h-3 ${value !== 'all' ? 'text-[#BFCF99]' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-[#F2F1EF]/95 backdrop-blur-lg border-white/20" align="start">
        <div className="space-y-2">
          <Label className="text-xs text-[#00233B]/80 px-2">{placeholder}</Label>
          <Input type="text" placeholder="Pesquisar..." value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-white/50 border-white/20 text-[#00233B] text-xs h-8" />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredOptions.map((option) => (
              <Button key={option.value} variant="ghost" size="sm"
                className={`w-full justify-start text-xs h-8 ${value === option.value ? 'bg-black/10' : ''}`}
                onClick={() => { onChange(option.value); setIsOpen(false); setSearchText(''); }}>
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
SelectColumnFilter.displayName = 'SelectColumnFilter';