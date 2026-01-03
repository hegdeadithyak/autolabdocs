
'use client';

import React, { useState } from 'react';
import { BugStatus } from '@prisma/client';
import { updateBugReportAction } from '../lib/actions';
import { CheckCircle, XCircle, MessageSquare, Coins, ChevronDown, ChevronUp, AlertCircle, Clock, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BugReportWithUser {
  id: string;
  description: string;
  status: BugStatus;
  adminReply: string | null;
  createdAt: Date;
  updatedAt: Date;
  screenshot: string | null;
  userId: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface AdminBugListProps {
  initialReports: BugReportWithUser[];
}

export const AdminBugList: React.FC<AdminBugListProps> = ({ initialReports }) => {
  const [reports, setReports] = useState(initialReports);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState<BugStatus>('OPEN');
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleExpand = (report: BugReportWithUser) => {
    if (expandedId === report.id) {
      setExpandedId(null);
    } else {
      setExpandedId(report.id);
      setReplyText(report.adminReply || '');
      setStatus(report.status);
      setCoins(0);
    }
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    try {
      await updateBugReportAction(id, status, replyText, coins);
      // Refresh local state optimistically or re-fetch
      setReports(reports.map(r => r.id === id ? { ...r, status, adminReply: replyText } : r));
      setExpandedId(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to update bug report", error);
      alert("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (s: BugStatus) => {
    switch (s) {
      case 'OPEN': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'RESOLVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'CLOSED': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="bg-[#1c1c1e] border border-white/10 rounded-xl overflow-hidden transition-all">
          <div 
            onClick={() => toggleExpand(report)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(report.status)}`}>
                {report.status}
              </div>
              <div>
                <h3 className="text-sm font-medium text-white truncate max-w-md">{report.description}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Reported by <span className="text-zinc-300">{report.user.name || report.user.email}</span> • {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-zinc-500">
              {expandedId === report.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>

          {expandedId === report.id && (
            <div className="p-4 pt-0 border-t border-white/10 bg-black/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Description</label>
                    <p className="mt-2 text-zinc-300 text-sm whitespace-pre-wrap bg-black/20 p-3 rounded-lg border border-white/5">
                        {report.description}
                    </p>
                  </div>
                  
                  {report.screenshot && (
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Screenshot</label>
                        <a href={report.screenshot} target="_blank" rel="noreferrer" className="block mt-2">
                            <img src={report.screenshot} alt="Bug screenshot" className="max-w-full rounded-lg border border-white/10 hover:opacity-90 transition-opacity" />
                        </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5 h-fit">
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <MessageSquare size={16} className="text-blue-400" />
                        Admin Response
                    </h4>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value as BugStatus)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                        >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Reply Message</label>
                        <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply to the user..."
                            className="w-full h-32 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                        />
                    </div>

                    <div>
                         <label className="block text-xs font-medium text-zinc-400 mb-1">Award Coins</label>
                         <div className="relative">
                             <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" size={16} />
                             <input 
                                type="number" 
                                min="0"
                                value={coins}
                                onChange={(e) => setCoins(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:ring-2 focus:ring-yellow-500/50 outline-none"
                             />
                         </div>
                         <p className="text-[10px] text-zinc-500 mt-1">Optional: Reward the user for this bug report.</p>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button 
                            onClick={() => toggleExpand(report)}
                            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => handleUpdate(report.id)}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Update & Reply'}
                        </button>
                    </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {reports.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>No bug reports found.</p>
          </div>
      )}
    </div>
  );
};
