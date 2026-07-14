import { useEffect, useState } from "react";
import { validateInviteCode } from "../inviteCodeApi.js";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

export default function InviteCodeGate({ onValidated, onShowLogin }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const codeFromUrl = new URLSearchParams(window.location.search).get("code");

    if (codeFromUrl) {
      setCode(codeFromUrl);
      checkCode(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkCode(value) {
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Ingresa el codigo de invitacion.");
      return;
    }

    setIsChecking(true);
    setError("");

    try {
      const isValid = await validateInviteCode(trimmed);

      if (isValid) {
        onValidated(trimmed);
        return;
      }

      setError("Este codigo no es valido o ya fue utilizado.");
    } catch {
      setError("No se pudo verificar el codigo. Intenta de nuevo.");
    } finally {
      setIsChecking(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    checkCode(code);
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Acceso por invitacion</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight">Ingresa tu codigo</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        El registro esta disponible solo para quienes tienen un codigo de invitacion.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Codigo de invitacion</span>
          <input
            className={`${inputClass} uppercase tracking-widest`}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError("");
            }}
            placeholder="ABC123"
            autoFocus
            required
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isChecking}
          className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking ? "Verificando..." : "Continuar"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Ya tienes una cuenta?{" "}
        <button type="button" onClick={onShowLogin} className="font-bold text-emerald-600 hover:text-emerald-700">
          Iniciar sesion
        </button>
      </p>
    </div>
  );
}
