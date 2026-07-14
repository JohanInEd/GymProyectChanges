import { useEffect, useState } from "react";

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parseDate(value));
}

function getCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getMonthStart(value) {
  const date = parseDate(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const inputClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-gray-200 dark:focus:ring-gray-700";

export default function MembershipCalendar({ member, onUpdateMembership }) {
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(member?.startDate || new Date().toISOString().slice(0, 10)));

  useEffect(() => {
    if (member?.startDate) {
      setVisibleMonth(getMonthStart(member.startDate));
    }
  }, [member?.memberId, member?.startDate]);

  if (!member) {
    return null;
  }

  const start = parseDate(member.startDate);
  const end = parseDate(member.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);
  const startKey = member.startDate;
  const endKey = member.endDate;
  const calendarDays = getCalendarDays(visibleMonth);
  const totalDays = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
  const elapsedDays = clamp(Math.ceil((today - start) / 86400000), 0, totalDays);
  const remainingDays = Math.max(0, member.daysToExpire);
  const progress = clamp((elapsedDays / totalDays) * 100, 0, 100);
  const monthLabel = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  function handleDateChange(field, value) {
    if (!value || !onUpdateMembership) {
      return;
    }

    let startDate = field === "startDate" ? value : member.startDate;
    let endDate = field === "endDate" ? value : member.endDate;

    if (parseDate(endDate) < parseDate(startDate)) {
      if (field === "startDate") {
        endDate = startDate;
      } else {
        startDate = endDate;
      }
    }

    onUpdateMembership(member.memberId, { startDate, endDate });
    setVisibleMonth(getMonthStart(value));
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-start sm:justify-between dark:border-gray-700">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Membresia</p>
          <h3 className="text-lg font-semibold text-gray-950 dark:text-white">{member.planName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(member.startDate)} - {formatDate(member.endDate)}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-500 px-4 py-3 text-center text-white shadow-md shadow-emerald-500/20">
          <p className="text-2xl font-semibold">{remainingDays}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-50">dias restantes</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Inicio</span>
          <input
            className={inputClass}
            type="date"
            value={member.startDate}
            max={member.endDate}
            onChange={(event) => handleDateChange("startDate", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Fin</span>
          <input
            className={inputClass}
            type="date"
            value={member.endDate}
            min={member.startDate}
            onChange={(event) => handleDateChange("endDate", event.target.value)}
          />
        </label>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">{totalDays} dias de suscripcion</span>
          <span className="text-gray-500 dark:text-gray-400">{Math.round(progress)}% usado</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-full rounded-full bg-teal-500 dark:bg-teal-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Anterior
        </button>
        <span className="text-sm font-semibold capitalize text-gray-800 dark:text-gray-100">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Siguiente
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
        {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
          <div key={`${day}-${index}`} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const key = toDateKey(date);
          const isInMonth = date.getMonth() === visibleMonth.getMonth();
          const isInRange = date >= start && date <= end;
          const isUsed = isInRange && date < today;
          const isStart = key === startKey;
          const isEnd = key === endKey;
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={`flex h-9 items-center justify-center rounded-md text-xs font-semibold ${
                isInRange
                  ? isUsed
                    ? "bg-teal-100 text-teal-900 dark:bg-teal-950/70 dark:text-teal-100"
                    : "bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-100"
                  : "text-gray-400 dark:text-gray-500"
              } ${!isInMonth ? "opacity-50" : ""} ${isStart ? "bg-green-100 text-green-800 dark:bg-green-950/70 dark:text-green-100" : ""} ${
                isEnd ? "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-100" : ""
              } ${isToday ? "ring-2 ring-gray-950 dark:ring-white" : ""}`}
              title={isStart ? "Inicio" : isEnd ? "Fin" : isToday ? "Hoy" : undefined}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-teal-100 ring-1 ring-teal-200 dark:bg-teal-950 dark:ring-teal-700" />
          Usado
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-sky-100 ring-1 ring-sky-200 dark:bg-sky-950 dark:ring-sky-700" />
          Pendiente
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-green-100 ring-1 ring-green-200" />
          Inicio
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-200" />
          Fin
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-white ring-2 ring-gray-950 dark:bg-gray-900 dark:ring-white" />
          Hoy
        </span>
      </div>
    </div>
  );
}
