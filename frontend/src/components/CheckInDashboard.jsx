import { useMemo, useState } from "react";

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
  Suspended: {
    row: "bg-gray-50 dark:bg-gray-900/60",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    label: "Suspendida",
  },
};

function getStatusStyle(status) {
  return statusStyles[status] || {
    row: "bg-white dark:bg-gray-800",
    badge: "bg-gray-100 text-gray-800",
    accent: "border-l-gray-400 dark:border-l-gray-500",
    hover: "hover:!bg-gray-100 dark:hover:!bg-gray-800/60",
    label: status || "Sin estado",
  };
}

const MAX_VISIBLE_MEMBERS = 10;

function getDateKey(value) {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getResultMessage(result) {
  if (result.action === "check-out") {
    return `Salida registrada ${formatDateTime(result.checkedOutAt)}.`;
  }

  if (result.action === "duplicate") {
    return result.reason;
  }

  if (!result.accessGranted) {
    return `Entrada bloqueada: ${result.reason}.`;
  }

  return `Entrada registrada ${formatDateTime(result.checkedAt)}.`;
}

function StatCard({ label, value, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    sky: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
    </article>
  );
}

export default function CheckInDashboard({
  members,
  attendanceLogs,
  onCheckIn,
  onCheckOut,
  onReviewPayment,
  canReviewPayment = false,
}) {
  const [nameQuery, setNameQuery] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const visibleMembers = useMemo(() => {
    const query = nameQuery.trim().toLowerCase();

    return members.filter((member) => !query || member.fullName.toLowerCase().includes(query));
  }, [members, nameQuery]);

  const totalVisibleCount = visibleMembers.length;
  const displayedMembers = visibleMembers.slice(0, MAX_VISIBLE_MEMBERS);

  const todayLogs = useMemo(() => {
    const todayKey = getDateKey();

    return attendanceLogs.filter((log) => getDateKey(log.checkedAt) === todayKey);
  }, [attendanceLogs]);

  function getOpenAttendance(memberId) {
    return attendanceLogs.find((log) => log.memberId === memberId && log.accessGranted && !log.checkedOutAt);
  }

  async function handleCheckIn(memberId) {
    const log = await onCheckIn?.(memberId);

    if (log) {
      setLastResult(log);
    }
  }

  async function handleCheckOut(memberId) {
    const log = await onCheckOut?.(memberId);

    if (log) {
      setLastResult(log);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entradas hoy" value={todayLogs.filter((log) => log.accessGranted).length} />
        <StatCard label="Accesos bloqueados" value={todayLogs.filter((log) => !log.accessGranted).length} tone="rose" />
        <StatCard label="Planes por vencer" value={members.filter((member) => member.status === "ExpiringSoon").length} tone="amber" />
        <StatCard label="Personas dentro" value={attendanceLogs.filter((log) => log.accessGranted && !log.checkedOutAt).length} tone="sky" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">Check-in de entrada</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Busca un cliente y valida su entrada o su salida.</p>
        </div>

        {lastResult ? (
          <div
            className={`border-b px-4 py-2.5 text-sm ${
              lastResult.accessGranted
                ? "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
                : "border-rose-100 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
            }`}
            aria-live="polite"
          >
            <span className="font-semibold">{lastResult.fullName}:</span> {getResultMessage(lastResult)}
          </div>
        ) : null}

        {members.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No hay clientes disponibles para check-in.</p>
        ) : (
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
                        onChange={(event) => setNameQuery(event.target.value)}
                        placeholder="Buscar por nombre..."
                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium normal-case text-gray-700 outline-none focus:border-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-200"
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 align-top">Membresia</th>
                  <th className="px-4 py-3 align-top">Estado</th>
                  <th className="px-4 py-3 align-top">Vence</th>
                  <th className="px-4 py-3 align-top">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {totalVisibleCount === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron clientes con ese nombre.
                    </td>
                  </tr>
                ) : (
                  displayedMembers.map((member) => {
                    const style = getStatusStyle(member.status);
                    const isSuspended = member.status === "Suspended";
                    const isExpired = member.status === "Expired" || member.daysToExpire < 0;
                    const isBlocked = isExpired || isSuspended;
                    const openAttendance = getOpenAttendance(member.memberId);

                    return (
                      <tr key={member.memberId} className={`${style.row} transition-colors ${style.hover}`}>
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
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{member.planName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
                            {style.label}
                          </span>
                          {openAttendance ? (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              Dentro desde {formatDateTime(openAttendance.checkedAt)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className={isExpired ? "font-medium text-rose-600 dark:text-rose-300" : "text-gray-700 dark:text-gray-300"}>
                            {formatDateShort(member.endDate)}
                          </div>
                          {isExpired ? (
                            <div className="text-xs text-rose-500 dark:text-rose-400">Plan finalizado</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleCheckIn(member.memberId)}
                              disabled={isBlocked || Boolean(openAttendance)}
                              title={
                                isBlocked
                                  ? isSuspended
                                    ? "La membresia esta suspendida."
                                    : "La membresia esta vencida."
                                  : openAttendance
                                    ? "El cliente ya tiene una entrada activa."
                                    : "Registra el dia y la hora de entrada."
                              }
                              className="h-9 rounded-md bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                            >
                              Validar entrada
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCheckOut(member.memberId)}
                              disabled={!openAttendance}
                              title={openAttendance ? "Cierra la visita activa." : "El cliente no tiene una entrada activa."}
                              className="h-9 rounded-md border border-sky-600 bg-sky-50 px-3 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/70 dark:disabled:border-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                            >
                              Validar salida
                            </button>
                            {isBlocked && canReviewPayment ? (
                              <button
                                type="button"
                                onClick={() => onReviewPayment?.(member.memberId)}
                                title="Abre el registro de pagos en Finanzas."
                                className="h-9 rounded-md border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-950/30"
                              >
                                Revisar pago
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalVisibleCount > 0 ? (
          <div className="border-t border-slate-200/80 px-4 py-3 text-center text-xs text-gray-500 dark:border-slate-800 dark:text-gray-400">
            Mostrando {displayedMembers.length} de {totalVisibleCount} miembros registrados.
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">Registro reciente</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-900/70 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Entrada</th>
                <th className="px-4 py-3">Salida</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {attendanceLogs.slice(0, 8).map((log) => (
                <tr key={log.id} className="bg-white dark:bg-gray-800">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDateTime(log.checkedAt)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {log.checkedOutAt ? formatDateTime(log.checkedOutAt) : log.accessGranted ? "Dentro" : "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-950 dark:text-white">{log.fullName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.planName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        log.accessGranted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.accessGranted ? "Permitido" : "Bloqueado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
