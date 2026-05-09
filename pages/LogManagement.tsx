
import React, { useState, useEffect } from 'react';
import { SystemLog, LogType, OperationResult } from '../types';
import { logService } from '../src/services/supabaseService';

export const LogManagement: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState<LogType | 'ALL'>('ALL');

  useEffect(() => {
    let mounted = true;

    const fetchLogs = async () => {
      const logList = await logService.getLogs();
      const formattedLogs = logList.map(log => ({
        id: log.id,
        operator_id: log.operator_id,
        operator: log.operator || '系统/未登录用户',
        type: log.type,
        content: log.content,
        time: log.create_time ? new Date(log.create_time).toLocaleString() : '',
        create_time: log.create_time,
        ip: log.ip_address || 'browser',
        ip_address: log.ip_address,
        request_id: log.request_id,
        source: log.source,
        user_agent: log.user_agent,
        previous_hash: log.previous_hash,
        integrity_hash: log.integrity_hash,
        metadata: log.metadata,
        result: log.result
      }));
      if (!mounted) return;
      setLogs(formattedLogs);
    };

    void fetchLogs();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">日志管理</h2>
          <p className="text-slate-500">审计所有用户的系统操作行为，保障数据安全与合规。</p>
        </div>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
        >
          <option value="ALL">全部类型</option>
          {Object.values(LogType).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">操作时间</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">用户</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">操作内容</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">结果</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP 地址</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">来源</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">完整性</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map(log => (
              <tr key={log.id} className="text-sm">
                <td className="px-6 py-4 font-mono text-slate-400 text-xs">{log.time}</td>
                <td className="px-6 py-4 font-bold text-slate-700">{log.operator}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                    {log.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{log.content}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    log.result === OperationResult.SUCCESS ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {log.result}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs font-mono">{log.ip}</td>
                <td className="px-6 py-4 text-slate-400 text-xs">{log.source || 'browser-fallback'}</td>
                <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                  {log.integrity_hash ? `${log.integrity_hash.slice(0, 12)}...` : '未加固'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
