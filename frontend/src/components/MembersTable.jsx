import { useEffect, useMemo, useState } from "react";

function PencilIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4.243.707.707-4.243L16.862 4.487Z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

const statusStyles = {
  Active: {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    accent: "border-l-emerald-500 dark:border-l-emerald-400",
    hover: "hover:!bg-emerald-50 dark:hover:!bg-emerald-950/40",
    label: "Activa",
  },
  ExpiringSoon: {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    accent: "border-l-amber-500 dark:border-l-amber-400",
    hover: "hover:!bg-amber-50 dark:hover:!bg-amber-950/40",
    label: "Por vencer",
  },
  Expired: {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    accent: "border-l-rose-500 dark:border-l-rose-400",
    hover: "hover:!bg-rose-50 dark:hover:!bg-rose-950/40",
    label: "Vencida",
  },
  Pending: {
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    label: "Pendiente",
  },
  Suspended: {
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    label: "Suspendida",
  },
  Cancelled: {
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    label: "Cancelada",
  },
};

function getStatusStyle(status, tailwindClass) {
  if (statusStyles[status]) {
    return statusStyles[status];
  }

  return {
    row: "bg-white dark:bg-gray-900",
    badge: tailwindClass || "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    label: status || "Sin estado",
  };
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = String(value).split("-").map(Number);
  const date = year && month && day ? new Date(year, month - 1, day) : new Date(value);

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

const MAX_VISIBLE_MEMBERS = 10;

function formatDateShort(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = String(value).split("-").map(Number);
  const date = year && month && day ? new Date(year, month - 1, day) : new Date(value);

  const parts = new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${byType.day} ${byType.month} ${byType.year}`;
}

export default function MembersTable({
  members = [],
  selectedMemberId,
  membershipFilter = "all",
  onMembershipFilterChange,
  onSelectMember,
  onEditMember,
  onDeleteMember,
  isLoading = false,
}) {
  const [nameQuery, setNameQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [memberToDelete, setMemberToDelete] = useState(null);
  const showActions = Boolean(onEditMember || onDeleteMember);

  useEffect(() => {
    if (!memberToDelete) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMemberToDelete(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [memberToDelete]);

  const planOptions = useMemo(
    () => Array.from(new Set(members.map((member) => member.planName).filter(Boolean))).sort(),
    [members],
  );

  const visibleMembers = useMemo(() => {
    const query = nameQuery.trim().toLowerCase();

    return members.filter((member) => {
      const matchesName = !query || member.fullName.toLowerCase().includes(query);
      const matchesPlan = planFilter === "all" || member.planName === planFilter;
      return matchesName && matchesPlan;
    });
  }, [members, nameQuery, planFilter]);

  const totalVisibleCount = visibleMembers.length;
  const displayedMembers = visibleMembers.slice(0, MAX_VISIBLE_MEMBERS);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Cargando miembros...
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        No hay miembros para mostrar.
      </div>
    );
  }

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead className="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">
                <div className="flex min-w-44 flex-col gap-2">
                  <span>Miembro</span>
                  <input
                    type="text"
                    value={nameQuery}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setNameQuery(event.target.value)}
                    placeholder="Buscar por nombre..."
                    className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium normal-case text-gray-700 outline-none focus:border-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-200"
                  />
                </div>
              </th>
              <th className="px-4 py-3">
                <div className="flex min-w-40 flex-col gap-2">
                  <span>Membresia</span>
                  <select
                    className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium normal-case text-gray-700 outline-none focus:border-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-200"
                    value={planFilter}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => setPlanFilter(event.target.value)}
                  >
                    <option value="all">Todas</option>
                    {planOptions.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span>Inicio</span>
                  <span className="h-4 w-px rotate-[25deg] bg-slate-400 dark:bg-slate-600" aria-hidden="true" />
                  <span>Vence</span>
                </div>
              </th>
              <th className="px-4 py-3">Dias restantes</th>
              <th className="px-4 py-3">
                <div className="flex min-w-36 flex-col gap-2">
                  <span>Estado</span>
                  {onMembershipFilterChange ? (
                    <select
                      className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium normal-case text-gray-700 outline-none focus:border-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-200"
                      value={membershipFilter}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => onMembershipFilterChange(event.target.value)}
                    >
                      <option value="all">Todas</option>
                      <option value="Active">Activas</option>
                      <option value="ExpiringSoon">Por vencer</option>
                      <option value="Expired">Vencidas</option>
                    </select>
                  ) : null}
                </div>
              </th>
              {showActions ? <th className="px-4 py-3 text-right">Acciones</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {totalVisibleCount === 0 ? (
              <tr>
                <td colSpan={showActions ? 6 : 5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron miembros con los filtros aplicados.
                </td>
              </tr>
            ) : null}
            {displayedMembers.map((member) => {
              const style = getStatusStyle(member.status, member.tailwindClass);

              return (
                <tr
                  key={member.memberId}
                  className={`${style.row} cursor-pointer transition-colors ${style.hover} ${
                    selectedMemberId === member.memberId ? "bg-emerald-50/70 dark:bg-emerald-950/20" : ""
                  }`}
                  onClick={() => onSelectMember?.(member)}
                >
                  <td className={`border-l-4 ${style.accent} px-4 py-3`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                        {member.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-950 dark:text-white">{member.fullName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{member.planName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(member.startDate)} - {formatDate(member.endDate)}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    <div>{formatDateShort(member.startDate)}</div>
                    <div>{formatDateShort(member.endDate)}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{member.daysToExpire}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
                      {style.label}
                    </span>
                  </td>
                  {showActions ? (
                    <td className="px-4 py-3 text-right">
                      {onEditMember ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditMember(member);
                          }}
                          aria-label="Editar cliente"
                          title="Editar cliente"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sky-600 transition hover:bg-sky-50 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/40"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                      {onDeleteMember ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMemberToDelete(member);
                          }}
                          aria-label="Eliminar cliente"
                          title="Eliminar cliente"
                          className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalVisibleCount > 0 ? (
        <div className="border-t border-slate-200/80 px-4 py-3 text-center text-xs text-gray-500 dark:border-slate-800 dark:text-gray-400">
          Mostrando {displayedMembers.length} de {totalVisibleCount} miembros registrados.
        </div>
      ) : null}
    </div>

    {memberToDelete ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
        onClick={() => setMemberToDelete(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-member-title"
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <TrashIcon className="h-5 w-5" />
            </div>
            <h2 id="delete-member-title" className="text-base font-semibold text-gray-950 dark:text-white">
              Eliminar cliente
            </h2>
          </div>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Seguro que deseas eliminar a{" "}
            <span className="font-semibold text-gray-950 dark:text-white">{memberToDelete.fullName}</span>? Esta
            accion no se puede deshacer.
          </p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMemberToDelete(null)}
              className="h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteMember(memberToDelete.memberId);
                setMemberToDelete(null);
              }}
              className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
