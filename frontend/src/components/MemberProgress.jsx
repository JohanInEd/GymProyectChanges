import { useMemo, useState } from "react";

const initialMeasurement = {
  date: new Date().toISOString().slice(0, 10),
  weightKg: "",
  chestCm: "",
  waistCm: "",
  hipCm: "",
  bodyFatPercentage: "",
};

const initialGoal = {
  title: "",
  targetValue: "",
  unit: "kg",
  targetDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
};

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function TrendChart({ records, field, label, unit, color = "text-emerald-500" }) {
  const points = records
    .filter((record) => Number.isFinite(record[field]))
    .slice(-8);

  if (points.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400 dark:bg-slate-950/50">
        Registra al menos dos mediciones de {label.toLowerCase()}.
      </div>
    );
  }

  const values = points.map((record) => record[field]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const width = 600;
  const height = 150;
  const coordinates = points.map((record, index) => ({
    x: 28 + index * ((width - 56) / (points.length - 1)),
    y: 18 + ((max - record[field]) / range) * (height - 48),
    record,
  }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">{label}</p>
        <p className={`text-sm font-bold ${color}`}>
          {values.at(-1)} {unit}
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
        <svg viewBox={`0 0 ${width} ${height}`} className={`h-40 w-full ${color}`} role="img" aria-label={`Tendencia de ${label}`}>
          {[35, 75, 115].map((y) => (
            <line key={y} x1="20" x2={width - 20} y1={y} y2={y} stroke="currentColor" strokeOpacity=".12" />
          ))}
          <polyline
            points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coordinates.map(({ x, y, record }) => (
            <g key={record.id}>
              <circle cx={x} cy={y} r="6" fill="currentColor" />
              <text x={x} y={height - 8} textAnchor="middle" fill="currentColor" className="text-[10px]">
                {record.date.slice(5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function MemberProgress({
  member,
  records,
  goals,
  notes,
  canEdit,
  currentUser,
  onAddMeasurement,
  onAddGoal,
  onToggleGoal,
  onAddNote,
}) {
  const [measurement, setMeasurement] = useState(initialMeasurement);
  const [goal, setGoal] = useState(initialGoal);
  const [note, setNote] = useState("");

  const memberRecords = useMemo(
    () =>
      records
        .filter((record) => record.memberId === member?.memberId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [member?.memberId, records],
  );
  const memberGoals = goals.filter((item) => item.memberId === member?.memberId);
  const memberNotes = notes
    .filter((item) => item.memberId === member?.memberId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = memberRecords.at(-1);
  const first = memberRecords[0];

  if (!member) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Selecciona un cliente para revisar su progreso.
      </div>
    );
  }

  function submitMeasurement(event) {
    event.preventDefault();
    const payload = {
      id: crypto.randomUUID(),
      memberId: member.memberId,
      date: measurement.date,
      weightKg: Number(measurement.weightKg) || null,
      chestCm: Number(measurement.chestCm) || null,
      waistCm: Number(measurement.waistCm) || null,
      hipCm: Number(measurement.hipCm) || null,
      bodyFatPercentage: Number(measurement.bodyFatPercentage) || null,
      recordedBy: currentUser.name,
    };

    onAddMeasurement(payload);
    setMeasurement(initialMeasurement);
  }

  function submitGoal(event) {
    event.preventDefault();
    if (!goal.title.trim()) return;
    onAddGoal({
      id: crypto.randomUUID(),
      memberId: member.memberId,
      ...goal,
      title: goal.title.trim(),
      targetValue: Number(goal.targetValue) || null,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    setGoal(initialGoal);
  }

  function submitNote(event) {
    event.preventDefault();
    if (!note.trim()) return;
    onAddNote({
      id: crypto.randomUUID(),
      memberId: member.memberId,
      text: note.trim(),
      author: currentUser.name,
      createdAt: new Date().toISOString(),
    });
    setNote("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            {member.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400">Seguimiento activo</p>
            <h2 className="text-xl font-bold">{member.fullName}</h2>
            <p className="text-sm text-slate-500">{member.planName} · {member.email}</p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-right dark:bg-slate-950/60">
          <p className="text-xs font-semibold text-slate-500">Ultima medicion</p>
          <p className="font-bold">{latest ? formatDate(latest.date) : "Sin registros"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Peso actual", latest?.weightKg, "kg", first && latest ? latest.weightKg - first.weightKg : null],
          ["Cintura", latest?.waistCm, "cm", first && latest ? latest.waistCm - first.waistCm : null],
          ["Grasa corporal", latest?.bodyFatPercentage, "%", first && latest ? latest.bodyFatPercentage - first.bodyFatPercentage : null],
          ["Objetivos activos", memberGoals.filter((item) => !item.completed).length, "", null],
        ].map(([label, value, unit, change]) => (
          <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value ?? "-"}{value != null && unit ? ` ${unit}` : ""}</p>
            {change != null ? (
              <p className={`mt-1 text-xs font-semibold ${change <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {change > 0 ? "+" : ""}{change.toFixed(1)} {unit} desde el inicio
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <TrendChart records={memberRecords} field="weightKg" label="Peso" unit="kg" />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <TrendChart records={memberRecords} field="waistCm" label="Cintura" unit="cm" color="text-violet-500" />
        </div>
      </div>

      {canEdit ? (
        <form onSubmit={submitMeasurement} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Registrar medicion</h2>
          <p className="text-sm text-slate-500">Agrega una nueva evaluacion corporal al historial.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ["date", "Fecha", "date"],
              ["weightKg", "Peso kg", "number"],
              ["chestCm", "Pecho cm", "number"],
              ["waistCm", "Cintura cm", "number"],
              ["hipCm", "Cadera cm", "number"],
              ["bodyFatPercentage", "Grasa %", "number"],
            ].map(([field, label, type]) => (
              <label key={field}>
                <span className="text-sm font-semibold">{label}</span>
                <input
                  type={type}
                  min={type === "number" ? "0" : undefined}
                  step={type === "number" ? "0.1" : undefined}
                  value={measurement[field]}
                  onChange={(event) => setMeasurement((current) => ({ ...current, [field]: event.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  required={field === "date" || field === "weightKg"}
                />
              </label>
            ))}
          </div>
          <button type="submit" className="mt-5 h-11 rounded-xl bg-violet-500 px-5 text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-600">
            Guardar medicion
          </button>
        </form>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Objetivos</h2>
          <div className="mt-4 space-y-3">
            {memberGoals.length === 0 ? <p className="text-sm text-slate-500">No hay objetivos registrados.</p> : null}
            {memberGoals.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!canEdit}
                onClick={() => onToggleGoal(item.id)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${
                  item.completed
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${item.completed ? "line-through opacity-60" : ""}`}>{item.title}</p>
                  <p className="text-xs text-slate-500">Meta: {item.targetValue || "-"} {item.unit} · {formatDate(item.targetDate)}</p>
                </div>
                <span className={`text-xs font-bold ${item.completed ? "text-emerald-600" : "text-amber-600"}`}>
                  {item.completed ? "Completado" : "En curso"}
                </span>
              </button>
            ))}
          </div>
          {canEdit ? (
            <form onSubmit={submitGoal} className="mt-5 grid gap-3 sm:grid-cols-2">
              <input value={goal.title} onChange={(event) => setGoal((current) => ({ ...current, title: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Objetivo" required />
              <input type="date" value={goal.targetDate} onChange={(event) => setGoal((current) => ({ ...current, targetDate: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" required />
              <input type="number" step="0.1" value={goal.targetValue} onChange={(event) => setGoal((current) => ({ ...current, targetValue: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Valor meta" />
              <select value={goal.unit} onChange={(event) => setGoal((current) => ({ ...current, unit: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option>kg</option><option>cm</option><option>%</option><option>sesiones</option>
              </select>
              <button type="submit" className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white dark:bg-white dark:text-slate-950 sm:col-span-2">Agregar objetivo</button>
            </form>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Notas del entrenador</h2>
          {canEdit ? (
            <form onSubmit={submitNote} className="mt-4">
              <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Observaciones, recomendaciones o ajustes de rutina..." required />
              <button type="submit" className="mt-2 h-10 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white hover:bg-emerald-600">Guardar nota</button>
            </form>
          ) : null}
          <div className="mt-5 space-y-3">
            {memberNotes.length === 0 ? <p className="text-sm text-slate-500">No hay notas registradas.</p> : null}
            {memberNotes.map((item) => (
              <article key={item.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{item.text}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {item.author} · {new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="font-bold">Historial de mediciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60">
              <tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Peso</th><th className="px-5 py-3">Pecho</th><th className="px-5 py-3">Cintura</th><th className="px-5 py-3">Cadera</th><th className="px-5 py-3">Grasa</th><th className="px-5 py-3">Registrado por</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...memberRecords].reverse().map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4 font-semibold">{formatDate(record.date)}</td>
                  <td className="px-5 py-4">{record.weightKg ?? "-"} kg</td>
                  <td className="px-5 py-4">{record.chestCm ?? "-"} cm</td>
                  <td className="px-5 py-4">{record.waistCm ?? "-"} cm</td>
                  <td className="px-5 py-4">{record.hipCm ?? "-"} cm</td>
                  <td className="px-5 py-4">{record.bodyFatPercentage ?? "-"}%</td>
                  <td className="px-5 py-4 text-slate-500">{record.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
