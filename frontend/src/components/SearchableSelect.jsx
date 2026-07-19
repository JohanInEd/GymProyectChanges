import { useEffect, useMemo, useRef, useState } from "react";

// Quita tildes para que "Bogota" encuentre "Bogotá" y viceversa: los usuarios escriben de las dos
// formas y nadie deberia quedarse sin resultados por una tilde.
function normalize(text) {
  // \p{Diacritic} sobre la forma NFD quita los acentos y deja el codigo fuente en ASCII puro,
  // a diferencia de un rango de caracteres combinantes escritos literalmente (invisibles y fragiles).
  return (text || "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecciona una opcion",
  emptyMessage = "Sin resultados",
  disabled = false,
  disabledMessage = "",
  id,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    // Las coincidencias por prefijo van primero: al escribir "san" interesa mas "San Jose" que
    // "Bucaramanga", aunque las dos contengan esas letras.
    const starts = options.filter((o) => normalize(o.label).startsWith(q));
    const contains = options.filter(
      (o) => !normalize(o.label).startsWith(q) && normalize(o.label).includes(q),
    );
    return [...starts, ...contains];
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    setHighlighted(0);
  }, [query, open]);

  // Mantiene visible la opcion resaltada al navegar con el teclado.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const node = listRef.current.children[highlighted];
    if (node) node.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  function choose(option) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(event) {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlighted((current) => {
        if (filtered.length === 0) return 0;
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;
        return (next + filtered.length) % filtered.length;
      });
      return;
    }

    if (event.key === "Enter") {
      if (open && filtered[highlighted]) {
        event.preventDefault();
        choose(filtered[highlighted]);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  const selected = options.find((option) => option.value === value);
  const shown = open ? query : selected?.label ?? "";

  const base =
    "mt-1.5 flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-3.5 text-sm text-slate-950 transition dark:bg-slate-950 dark:text-white";
  const state = disabled
    ? "cursor-not-allowed border-slate-200 opacity-60 dark:border-slate-800"
    : open
      ? "border-emerald-500 ring-4 ring-emerald-500/10 dark:border-emerald-500"
      : "border-slate-200 dark:border-slate-700";

  return (
    <div ref={containerRef} className="relative">
      <div className={`${base} ${state}`}>
        {selected?.icon && !open ? <span aria-hidden="true">{selected.icon}</span> : null}
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={id ? `${id}-listbox` : undefined}
          autoComplete="off"
          disabled={disabled}
          value={shown}
          placeholder={disabled && disabledMessage ? disabledMessage : placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-full w-full bg-transparent outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        {/* Espeja el valor para que la validacion nativa del formulario siga funcionando. */}
        {required ? (
          <input
            tabIndex={-1}
            aria-hidden="true"
            required
            value={value || ""}
            onChange={() => {}}
            className="pointer-events-none absolute bottom-0 left-4 h-0 w-0 opacity-0"
          />
        ) : null}
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && !disabled ? (
        <ul
          ref={listRef}
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
        >
          {filtered.length === 0 ? (
            <li className="px-3.5 py-2.5 text-sm text-slate-400">{emptyMessage}</li>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlighted;
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => choose(option)}
                    className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm transition ${
                      isHighlighted
                        ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {option.icon ? <span aria-hidden="true">{option.icon}</span> : null}
                    <span className="flex-1">{option.label}</span>
                    {isSelected ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
