import { useMemo, useState } from "react";
import { COUNTRY_OPTIONS, getCitiesForCountry } from "../locations.js";
import { STRENGTH_STYLES, evaluatePassword } from "../passwordStrength.js";
import SearchableSelect from "./SearchableSelect.jsx";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

const initialForm = {
  gymName: "",
  country: "",
  city: "",
  ownerName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  subscriptionPlan: "trial",
  acceptTerms: false,
};

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

function CheckIcon({ ok }) {
  return ok ? (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export default function GymRegistrationForm({ onRegister, onShowLogin }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const cityOptions = useMemo(() => getCitiesForCountry(form.country), [form.country]);
  const strength = useMemo(() => evaluatePassword(form.password), [form.password]);

  const confirmTouched = form.confirmPassword.length > 0;
  const passwordsMatch = form.password === form.confirmPassword;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  // Cambiar de pais invalida la ciudad elegida: "Cordoba" existe en Argentina y en Espana, y
  // dejar la anterior seleccionada guardaria una combinacion que no existe.
  function updateCountry(country) {
    setForm((current) => ({ ...current, country, city: "" }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.country || !form.city) {
      setError("Selecciona el pais y la ciudad del gimnasio.");
      return;
    }

    if (!strength.isValid) {
      setError(
        strength.isCommon
          ? "Esa contrasena es demasiado comun. Elige una menos predecible."
          : "La contrasena no cumple los requisitos de seguridad.",
      );
      return;
    }

    if (!passwordsMatch) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    const result = await onRegister(form);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
    }
  }

  const strengthStyle = STRENGTH_STYLES[strength.score];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Nuevo gimnasio</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight">Crea tu espacio de trabajo</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        El primer usuario quedara registrado como propietario del gimnasio.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nombre del gimnasio">
              <input
                className={inputClass}
                value={form.gymName}
                onChange={(event) => updateField("gymName", event.target.value)}
                placeholder="Titan Fitness"
                required
              />
            </Field>
          </div>

          <Field label="Pais">
            <SearchableSelect
              id="pais"
              options={COUNTRY_OPTIONS}
              value={form.country}
              onChange={updateCountry}
              placeholder="Busca tu pais"
              emptyMessage="Ningun pais coincide"
              required
            />
          </Field>

          <Field label="Ciudad">
            <SearchableSelect
              id="ciudad"
              options={cityOptions}
              value={form.city}
              onChange={(city) => updateField("city", city)}
              placeholder="Busca tu ciudad"
              emptyMessage="Ninguna ciudad coincide"
              disabled={!form.country}
              disabledMessage="Elige primero un pais"
              required
            />
          </Field>

          <Field label="Nombre del propietario">
            <input
              className={inputClass}
              value={form.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
              placeholder="Nombre completo"
              required
            />
          </Field>

          <Field label="Telefono">
            <input
              className={inputClass}
              type="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+57 300 000 0000"
              required
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Correo del propietario">
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="propietario@gimnasio.com"
                required
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Contrasena">
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Crea una contrasena segura"
                  aria-describedby="requisitos-contrasena"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  className="absolute right-3 top-1/2 mt-[3px] -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4.5 9 7a11 11 0 01-2.4 3.4M6.5 6.6C4.2 8 3 10.2 3 12c0 2.5 4 7 9 7a9.6 9.6 0 003.6-.7" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z" />
                      <circle cx="12" cy="12" r="2.6" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            {form.password ? (
              <div className="mt-2.5" aria-live="polite">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthStyle.bar}`}
                      style={{ width: strengthStyle.width }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${strengthStyle.text}`}>{strength.label}</span>
                </div>
                {strength.isCommon ? (
                  <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                    Esta contrasena aparece en listas conocidas. Elige otra.
                  </p>
                ) : null}
              </div>
            ) : null}

            <ul id="requisitos-contrasena" className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {strength.rules.map((rule) => (
                <li
                  key={rule.id}
                  className={`flex items-center gap-2 text-xs transition ${
                    rule.passed ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <CheckIcon ok={rule.passed} />
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-2">
            <Field label="Confirmar contrasena">
              <input
                className={`${inputClass} ${
                  confirmTouched
                    ? passwordsMatch
                      ? "border-emerald-400 focus:border-emerald-500 dark:border-emerald-700"
                      : "border-rose-400 focus:border-rose-500 dark:border-rose-800"
                    : ""
                }`}
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                placeholder="Repite la contrasena"
                required
              />
            </Field>

            {confirmTouched ? (
              <p
                aria-live="polite"
                className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
                  passwordsMatch ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {passwordsMatch ? (
                  <>
                    <CheckIcon ok />
                    Las contrasenas coinciden
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                    Las contrasenas no coinciden
                  </>
                )}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <Field label="Plan inicial">
              <select
                className={inputClass}
                value={form.subscriptionPlan}
                onChange={(event) => updateField("subscriptionPlan", event.target.value)}
              >
                <option value="trial">Prueba gratuita de 14 dias</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
              </select>
            </Field>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.acceptTerms}
            onChange={(event) => updateField("acceptTerms", event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            required
          />
          <span>Acepto los terminos del servicio y el tratamiento de datos.</span>
        </label>

        {error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creando gimnasio..." : "Registrar gimnasio"}
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
