import { useEffect, useRef, useState } from "react";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sept", "Oct", "Nov", "Dic"];
const WEEKDAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const YEARS_PER_PAGE = 12;

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

function getYearPageStart(year) {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 5.25h13.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z" />
    </svg>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ChevronLeftIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function formatDisplayDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

export default function BirthDatePicker({ value, onChange, max }) {
  const containerRef = useRef(null);
  const selectedDate = parseDateValue(value);
  const maxDate = parseDateValue(max);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("days");
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate || maxDate || new Date());
  const [yearPageStart, setYearPageStart] = useState(() =>
    getYearPageStart((selectedDate || maxDate || new Date()).getFullYear()),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setView("days");
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setView("days");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function openPicker() {
    const reference = selectedDate || maxDate || new Date();
    setVisibleMonth(reference);
    setYearPageStart(getYearPageStart(reference.getFullYear()));
    setView("days");
    setIsOpen(true);
  }

  function togglePicker() {
    if (isOpen) {
      setIsOpen(false);
      setView("days");
    } else {
      openPicker();
    }
  }

  function handleSelectDay(date) {
    onChange(toDateKey(date));
    setIsOpen(false);
    setView("days");
  }

  function handleSelectMonth(monthIndex) {
    setVisibleMonth((current) => new Date(current.getFullYear(), monthIndex, 1));
    setView("days");
  }

  function handleSelectYear(year) {
    setVisibleMonth((current) => new Date(year, current.getMonth(), 1));
    setView("days");
  }

  const calendarDays = getCalendarDays(visibleMonth);
  const monthLabel = new Intl.DateTimeFormat("es-CO", { month: "long" }).format(visibleMonth);

  return (
    <div className="relative" ref={containerRef}>
      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-gray-400 dark:text-gray-500">
        <CalendarIcon />
      </span>
      <button
        type="button"
        onClick={togglePicker}
        className={`h-10 w-full rounded-md border border-gray-300 !bg-gray-100 pl-9 pr-3 text-left text-sm outline-none transition focus:border-gray-900 focus:!bg-white focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:!bg-gray-800 dark:focus:border-gray-200 dark:focus:!bg-gray-900 dark:focus:ring-gray-700 ${
          selectedDate
            ? "text-gray-950 shadow-[0_0_0_1.5px_rgba(16,185,129,0.55),0_8px_18px_-8px_rgba(16,185,129,0.4)] dark:text-gray-50 dark:shadow-[0_0_0_1.5px_rgba(52,211,153,0.45),0_8px_18px_-8px_rgba(16,185,129,0.35)]"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {selectedDate ? formatDisplayDate(selectedDate) : "dd/mm/aaaa"}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {view === "days" ? (
            <>
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => setView("months")}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold capitalize text-gray-800 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  {monthLabel}
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                    aria-label="Mes anterior"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                    aria-label="Mes siguiente"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setYearPageStart(getYearPageStart(visibleMonth.getFullYear()));
                    setView("years");
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  {visibleMonth.getFullYear()}
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                {WEEKDAY_LABELS.map((day, index) => (
                  <div key={`${day}-${index}`}>{day}</div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarDays.map((date) => {
                  const key = toDateKey(date);
                  const isDisabled = Boolean(maxDate) && date > maxDate;
                  const isSelected = Boolean(selectedDate) && key === toDateKey(selectedDate);
                  const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                  const isToday = key === toDateKey(new Date());

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectDay(date)}
                      className={`flex h-8 items-center justify-center rounded-md text-xs font-medium transition ${
                        isSelected
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                          : isDisabled
                            ? "cursor-not-allowed text-gray-300 dark:text-gray-700"
                            : "text-gray-700 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/40"
                      } ${!isCurrentMonth && !isSelected ? "opacity-40" : ""} ${
                        isToday && !isSelected ? "ring-1 ring-inset ring-emerald-400" : ""
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {view === "months" ? (
            <>
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setView("days")}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  {visibleMonth.getFullYear()}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {MONTH_LABELS.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSelectMonth(index)}
                    className={`rounded-md px-2 py-2 text-xs font-medium transition ${
                      index === visibleMonth.getMonth()
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : "text-gray-700 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {view === "years" ? (
            <>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setYearPageStart((current) => current - YEARS_PER_PAGE)}
                  aria-label="Decada anterior"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {yearPageStart} - {yearPageStart + YEARS_PER_PAGE - 1}
                </span>
                <button
                  type="button"
                  onClick={() => setYearPageStart((current) => current + YEARS_PER_PAGE)}
                  aria-label="Decada siguiente"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {Array.from({ length: YEARS_PER_PAGE }, (_, index) => yearPageStart + index).map((year) => {
                  const isDisabled = Boolean(maxDate) && year > maxDate.getFullYear();
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectYear(year)}
                      className={`rounded-md px-2 py-2 text-xs font-medium transition ${
                        year === visibleMonth.getFullYear()
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                          : isDisabled
                            ? "cursor-not-allowed text-gray-300 dark:text-gray-700"
                            : "text-gray-700 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
