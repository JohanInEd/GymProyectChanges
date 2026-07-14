import { useState } from "react";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

const initialForm = {
  gymName: "",
  city: "",
  ownerName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  subscriptionPlan: "trial",
  acceptTerms: false,
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

export default function GymRegistrationForm({ onRegister, onShowLogin }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function submit(event) {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    const result = onRegister(form);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
    }
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Nuevo gimnasio</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight">Crea tu espacio de trabajo</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        El primer usuario quedara registrado como propietario del gimnasio.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del gimnasio">
            <input
              className={inputClass}
              value={form.gymName}
              onChange={(event) => updateField("gymName", event.target.value)}
              placeholder="Titan Fitness"
              required
            />
          </Field>

          <Field label="Ciudad">
            <input
              className={inputClass}
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              placeholder="Bogota"
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

          <Field label="Contrasena">
            <input
              className={inputClass}
              type="password"
              minLength="8"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Minimo 8 caracteres"
              required
            />
          </Field>

          <Field label="Confirmar contrasena">
            <input
              className={inputClass}
              type="password"
              minLength="8"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder="Repite la contrasena"
              required
            />
          </Field>

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

      <p className="mt-4 text-center text-xs text-slate-400">
        Demo local: la verificacion de correo y la aprobacion se simulan hasta conectar el backend.
      </p>
    </div>
  );
}
