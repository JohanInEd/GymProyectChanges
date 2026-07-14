import { useMemo, useState } from "react";

const initialClassForm = {
  name: "",
  coach: "",
  date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  time: "18:00",
  duration: "60",
  capacity: "12",
  room: "Salon principal",
};

function formatDate(date, time) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(`${date}T${time}:00`));
}

export default function ClassSchedule({
  classes,
  classCatalog = [],
  members,
  reservations,
  canManageClasses,
  currentUser,
  onCreateClassWithReservation,
  onReserve,
  onCancelReservation,
}) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || "");
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.memberId || "");
  const [classForm, setClassForm] = useState({ ...initialClassForm, coach: currentUser.name });
  const [notice, setNotice] = useState(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [scheduleMemberId, setScheduleMemberId] = useState("");
  const [scheduleNotice, setScheduleNotice] = useState(null);

  const scheduleMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();

    return members.filter((member) => !query || member.fullName.toLowerCase().includes(query));
  }, [members, memberQuery]);

  const selectedClass = classes.find((item) => item.id === selectedClassId) || classes[0];
  const selectedReservations = reservations.filter(
    (reservation) => reservation.classId === selectedClass?.id && reservation.status === "confirmed",
  );

  const classCards = useMemo(
    () =>
      [...classes].sort((a, b) =>
        `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
      ),
    [classes],
  );

  function reserve(event) {
    event.preventDefault();
    const result = onReserve(selectedClass.id, selectedMemberId);
    setNotice(result);
  }

  function applyClassTemplate(name) {
    const template = classCatalog.find((item) => item.name === name);

    setClassForm((current) => ({
      ...current,
      name,
      ...(template
        ? {
            coach: template.coach,
            duration: String(template.duration),
            capacity: String(template.capacity),
            room: template.room,
          }
        : {}),
    }));
  }

  function createClass(event) {
    event.preventDefault();

    if (!classForm.name.trim() || !classForm.coach.trim()) {
      return;
    }

    if (!scheduleMemberId) {
      setScheduleNotice({ ok: false, message: "Selecciona un miembro de la lista para confirmar la reserva." });
      return;
    }

    const newClass = {
      id: crypto.randomUUID(),
      ...classForm,
      name: classForm.name.trim(),
      coach: classForm.coach.trim(),
      duration: Number(classForm.duration),
      capacity: Number(classForm.capacity),
    };
    const result = onCreateClassWithReservation(newClass, scheduleMemberId);
    setScheduleNotice(result);

    if (result?.ok) {
      setSelectedClassId(newClass.id);
      setClassForm({ ...initialClassForm, coach: currentUser.name });
      setScheduleMemberId("");
      setMemberQuery("");
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Clases programadas</p>
          <p className="mt-2 text-3xl font-bold">{classes.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Reservas activas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {reservations.filter((item) => item.status === "confirmed").length}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Cupos disponibles</p>
          <p className="mt-2 text-3xl font-bold text-sky-600">
            {classes.reduce(
              (total, item) =>
                total +
                Math.max(
                  0,
                  item.capacity -
                    reservations.filter(
                      (reservation) => reservation.classId === item.id && reservation.status === "confirmed",
                    ).length,
                ),
              0,
            )}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Entrenadores</p>
          <p className="mt-2 text-3xl font-bold text-violet-600">{new Set(classes.map((item) => item.coach)).size}</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {classCards.map((gymClass) => {
              const booked = reservations.filter(
                (item) => item.classId === gymClass.id && item.status === "confirmed",
              ).length;
              const isSelected = selectedClass?.id === gymClass.id;
              const percentage = Math.min((booked / gymClass.capacity) * 100, 100);

              return (
                <button
                  key={gymClass.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassId(gymClass.id);
                    setNotice(null);
                  }}
                  className={`rounded-2xl border p-5 text-left transition ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50/70 shadow-md shadow-emerald-500/10 dark:bg-emerald-950/20"
                      : "border-slate-200/80 bg-white hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{gymClass.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(gymClass.date, gymClass.time)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {gymClass.duration} min
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500">{gymClass.coach} · {gymClass.room}</span>
                    <span className="font-bold">{booked}/{gymClass.capacity}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${percentage >= 90 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {canManageClasses ? (
            <form onSubmit={createClass} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-bold">Programar clase</h2>
                <p className="text-sm text-slate-500">Crea una sesion, elige un miembro y confirma su reserva.</p>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
                <div className="lg:border-r lg:border-slate-200 lg:pr-5 dark:lg:border-slate-800">
                  <input
                    type="text"
                    value={memberQuery}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    placeholder="Buscar por nombre..."
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <p className="mt-3 border-b border-slate-200 pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800">
                    Miembro
                  </p>
                  <div className="mt-1 max-h-72 space-y-1 overflow-y-auto">
                    {scheduleMembers.length === 0 ? (
                      <p className="px-2 py-4 text-sm text-slate-500">No se encontraron miembros con ese nombre.</p>
                    ) : (
                      scheduleMembers.map((member) => {
                        const isSelected = scheduleMemberId === member.memberId;

                        return (
                          <button
                            key={member.memberId}
                            type="button"
                            onClick={() => {
                              setScheduleMemberId(member.memberId);
                              setScheduleNotice(null);
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                              isSelected
                                ? "bg-slate-100 ring-1 ring-inset ring-slate-300 dark:bg-slate-800 dark:ring-slate-600"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                              {member.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">{member.fullName}</span>
                              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clase</span>
                      <select
                        value={classForm.name}
                        onChange={(event) => applyClassTemplate(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                        required
                      >
                        <option value="" disabled>
                          {classCatalog.length === 0 ? "Sin clases registradas" : "Selecciona una clase"}
                        </option>
                        {classCatalog.map((template) => (
                          <option key={template.id} value={template.name}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {[
                      ["coach", "Entrenador", "Nombre del entrenador", "text"],
                      ["date", "Fecha", "", "date"],
                      ["time", "Hora", "", "time"],
                      ["duration", "Duracion (min)", "60", "number"],
                      ["capacity", "Capacidad", "12", "number"],
                      ["room", "Espacio", "Salon principal", "text"],
                    ].map(([field, label, placeholder, type]) => (
                      <label key={field} className={field === "room" ? "sm:col-span-2" : ""}>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                        <input
                          type={type}
                          min={type === "number" ? "1" : undefined}
                          value={classForm[field]}
                          onChange={(event) => setClassForm((current) => ({ ...current, [field]: event.target.value }))}
                          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                          placeholder={placeholder}
                          required
                        />
                      </label>
                    ))}
                  </div>

                  {classCatalog.length === 0 ? (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Registra clases en Configuracion para que aparezcan aqui automaticamente.
                    </p>
                  ) : null}

                  {scheduleNotice ? (
                    <p
                      className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                        scheduleNotice.ok
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                      }`}
                      aria-live="polite"
                    >
                      {scheduleNotice.message}
                    </p>
                  ) : null}

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      className="h-11 rounded-xl bg-emerald-500 px-8 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600"
                    >
                      Confirmar reserva
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : null}
        </div>

        <aside className="space-y-6">
          <form onSubmit={reserve} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">Reservar cupo</p>
            <h2 className="mt-2 text-xl font-bold">{selectedClass?.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedClass ? formatDate(selectedClass.date, selectedClass.time) : "Selecciona una clase"}
            </p>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cliente</span>
              <select
                value={selectedMemberId}
                onChange={(event) => {
                  setSelectedMemberId(event.target.value);
                  setNotice(null);
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {members.map((member) => (
                  <option key={member.memberId} value={member.memberId}>
                    {member.fullName} · {member.planName}
                  </option>
                ))}
              </select>
            </label>

            {notice ? (
              <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                notice.ok
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
              }`}>
                {notice.message}
              </p>
            ) : null}

            <button type="submit" disabled={!selectedClass || !selectedMemberId} className="mt-5 h-11 w-full rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-40">
              Confirmar reserva
            </button>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="font-bold">Lista de asistentes</h2>
              <p className="text-xs text-slate-500">{selectedReservations.length} reservas confirmadas</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {selectedReservations.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">Aun no hay reservas.</p>
              ) : (
                selectedReservations.map((reservation) => {
                  const member = members.find((item) => item.memberId === reservation.memberId);
                  return (
                    <div key={reservation.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold">{member?.fullName || "Cliente"}</p>
                        <p className="text-xs text-slate-500">{member?.planName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCancelReservation(reservation.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
