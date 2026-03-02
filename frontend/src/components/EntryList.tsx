import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Flame, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetAllEntries, useDeleteEntry, useCalculateMonthlyConsumption } from '../hooks/useQueries';
import type { Entry } from '../backend';

const MONTH_NAMES = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

interface EntryListProps {
  onEdit: (entry: Entry) => void;
}

// Row component so we can call hooks per entry
function EntryRow({
  entry,
  onEdit,
  onDelete,
  isDeleting,
}: {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
  isDeleting: boolean;
}) {
  const { data: consumption } = useCalculateMonthlyConsumption(entry.year, entry.month);

  const totalElec = consumption
    ? consumption.electricityNormal + consumption.electricityHigh
    : null;

  return (
    <TableRow className="border-border hover:bg-muted/30 transition-colors">
      <TableCell className="font-medium text-sm pl-4">
        {MONTH_NAMES[entry.month - 1]} {entry.year}
      </TableCell>
      <TableCell className="text-sm">
        <div className="space-y-0.5">
          <div className="font-mono text-xs text-muted-foreground">
            {entry.meterReadings.gas.toFixed(3)} m³
          </div>
          {consumption !== undefined && consumption !== null ? (
            <div className="font-mono text-xs text-gas font-semibold">
              ▲ {consumption.gas.toFixed(1)} m³
            </div>
          ) : (
            <div className="font-mono text-xs text-muted-foreground/40">▲ —</div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm">
        <div className="space-y-0.5">
          <div className="font-mono text-xs text-muted-foreground">
            N: {entry.meterReadings.electricityNormal.toFixed(3)} / H: {entry.meterReadings.electricityHigh.toFixed(3)}
          </div>
          {totalElec !== null ? (
            <div className="font-mono text-xs text-elec font-semibold">
              ▲ {totalElec.toFixed(1)} kWh
            </div>
          ) : (
            <div className="font-mono text-xs text-muted-foreground/40">▲ —</div>
          )}
        </div>
      </TableCell>
      <TableCell className={`font-mono text-sm ${entry.otherCosts > 0 ? 'text-destructive' : entry.otherCosts < 0 ? 'text-elec' : 'text-muted-foreground'}`}>
        {entry.otherCosts !== 0
          ? `${entry.otherCosts > 0 ? '+' : ''}${entry.otherCosts.toFixed(2)}`
          : '—'}
      </TableCell>
      <TableCell className="text-right pr-4">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-muted hover:text-primary"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(entry)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function EntryList({ onEdit }: EntryListProps) {
  const { data: entries, isLoading } = useGetAllEntries();
  const deleteEntry = useDeleteEntry();
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const sortedEntries = entries
    ? [...entries].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
    : [];

  const handleDelete = async (entry: Entry) => {
    const key = `${entry.year}-${entry.month}`;
    setDeletingKey(key);
    try {
      await deleteEntry.mutateAsync({ month: entry.month, year: entry.year });
      toast.success(`Invoer voor ${MONTH_NAMES[entry.month - 1]} ${entry.year} verwijderd`);
    } catch {
      toast.error('Verwijderen mislukt');
    } finally {
      setDeletingKey(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border shadow-card">
        <CardContent className="p-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg bg-muted" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!sortedEntries.length) {
    return (
      <Card className="bg-card border-border shadow-card">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center gap-3 mb-3 opacity-40">
            <Flame className="w-8 h-8 text-gas" />
            <Zap className="w-8 h-8 text-elec" />
          </div>
          <p className="text-muted-foreground text-sm">Nog geen invoer. Voeg je eerste maandelijkse meting toe!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-card">
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[480px]">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider pl-4">Periode</TableHead>
                <TableHead className="text-gas text-xs uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" />Gas</span>
                </TableHead>
                <TableHead className="text-elec text-xs uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" />Elektriciteit</span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Overige (€)</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground pr-4">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry) => {
                const key = `${entry.year}-${entry.month}`;
                return (
                  <EntryRow
                    key={key}
                    entry={entry}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                    isDeleting={deletingKey === key}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
