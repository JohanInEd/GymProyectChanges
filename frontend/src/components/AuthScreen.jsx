import { useState } from "react";
import { getRoleLabel } from "../auth.js";
import GymRegistrationForm from "./GymRegistrationForm.jsx";
import InviteCodeGate from "./InviteCodeGate.jsx";

export default function AuthScreen({ users, onLogin, onRegisterGym }) {
  const hasInviteCodeInUrl = new URLSearchParams(window.location.search).has("code");
  const [mode, setMode] = useState(hasInviteCodeInUrl ? "code" : "login");
  const [inviteCode, setInviteCode] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const result = onLogin(form.email.trim().toLowerCase(), form.password);

    if (!result.ok) {
      setError(result.message);
    }
  }

  function useDemo(user) {
    setForm({ email: user.email, password: user.password });
    setError("");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-float-slow rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] animate-float rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-72 w-72 animate-float rounded-full bg-emerald-400/10 blur-3xl [animation-delay:-4s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className={`relative grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr] ${mode === "register" ? "max-w-6xl" : "max-w-5xl"}`}>
        <section className="hidden flex-col justify-between bg-gradient-to-br from-emerald-500 to-emerald-700 p-10 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M6 7v10M3.5 9.5v5M18 7v10M20.5 9.5v5M6 12h12" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold">GymFlow</p>
              <p className="text-sm text-emerald-100">Management suite</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100">Un solo lugar</p>
            <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight">Tu gimnasio, organizado y siempre bajo control.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-emerald-50/80">
              Gestiona miembros, accesos, clases, finanzas y operaciones con permisos adecuados para cada equipo.
            </p>
          </div>

          <p className="text-xs text-emerald-100/70">Demo local. La autenticacion productiva requiere el backend y contrasenas cifradas.</p>
        </section>

        <section className="max-h-[calc(100vh-5rem)] overflow-y-auto bg-white p-6 text-slate-950 sm:p-10 dark:bg-slate-900 dark:text-white">
          <div className="lg:hidden">
            <p className="text-xl font-bold text-emerald-600">GymFlow</p>
          </div>
          {mode === "code" ? (
            <InviteCodeGate
              onValidated={(code) => {
                setInviteCode(code);
                setMode("register");
              }}
              onShowLogin={() => setMode("login")}
            />
          ) : mode === "register" ? (
            <GymRegistrationForm
              onRegister={(form) => onRegisterGym(form, inviteCode)}
              onShowLogin={() => setMode("login")}
            />
          ) : (
            <>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 lg:mt-0">Acceso seguro</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Bienvenido de nuevo</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ingresa con una cuenta habilitada para continuar.</p>

              <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correo</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950"
                placeholder="usuario@gimnasio.com"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contrasena</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Tu contrasena"
                required
              />
            </label>

            {error ? (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </p>
            ) : null}

            <button type="submit" className="shine-btn h-12 w-full rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/30 active:translate-y-0">
              Iniciar sesion
            </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                Tu gimnasio aun no usa GymFlow?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("code");
                    setError("");
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Registrar gimnasio
                </button>
              </p>

              <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Cuentas demo</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {users.filter((user) => user.active && user.isDemo).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => useDemo(user)}
                  className="rounded-xl border border-slate-200 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-500/10 active:translate-y-0 dark:border-slate-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20"
                >
                  <span className="block text-sm font-semibold">{user.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(user.role)}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">Selecciona una cuenta y luego inicia sesion. Contrasena demo: Demo123!</p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
