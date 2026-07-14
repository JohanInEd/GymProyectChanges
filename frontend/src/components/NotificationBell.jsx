import { useEffect, useRef, useState } from "react";

export default function NotificationBell({ expiringMembers = [], onReviewMember }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasAlerts = expiringMembers.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {hasAlerts ? (
        <span className="absolute inset-0 animate-ping rounded-2xl bg-rose-400/60 [animation-duration:2.4s]" aria-hidden="true" />
      ) : null}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl active:translate-y-0 active:scale-95 ${
          hasAlerts ? "bg-rose-500 shadow-rose-500/30 hover:bg-rose-600" : "bg-emerald-500 shadow-emerald-500/25 hover:bg-emerald-600"
        }`}
        aria-label="Notificaciones de mensualidades por vencer"
        aria-expanded={isOpen}
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 origin-top ${hasAlerts ? "animate-bell-ring" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {hasAlerts ? (
          <span
            key={expiringMembers.length}
            className="animate-pop-in absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-950"
          >
            {expiringMembers.length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="animate-pop-in absolute right-0 top-full z-40 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
          <p className="px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Mensualidades por vencer</p>

          {expiringMembers.length === 0 ? (
            <p className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">Todo al dia, no hay vencimientos proximos.</p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {expiringMembers.map((member) => (
                <li key={member.memberId} className="flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-amber-50 dark:hover:bg-amber-950/20">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-amber-950">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M12 9v4M12 17h.01M10.3 3.6 2.6 17a2 2 0 0 0 1.74 3h15.32a2 2 0 0 0 1.74-3L13.7 3.6a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{member.fullName}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {member.planName} · {member.daysToExpire} dias
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onReviewMember(member.memberId);
                      setIsOpen(false);
                    }}
                    className="shrink-0 rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-900 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
                  >
                    Revisar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
