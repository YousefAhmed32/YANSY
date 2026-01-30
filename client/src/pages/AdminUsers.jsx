import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus, Edit, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { gsap } from 'gsap';
import ClientProfilePanel from '../components/ClientProfilePanel';

const AdminUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState(null);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  // GSAP entrance animations
  useEffect(() => {
    if (containerRef.current && titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
      );
      if (tableRef.current) {
        gsap.fromTo(
          tableRef.current.querySelectorAll('tr'),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.05, delay: 0.3 }
        );
      }
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: { page, limit: 20, search: searchTerm || undefined },
      });
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    return role === 'ADMIN' ? (
      <span className="px-3 py-1 text-xs font-light tracking-wide uppercase bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
        Admin
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-light tracking-wide uppercase bg-white/10 text-white/70 border border-white/20">
        User
      </span>
    );
  };

  const getUserInitial = (user) => {
    if (user.fullName) {
      return user.fullName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = (user) => {
    return user.fullName || user.email || 'Unknown';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 
            ref={titleRef}
            className="text-5xl md:text-6xl font-light tracking-tight mb-4 text-white/90"
          >
            {t('users.title')}
          </h1>
          <p className="text-lg font-light text-white/50">
            {t('users.allUsers')}
          </p>
        </div>
        <button className="px-6 py-3 border border-[#d4af37] text-[#d4af37] text-sm font-light tracking-widest uppercase hover:bg-[#d4af37] hover:text-black transition-all duration-500">
          <UserPlus className="h-5 w-5 inline-block mr-2" />
          {t('users.createUser')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder={t('common.search')}
          className="w-full pl-12 pr-4 py-4 bg-white/5 border-b border-white/20 text-white placeholder-white/30 font-light text-lg focus:outline-none focus:border-[#d4af37] transition-colors duration-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white/5 border border-white/10 overflow-hidden">
        <table ref={tableRef} className="min-w-full divide-y divide-white/10">
          <thead>
            <tr>
              <th className="px-8 py-6 text-left text-xs font-light text-white/60 tracking-widest uppercase">
                {t('common.name')}
              </th>
              <th className="px-8 py-6 text-left text-xs font-light text-white/60 tracking-widest uppercase">
                {t('common.email')}
              </th>
              <th className="px-8 py-6 text-left text-xs font-light text-white/60 tracking-widest uppercase">
                {t('users.role')}
              </th>
              <th className="px-8 py-6 text-left text-xs font-light text-white/60 tracking-widest uppercase">
                {t('users.lastLogin')}
              </th>
              <th className="px-8 py-6 text-right text-xs font-light text-white/60 tracking-widest uppercase">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((user) => (
              <tr 
                key={user._id} 
                className="hover:bg-white/5 transition-colors duration-300"
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget, { x: 4, duration: 0.2, ease: 'power2.out' });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { x: 0, duration: 0.2, ease: 'power2.out' });
                }}
              >
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                        <span className="text-white/90 font-light text-lg">
                          {getUserInitial(user)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => setSelectedClientId(user._id)}
                        className="text-base font-light text-white/90 hover:text-[#d4af37] transition-colors text-left"
                      >
                        {getUserDisplayName(user)}
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-sm font-light text-white/70">{user.email}</div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm font-light text-white/50">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      className="p-2 text-white/60 hover:text-[#d4af37] transition-colors duration-300"
                      onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });
                      }}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="p-2 text-white/60 hover:text-red-400 transition-colors duration-300"
                      onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: 'power2.out' });
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-6 py-3 border border-white/20 text-white/60 hover:text-[#d4af37] hover:border-[#d4af37] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-light tracking-wide uppercase"
          >
            {t('common.previous')}
          </button>
          <span className="text-sm font-light text-white/50">
            {t('common.page')} {page} {t('common.of')} {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-6 py-3 border border-white/20 text-white/60 hover:text-[#d4af37] hover:border-[#d4af37] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-light tracking-wide uppercase"
          >
            {t('common.next')}
          </button>
        </div>
      )}

      {/* Client Profile Panel */}
      {selectedClientId && (
        <ClientProfilePanel
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
