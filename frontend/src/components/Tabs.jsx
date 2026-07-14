const icons = {
  finance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" strokeLinecap="round" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" strokeLinecap="round" />
      <path d="m3 7 5-4 5 4 7-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M13 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  checkin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  membership: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 20h18M5 16l4-5 4 3 6-8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="16" r="1.5" /><circle cx="9" cy="11" r="1.5" /><circle cx="13" cy="14" r="1.5" /><circle cx="19" cy="6" r="1.5" />
    </svg>
  ),
  classes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 16 2 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  inventory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4.5 7.5 7.5 4.25 7.5-4.25M12 12v9M8 5.25l8 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  operations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M8 11h.01M12 11h.01M16 11h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  setup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.39.36.74.67 1 .31.27.7.41 1.11.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  access: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function Tabs({ tabs, activeTab, onChange, variant = "default" }) {
  const isSidebar = variant === "sidebar";
  const isMobile = variant === "mobile";

  return (
    <nav
      className={
        isSidebar
          ? "mt-3"
          : isMobile
            ? "overflow-x-auto"
            : "rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
      }
      aria-label="Navegacion principal"
    >
      <div
        className={
          isSidebar
            ? "space-y-1"
            : isMobile
              ? "flex min-w-max gap-1"
              : "grid gap-1"
        }
        style={!isSidebar && !isMobile ? { gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))" } : undefined}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`group flex items-center gap-3 text-sm font-semibold transition ${
                isSidebar
                  ? "w-full rounded-xl px-3 py-3"
                  : isMobile
                    ? "rounded-xl px-3 py-2.5"
                    : "h-10 justify-center rounded-xl px-3"
              } ${
                isActive
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
              }`}
            >
              <span
                key={isActive ? "active" : "inactive"}
                className={`h-5 w-5 shrink-0 ${isActive ? "animate-pop-in text-white" : "text-slate-400 group-hover:text-emerald-500"}`}
              >
                {icons[tab.id]}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
