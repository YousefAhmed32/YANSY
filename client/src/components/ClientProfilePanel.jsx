import { useEffect, useState } from 'react';
import { X, User, Mail, Phone, Building, Users, FolderKanban, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { gsap } from 'gsap';

const ClientProfilePanel = ({ clientId, onClose }) => {
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  useEffect(() => {
    if (client) {
      gsap.fromTo('.client-panel', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [client]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${clientId}/client-details`);
      setClient(response.data.client);
      setProjects(response.data.projects || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-[#d4af37]" />;
      case 'in-progress':
      case 'near-completion':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-white/60" />;
    }
  };

  const getStatusText = (progress, status) => {
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'delivered' || progress === 100) return 'Delivered';
    if (progress >= 80) return 'Near Completion';
    if (progress > 0) return 'In Progress';
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white/10 border border-white/20 p-8 max-w-md">
          <p className="text-white/70 mb-4">{error || 'Client not found'}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300 text-sm font-light tracking-wide uppercase"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto client-panel">
          {/* Header */}
          <div className="bg-white/5 border border-white/10 p-6 md:p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-2 text-white/90">
                  Client Profile
                </h2>
                <p className="text-white/50 font-light">Complete client information and project history</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-[#d4af37] transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 border border-white/10">
                  <User className="h-6 w-6 text-[#d4af37]" />
                </div>
                <div>
                  <p className="text-xs font-light text-white/50 mb-1 uppercase tracking-wide">Full Name</p>
                  <p className="text-lg font-light text-white/90">{client.fullName}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 border border-white/10">
                  <Mail className="h-6 w-6 text-[#d4af37]" />
                </div>
                <div>
                  <p className="text-xs font-light text-white/50 mb-1 uppercase tracking-wide">Email</p>
                  <p className="text-lg font-light text-white/90">{client.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 border border-white/10">
                  <Phone className="h-6 w-6 text-[#d4af37]" />
                </div>
                <div>
                  <p className="text-xs font-light text-white/50 mb-1 uppercase tracking-wide">Phone Number</p>
                  <p className="text-lg font-light text-white/90">{client.phoneNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 border border-white/10">
                  <Building className="h-6 w-6 text-[#d4af37]" />
                </div>
                <div>
                  <p className="text-xs font-light text-white/50 mb-1 uppercase tracking-wide">Client Type</p>
                  <p className="text-lg font-light text-white/90 capitalize">{client.clientType || 'Individual'}</p>
                </div>
              </div>

              {client.companyName && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 border border-white/10">
                    <Building className="h-6 w-6 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-xs font-light text-white/50 mb-1 uppercase tracking-wide">Company Name</p>
                    <p className="text-lg font-light text-white/90">{client.companyName}</p>
                  </div>
                </div>
              )}

              {client.companySize && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 border border-white/10">
                    <Users className="h-6 w-6 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-xs font-light text-white/50 mb-1 uppercase tracking-wide">Company Size</p>
                    <p className="text-lg font-light text-white/90 capitalize">
                      {client.companySize.replace('-', ' - ')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-light text-[#d4af37] mb-1">{client.totalProjects || 0}</p>
                <p className="text-xs font-light text-white/50 uppercase tracking-wide">Total Projects</p>
              </div>
              <div>
                <p className="text-3xl font-light text-blue-400 mb-1">{client.projectsByStatus?.['in-progress'] || 0}</p>
                <p className="text-xs font-light text-white/50 uppercase tracking-wide">In Progress</p>
              </div>
              <div>
                <p className="text-3xl font-light text-yellow-400 mb-1">{client.projectsByStatus?.['near-completion'] || 0}</p>
                <p className="text-xs font-light text-white/50 uppercase tracking-wide">Near Completion</p>
              </div>
              <div>
                <p className="text-3xl font-light text-[#d4af37] mb-1">{client.projectsByStatus?.delivered || 0}</p>
                <p className="text-xs font-light text-white/50 uppercase tracking-wide">Delivered</p>
              </div>
            </div>

            {client.lastActivity && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/50">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-light">
                    Last Activity: {new Date(client.lastActivity).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Projects List */}
          <div className="bg-white/5 border border-white/10 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-white/90">All Projects</h3>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-white/60" />
                <span className="text-sm font-light text-white/50">{projects.length} projects</span>
              </div>
            </div>

            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="p-6 bg-white/5 border border-white/10 hover:border-[#d4af37]/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-light text-white/90 mb-2">{project.title}</h4>
                        <p className="text-sm font-light text-white/50 line-clamp-2">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusIcon(project.status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <span className={`px-3 py-1 text-xs font-light tracking-wide uppercase border rounded ${
                        project.status === 'cancelled'
                          ? 'text-red-400 bg-red-500/20 border-red-500/30'
                          : project.progress === 100
                          ? 'text-[#d4af37] bg-[#d4af37]/20 border-[#d4af37]/30'
                          : project.progress >= 80
                          ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
                          : project.progress > 0
                          ? 'text-blue-400 bg-blue-500/20 border-blue-500/30'
                          : 'text-white/60 bg-white/10 border-white/20'
                      }`}>
                        {getStatusText(project.progress || 0, project.status)}
                      </span>
                      <span className="text-xs font-light text-white/50">
                        {project.progress || 0}% Complete
                      </span>
                    </div>

                    {project.progress > 0 && (
                      <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            project.progress === 100
                              ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d03f]'
                              : project.progress >= 80
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                              : 'bg-gradient-to-r from-blue-500 to-blue-400'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span className="font-light">Phase: {project.phase}</span>
                      {project.updatedAt && (
                        <span className="font-light">
                          Updated: {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 font-light">No projects found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePanel;

