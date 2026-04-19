import { Clock, User, ShieldCheck } from 'lucide-react';

export function LogsTable({ logs, prefixCls = 'rc-table' }: { logs: any[]; prefixCls?: string }) {
  return (
    <div className={`${prefixCls}-container bg-[#0a192f]/40 backdrop-blur-xl border border-[#C5A059]/20 rounded-[2.5rem] shadow-2xl overflow-hidden`}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-[#C5A059]/10">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Timestamp</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Operator Identity</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Action Type</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Activity Intelligence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map((log) => (
              <tr key={log.id_audit} className="anim-log-row hover:bg-[#C5A059]/10 transition-all duration-300 group cursor-default">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-tight group-hover:text-[#C5A059]/60">
                    <Clock size={12} className="text-[#C5A059]/60" />
                    {new Date(log.created_at).toLocaleString('id-ID')} WIB
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="size-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[#C5A059]">
                      <User size={14} />
                    </div>
                    <span className="text-white font-black text-[11px] uppercase group-hover:text-[#C5A059]">
                      {log.anggota?.nama_lengkap || 'Root System'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="inline-flex px-3 py-1.5 bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {log.action.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-8 py-6 text-white/50 text-[11px] font-bold italic group-hover:text-white/90">
                  {log.human_details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}