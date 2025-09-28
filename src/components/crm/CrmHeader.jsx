import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Goal, Percent, Search } from 'lucide-react';
import { subDays } from 'date-fns';

export default function CrmHeader({ contacts = [], onSearchChange, onFilterChange, filters = {} }) {
  const kpis = React.useMemo(() => {
    const total = contacts?.length || 0;
    if (total === 0) {
      return { total: 0, newLast7Days: 0, conversionRate: 0, needsAttention: 0 };
    }
    const sevenDaysAgo = subDays(new Date(), 7);
    const newLast7Days = contacts.filter(c => new Date(c.created_date) > sevenDaysAgo).length;
    const finalized = contacts.filter(c => c.status === 'finalizado').length;
    const conversionRate = total > 0 ? Math.round((finalized / total) * 100) : 0;
    const needsAttention = contacts.filter(c => c.status === 'novo').length;
    return { total, newLast7Days, conversionRate, needsAttention };
  }, [contacts]);

  const estados = [...new Set((contacts || []).map(c => c.estado).filter(Boolean))].sort();
  const fontes = [...new Set((contacts || []).map(c => c.fonte_lead).filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos (Últimos 7d)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.newLast7Days}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.conversionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads em 'Novo'</CardTitle>
            <Goal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.needsAttention}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, empresa..."
              className="pl-10 h-10"
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Select value={filters.fonte_lead || 'all'} onValueChange={(value) => onFilterChange?.('fonte_lead', value)}>
              <SelectTrigger className="w-full md:w-[180px] h-10">
                <SelectValue placeholder="Filtrar por Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Fontes</SelectItem>
                {fontes.map(fonte => <SelectItem key={fonte} value={fonte}>{fonte}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.estado || 'all'} onValueChange={(value) => onFilterChange?.('estado', value)}>
              <SelectTrigger className="w-full md:w-[180px] h-10">
                <SelectValue placeholder="Filtrar por Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estados</SelectItem>
                {estados.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}