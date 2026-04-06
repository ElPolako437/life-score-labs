import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin as checkIsAdmin } from '@/lib/access';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, ArrowLeft, Crown, Shield, Users, X, Loader2, RefreshCw } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  name: string;
  is_premium: boolean;
  premium_source: string;
  premium_until: string | null;
  role: string;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  none: 'Keine',
  stripe: 'Stripe-Abo',
  manual: 'Manuell',
  beta: 'Beta',
  founder: 'Founder',
  developer: 'Entwickler',
};

const ROLE_LABELS: Record<string, string> = {
  user: 'User',
  admin: 'Admin',
  tester: 'Tester',
  founding_member: 'Founding Member',
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useApp();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'name' | 'email'>('name');
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdminUser = userRole === 'admin';

  useEffect(() => {
    if (!isAdminUser) {
      toast({ title: 'Kein Zugriff', description: 'Du benötigst Admin-Rechte.', variant: 'destructive' });
      navigate('/app/profile');
      return;
    }
    fetchUsers();
  }, [isAdminUser]);

  const fetchUsers = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    try {
      let action = 'list';
      if (searchTerm) {
        action = searchMode === 'email' ? 'search_by_email' : 'search_by_name';
      }

      // Use Supabase JWT auth — edge function reads Authorization header
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action, search: searchTerm || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers(data?.users || []);
    } catch (e: any) {
      toast({ title: 'Fehler beim Laden', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [searchMode]);

  const handleSearch = () => fetchUsers(search || undefined);

  const handleUpdate = async (updates: Partial<UserRow>) => {
    if (!editUser) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update', userId: editUser.id, updates },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Gespeichert', description: 'Änderungen wurden übernommen.' });
      setEditUser(prev => prev ? { ...prev, ...updates } as UserRow : null);
      fetchUsers(search || undefined);
    } catch (e: any) {
      toast({ title: 'Fehler beim Speichern', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      stripe: 'bg-primary/20 text-primary',
      manual: 'bg-emerald-500/20 text-emerald-400',
      beta: 'bg-amber-500/20 text-amber-400',
      founder: 'bg-purple-500/20 text-purple-400',
      developer: 'bg-blue-500/20 text-blue-400',
      none: 'bg-muted text-muted-foreground',
    };
    return <Badge className={`${colors[source] || colors.none} border-0 text-[10px]`}>{SOURCE_LABELS[source] || source}</Badge>;
  };

  if (!isAdminUser) return null;

  return (
    <div className="px-5 pt-8 pb-4 space-y-4 animate-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/profile')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Users className="w-5 h-5 text-primary" />
        <h1 className="font-outfit font-bold text-xl text-foreground">Benutzerverwaltung</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{users.length} User</span>
          <Button variant="ghost" size="icon" onClick={() => fetchUsers(search || undefined)} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchMode === 'email' ? 'E-Mail suchen…' : 'Name suchen…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Select value={searchMode} onValueChange={(v: 'name' | 'email') => setSearchMode(v)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">E-Mail</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} size="sm">Suchen</Button>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-2 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Keine Benutzer gefunden</p>
        ) : (
          users.map(u => (
            <button
              key={u.id}
              onClick={() => setEditUser(u)}
              className="w-full text-left card-elegant rounded-xl p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{u.name || '—'}</span>
                    {u.is_premium && <Crown className="w-3.5 h-3.5 text-primary shrink-0" />}
                    {u.role === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {getSourceBadge(u.premium_source)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              Benutzer bearbeiten
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-sm font-medium">{editUser.name || '—'}</p>
                <p className="text-xs text-muted-foreground">{editUser.email}</p>
                <p className="text-[10px] text-muted-foreground/60 font-mono">{editUser.id}</p>
              </div>

              {/* Premium toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Premium aktiv</span>
                <Switch
                  checked={editUser.is_premium}
                  disabled={saving}
                  onCheckedChange={checked => {
                    const newSource = checked ? (editUser.premium_source === 'none' ? 'manual' : editUser.premium_source) : 'none';
                    handleUpdate({ is_premium: checked, premium_source: newSource } as any);
                  }}
                />
              </div>

              {/* Source */}
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Premium-Quelle</label>
                <Select
                  value={editUser.premium_source}
                  onValueChange={v => handleUpdate({ premium_source: v } as any)}
                  disabled={saving}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Rolle</label>
                <Select
                  value={editUser.role}
                  onValueChange={v => handleUpdate({ role: v } as any)}
                  disabled={saving}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Premium until */}
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Premium bis (optional)</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={editUser.premium_until ? editUser.premium_until.split('T')[0] : ''}
                    onChange={e => {
                      const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                      handleUpdate({ premium_until: val } as any);
                    }}
                    className="flex-1"
                    disabled={saving}
                  />
                  {editUser.premium_until && (
                    <Button variant="ghost" size="icon" onClick={() => handleUpdate({ premium_until: null } as any)} disabled={saving}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {saving && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Wird gespeichert…
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
