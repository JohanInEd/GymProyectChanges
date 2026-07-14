import { useMemo, useState } from "react";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const initialEquipment = {
  name: "",
  category: "Cardio",
  status: "Operativo",
  nextMaintenance: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
};

const initialShift = {
  employee: "",
  role: "Entrenador",
  date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  start: "08:00",
  end: "16:00",
  commission: "0",
};

export default function OperationsDashboard({
  budgets,
  equipment,
  shifts,
  onUpdateBudget,
  onCreateEquipment,
  onUpdateEquipmentStatus,
  onCreateShift,
}) {
  const [equipmentForm, setEquipmentForm] = useState(initialEquipment);
  const [shiftForm, setShiftForm] = useState(initialShift);

  const totals = useMemo(
    () => ({
      budget: budgets.reduce((sum, item) => sum + item.limit, 0),
      spent: budgets.reduce((sum, item) => sum + item.spent, 0),
      maintenance: equipment.filter((item) => item.status !== "Operativo").length,
      commissions: shifts.reduce((sum, item) => sum + item.commission, 0),
    }),
    [budgets, equipment, shifts],
  );

  function createEquipment(event) {
    event.preventDefault();
    if (!equipmentForm.name.trim()) return;
    onCreateEquipment({ id: crypto.randomUUID(), ...equipmentForm, name: equipmentForm.name.trim() });
    setEquipmentForm(initialEquipment);
  }

  function createShift(event) {
    event.preventDefault();
    if (!shiftForm.employee.trim()) return;
    onCreateShift({
      id: crypto.randomUUID(),
      ...shiftForm,
      employee: shiftForm.employee.trim(),
      commission: Number(shiftForm.commission) || 0,
    });
    setShiftForm(initialShift);
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Presupuesto mensual", currency.format(totals.budget), "text-slate-950 dark:text-white"],
          ["Ejecutado", currency.format(totals.spent), "text-amber-600"],
          ["Equipos con novedad", totals.maintenance, "text-rose-600"],
          ["Comisiones programadas", currency.format(totals.commissions), "text-emerald-600"],
        ].map(([label, value, tone]) => (
          <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-lg font-bold">Presupuesto de gastos</h2>
          <p className="text-sm text-slate-500">Define topes mensuales y controla el nivel de ejecucion.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = Math.min((budget.spent / Math.max(budget.limit, 1)) * 100, 100);
            return (
              <article key={budget.category} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{budget.category}</p>
                    <p className="mt-1 text-xs text-slate-500">{currency.format(budget.spent)} ejecutado</p>
                  </div>
                  <span className={`text-xs font-bold ${percentage >= 90 ? "text-rose-600" : "text-emerald-600"}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${percentage >= 90 ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${percentage}%` }} />
                </div>
                <label className="mt-4 block">
                  <span className="text-xs font-semibold text-slate-500">Tope mensual</span>
                  <input
                    type="number"
                    min="0"
                    value={budget.limit}
                    onChange={(event) => onUpdateBudget(budget.category, Number(event.target.value))}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              </article>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <form onSubmit={createEquipment} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold">Registrar equipo</h2>
            <p className="text-sm text-slate-500">Controla inventario, estado y proximo mantenimiento.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["name", "Equipo", "Caminadora 04", "text"],
                ["nextMaintenance", "Proximo mantenimiento", "", "date"],
              ].map(([field, label, placeholder, type]) => (
                <label key={field}>
                  <span className="text-sm font-semibold">{label}</span>
                  <input
                    type={type}
                    value={equipmentForm[field]}
                    onChange={(event) => setEquipmentForm((current) => ({ ...current, [field]: event.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    placeholder={placeholder}
                    required
                  />
                </label>
              ))}
              <label>
                <span className="text-sm font-semibold">Categoria</span>
                <select value={equipmentForm.category} onChange={(event) => setEquipmentForm((current) => ({ ...current, category: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <option>Cardio</option><option>Fuerza</option><option>Accesorios</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold">Estado</span>
                <select value={equipmentForm.status} onChange={(event) => setEquipmentForm((current) => ({ ...current, status: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <option>Operativo</option><option>Mantenimiento</option><option>Fuera de servicio</option>
                </select>
              </label>
            </div>
            <button type="submit" className="mt-5 h-11 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white hover:bg-emerald-600">Agregar equipo</button>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-bold">Inventario y mantenimiento</h2></div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {equipment.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category} · mantenimiento {item.nextMaintenance}</p>
                  </div>
                  <select value={item.status} onChange={(event) => onUpdateEquipmentStatus(item.id, event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950">
                    <option>Operativo</option><option>Mantenimiento</option><option>Fuera de servicio</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={createShift} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold">Programar turno</h2>
            <p className="text-sm text-slate-500">Organiza horarios y comisiones del equipo.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["employee", "Empleado", "Nombre completo", "text"],
                ["date", "Fecha", "", "date"],
                ["start", "Entrada", "", "time"],
                ["end", "Salida", "", "time"],
                ["commission", "Comision COP", "0", "number"],
              ].map(([field, label, placeholder, type]) => (
                <label key={field}>
                  <span className="text-sm font-semibold">{label}</span>
                  <input type={type} min={type === "number" ? "0" : undefined} value={shiftForm[field]} onChange={(event) => setShiftForm((current) => ({ ...current, [field]: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder={placeholder} required />
                </label>
              ))}
              <label>
                <span className="text-sm font-semibold">Rol</span>
                <select value={shiftForm.role} onChange={(event) => setShiftForm((current) => ({ ...current, role: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <option>Entrenador</option><option>Recepcion</option><option>Aseo</option><option>Administrador</option>
                </select>
              </label>
            </div>
            <button type="submit" className="mt-5 h-11 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-white hover:bg-emerald-600">Guardar turno</button>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-bold">Turnos y comisiones</h2></div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60">
                  <tr><th className="px-5 py-3">Empleado</th><th className="px-5 py-3">Turno</th><th className="px-5 py-3">Comision</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {shifts.map((shift) => (
                    <tr key={shift.id}>
                      <td className="px-5 py-4"><p className="font-semibold">{shift.employee}</p><p className="text-xs text-slate-500">{shift.role}</p></td>
                      <td className="px-5 py-4"><p>{shift.date}</p><p className="text-xs text-slate-500">{shift.start} - {shift.end}</p></td>
                      <td className="px-5 py-4 font-semibold text-emerald-600">{currency.format(shift.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
