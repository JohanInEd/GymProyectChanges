import { useMemo, useState } from "react";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const compactMoney = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  notation: "compact",
  maximumFractionDigits: 1,
});

function monthKey(value) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("es-CO", { month: "short" }).format(date).replace(".", ""),
    };
  });
}

function KpiCard({ label, value, detail, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`h-9 w-9 rounded-xl ${tones[tone]}`} />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}

function HorizontalBars({ data, valueFormatter = (value) => value, color = "bg-emerald-500" }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold">{item.label}</span>
            <span className="text-slate-500 dark:text-slate-400">{valueFormatter(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={`h-full rounded-full ${item.color || color}`} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard({ members, financialSummary, attendanceLogs, plans }) {
  const [period, setPeriod] = useState(6);
  const months = useMemo(() => lastMonths(period), [period]);

  const membershipMetrics = useMemo(() => {
    const active = members.filter((member) => member.status === "Active" || member.status === "ExpiringSoon").length;
    const expired = members.filter((member) => member.status === "Expired").length;
    const retention = members.length ? (active / members.length) * 100 : 0;
    const churn = members.length ? (expired / members.length) * 100 : 0;
    return { active, expired, retention, churn };
  }, [members]);

  const memberMovement = useMemo(
    () =>
      months.map((month) => ({
        ...month,
        joins: members.filter((member) => monthKey(member.startDate) === month.key).length,
        exits: members.filter(
          (member) => member.status === "Expired" && monthKey(member.endDate) === month.key,
        ).length,
      })),
    [members, months],
  );

  const paidPayments = financialSummary.recentPayments.filter((payment) => payment.status === "Paid");

  const revenueByPlan = useMemo(() => {
    const totals = plans.reduce((result, plan) => ({ ...result, [plan.name]: 0 }), {});
    paidPayments.forEach((payment) => {
      totals[payment.planName] = (totals[payment.planName] || 0) + payment.amount;
    });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [paidPayments, plans]);

  const revenueByMethod = useMemo(() => {
    const totals = paidPayments.reduce((result, payment) => {
      const method = payment.method || "Sin registrar";
      result[method] = (result[method] || 0) + payment.amount;
      return result;
    }, {});
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [paidPayments]);

  const peakHours = useMemo(() => {
    const totals = attendanceLogs
      .filter((log) => log.accessGranted)
      .reduce((result, log) => {
        const hour = new Date(log.checkedAt).getHours();
        result[hour] = (result[hour] || 0) + 1;
        return result;
      }, {});

    return Array.from({ length: 17 }, (_, index) => {
      const hour = index + 5;
      return { hour, value: totals[hour] || 0 };
    });
  }, [attendanceLogs]);

  const topHour = peakHours.reduce(
    (best, item) => (item.value > best.value ? item : best),
    { hour: 0, value: 0 },
  );
  const totalPaidRevenue = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const averageTicket = paidPayments.length ? totalPaidRevenue / paidPayments.length : 0;
  const maxMovement = Math.max(...memberMovement.flatMap((item) => [item.joins, item.exits]), 1);
  const maxAttendance = Math.max(...peakHours.map((item) => item.value), 1);

  const insights = [
    membershipMetrics.churn > 20
      ? `La tasa de vencimiento es ${membershipMetrics.churn.toFixed(1)}%. Conviene activar una campana de renovacion.`
      : `La retencion actual es ${membershipMetrics.retention.toFixed(1)}%, dentro de un rango saludable para la base disponible.`,
    revenueByPlan[0]?.value
      ? `${revenueByPlan[0].label} lidera los ingresos registrados con ${money.format(revenueByPlan[0].value)}.`
      : "Aun no hay pagos suficientes para identificar el plan con mayor ingreso.",
    topHour.value
      ? `La mayor afluencia se concentra alrededor de las ${String(topHour.hour).padStart(2, "0")}:00.`
      : "Aun no hay suficientes entradas para detectar una hora pico.",
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Rendimiento del negocio</h2>
          <p className="text-sm text-slate-500">Indicadores derivados de clientes, pagos y registros de acceso.</p>
        </div>
        <select
          value={period}
          onChange={(event) => setPeriod(Number(event.target.value))}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
        >
          <option value={6}>Ultimos 6 meses</option>
          <option value={12}>Ultimos 12 meses</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Retencion estimada" value={`${membershipMetrics.retention.toFixed(1)}%`} detail={`${membershipMetrics.active} membresias vigentes`} />
        <KpiCard label="Churn estimado" value={`${membershipMetrics.churn.toFixed(1)}%`} detail={`${membershipMetrics.expired} membresias vencidas`} tone="rose" />
        <KpiCard label="Ticket promedio" value={compactMoney.format(averageTicket)} detail={`${paidPayments.length} pagos analizados`} tone="violet" />
        <KpiCard label="Hora pico" value={topHour.value ? `${String(topHour.hour).padStart(2, "0")}:00` : "-"} detail={`${topHour.value} entradas registradas`} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-bold">Altas vs. vencimientos</h2>
            <p className="text-sm text-slate-500">Movimiento mensual de la base de miembros.</p>
          </div>
          <div className="mt-6 flex h-64 items-end gap-3 border-b border-slate-200 px-2 dark:border-slate-700">
            {memberMovement.map((item) => (
              <div key={item.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="flex h-[85%] items-end justify-center gap-1.5">
                  <div
                    className="w-1/3 rounded-t-lg bg-emerald-500"
                    style={{ height: `${Math.max((item.joins / maxMovement) * 100, item.joins ? 8 : 1)}%` }}
                    title={`${item.joins} altas`}
                  />
                  <div
                    className="w-1/3 rounded-t-lg bg-rose-400"
                    style={{ height: `${Math.max((item.exits / maxMovement) * 100, item.exits ? 8 : 1)}%` }}
                    title={`${item.exits} vencimientos`}
                  />
                </div>
                <p className="py-3 text-center text-xs font-semibold capitalize text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-5 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-500" /> Altas</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-rose-400" /> Vencimientos</span>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Ingresos por plan</h2>
          <p className="text-sm text-slate-500">Distribucion de pagos confirmados.</p>
          <div className="mt-6">
            <HorizontalBars data={revenueByPlan} valueFormatter={(value) => compactMoney.format(value)} />
          </div>
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Ingresos analizados</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-200">{money.format(totalPaidRevenue)}</p>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Horas de mayor afluencia</h2>
          <p className="text-sm text-slate-500">Entradas permitidas agrupadas por hora.</p>
          <div className="mt-6 flex h-56 items-end gap-1.5">
            {peakHours.map((item) => (
              <div key={item.hour} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div
                  className={`mx-auto w-full max-w-8 rounded-t-md ${item.hour === topHour.hour && item.value ? "bg-violet-500" : "bg-sky-300 dark:bg-sky-700"}`}
                  style={{ height: `${Math.max((item.value / maxAttendance) * 100, item.value ? 8 : 2)}%` }}
                  title={`${item.value} entradas a las ${item.hour}:00`}
                />
                <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
                  {item.hour % 2 === 0 ? item.hour : ""}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Ingresos por medio de pago</h2>
          <p className="text-sm text-slate-500">Preferencias de recaudo en pagos confirmados.</p>
          <div className="mt-6">
            <HorizontalBars
              data={revenueByMethod}
              valueFormatter={(value) => money.format(value)}
              color="bg-violet-500"
            />
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200/80 bg-slate-950 p-5 text-white dark:border-slate-800">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Lecturas recomendadas</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {insights.map((insight, index) => (
            <div key={insight} className="rounded-xl bg-white/5 p-4">
              <p className="text-xs font-bold text-emerald-300">0{index + 1}</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{insight}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Retencion y churn son estimaciones basadas en el estado actual de las membresias; el backend debera registrar cancelaciones explicitas.
        </p>
      </article>
    </section>
  );
}
