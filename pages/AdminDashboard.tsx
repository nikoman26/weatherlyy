import React from 'react';
import { useWeatherStore } from '../store/weatherStore.ts';
import { Shield, Users, Activity, Server, AlertTriangle, Trash2 } from 'lucide-react';
import ApiKeyManager from '../components/ApiKeyManager.tsx';

const AdminDashboard = () => {
  const { allUsers, user, updateUserRole, deleteUser } = useWeatherStore();

  // Protect against non-admin access rendering (Double check, though protected route handles redirection)
  if (user?.role !== 'admin') {
      return (
          <div className="flex items-center justify-center h-full text-red-500 gap-2">
              <AlertTriangle /> Access Denied: Insufficient Privileges.
          </div>
      );
  }

  // Mock Stats
  const stats = [
      { label: 'Total Users', value: allUsers.length, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10' },
      { label: 'Active Sessions', value: '12', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      { label: 'System Health', value: '99.9%', icon: Server, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
      { label: 'Pending Alerts', value: '3', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
           <Shield className="text-sky-500" /> Administrator Console
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage users, roles, and system status.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
                  <div>
                      <p className="text-slate-500 text-xs uppercase font-bold">{stat.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <stat.icon className={stat.color} size={24} />
                  </div>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Key Manager */}
        <ApiKeyManager />

        {/* User Management Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">User Management</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-semibold">User</th>
                            <th className="px-6 py-4 font-semibold">Role</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {allUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                          {u.username.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{u.username}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-300'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Role Toggle */}
                                        <select 
                                          value={u.role}
                                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>

                                        {/* Delete Action - Don't allow deleting self */}
                                        <button 
                                          onClick={() => deleteUser(u.id)}
                                          disabled={u.id === user?.id}
                                          className={`p-2 rounded hover:bg-slate-800 transition-colors ${u.id === user?.id ? 'text-slate-600 cursor-not-allowed' : 'text-red-400'}`}
                                          title="Delete User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
      
      {/* System Logs Placeholder */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Recent System Logs</h3>
          <div className="space-y-2 font-mono text-xs text-slate-400">
              <div className="flex gap-4"><span className="text-slate-500">2023-10-24 14:20:01</span> <span className="text-emerald-500">INFO</span> API Gateway health check passed.</div>
              <div className="flex gap-4"><span className="text-slate-500">2023-10-24 14:18:45</span> <span className="text-emerald-500">INFO</span> New user registration: pilot_mike.</div>
              <div className="flex gap-4"><span className="text-slate-500">2023-10-24 14:15:22</span> <span className="text-amber-500">WARN</span> High latency detected on AVWX integration (450ms).</div>
              <div className="flex gap-4"><span className="text-slate-500">2023-10-24 13:55:10</span> <span className="text-emerald-500">INFO</span> METAR cache updated for 2450 stations.</div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;