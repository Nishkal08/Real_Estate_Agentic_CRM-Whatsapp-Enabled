import { useState, useEffect } from 'react';
import { Terminal, Users, Megaphone, MessageSquare, Trash2, Building, BarChart3, AlertCircle } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { toast } from '@/stores/uiStore';
import api from '@/services/api';

export default function AdminPortal() {
  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, bizRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/businesses')
      ]);
      setStats(statsRes.data.data);
      setBusinesses(bizRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to retrieve admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteBusiness = async (biz) => {
    const confirmText = `⚠️ WARNING: This will permanently delete the tenant "${biz.name}" (${biz.email}) along with all campaigns, knowledge bases, leads, appointments, and conversation logs. \n\nType the business name "${biz.name}" below to confirm deletion:`;
    const userInput = window.prompt(confirmText);
    
    if (userInput !== biz.name) {
      if (userInput !== null) {
        toast.error("Business name did not match. Deletion aborted.");
      }
      return;
    }

    setDeletingId(biz.id);
    try {
      await api.delete(`/admin/businesses/${biz.id}`);
      toast.success(`Successfully deleted business "${biz.name}"`);
      fetchData(); // Reload list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete business');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading admin workspace...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Registered Businesses</p>
            <h3 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats?.businesses || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(196,101,74,0.1)] text-[var(--accent)]">
            <Building size={20} />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Platform Leads</p>
            <h3 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats?.leads || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(16,185,129,0.1)] text-[var(--success)]">
            <Users size={20} />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Active Campaigns</p>
            <h3 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats?.campaigns || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(59,130,246,0.1)] text-[var(--primary)]">
            <Megaphone size={20} />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total WhatsApp Messages</p>
            <h3 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats?.messages || 0}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(245,158,11,0.1)] text-[var(--warning)]">
            <MessageSquare size={20} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="card-no-hover p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Manage Tenants</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>View and monitor registered business accounts on Aurion CRM.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} icon={<BarChart3 size={13} />}>
            Refresh List
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border-subtle)' }}>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Business Info</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Plan / Number</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Leads</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Campaigns</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Created</th>
                <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((biz) => {
                const isSelf = biz.email === 'nishkal2005@gmail.com';
                return (
                  <tr key={biz.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="py-4">
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {biz.name}
                        {isSelf && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-[rgba(59,130,246,0.15)] text-[var(--primary)]">
                            Self
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{biz.email}</div>
                    </td>
                    <td className="py-4">
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded" style={{
                        background: biz.plan === 'enterprise' ? 'rgba(245,158,11,0.1)' : 'var(--border-subtle)',
                        color: biz.plan === 'enterprise' ? 'var(--warning)' : 'var(--text-primary)'
                      }}>
                        {biz.plan}
                      </span>
                      <div className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{biz.waNumber || 'Not Linked'}</div>
                    </td>
                    <td className="py-4 text-sm" style={{ color: 'var(--text-primary)' }}>{biz.stats.leads}</td>
                    <td className="py-4 text-sm" style={{ color: 'var(--text-primary)' }}>{biz.stats.campaigns}</td>
                    <td className="py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(biz.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 text-right">
                      {!isSelf && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 size={13} />}
                          loading={deletingId === biz.id}
                          onClick={() => handleDeleteBusiness(biz)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
