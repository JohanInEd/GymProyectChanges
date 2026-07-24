import MembershipCalendar from "./MembershipCalendar.jsx";

function Metric({ label, value, suffix }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
        {value ? `${value}${suffix}` : "-"}
      </p>
    </div>
  );
}

export default function MemberDetail({ member }) {
  if (!member) {
    return (
      <aside className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Selecciona un usuario para ver su informacion.
      </aside>
    );
  }

  const metrics = member.bodyMetrics || {};

  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 lg:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {member.fullName.split(" ").map((name) => name[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">Perfil del cliente</p>
              <h2 className="truncate text-xl font-bold text-gray-950 dark:text-white">{member.fullName}</h2>
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{member.phone || "Sin telefono"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric label="Edad" value={member.age} suffix=" anos" />
            <Metric label="Genero" value={member.gender === "female" ? "Mujer" : "Hombre"} suffix="" />
            <Metric label="Estatura" value={metrics.heightCm} suffix=" cm" />
            <Metric label="Peso" value={metrics.weightKg} suffix=" kg" />
            <Metric label="Pecho" value={metrics.chestCm} suffix=" cm" />
            <Metric label="Cintura" value={metrics.waistCm} suffix=" cm" />
            <Metric label="Cadera" value={metrics.hipCm} suffix=" cm" />
          </div>
        </div>

        <MembershipCalendar member={member} />
      </div>
    </aside>
  );
}
