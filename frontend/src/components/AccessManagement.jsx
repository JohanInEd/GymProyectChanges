import { useState } from "react";
import { getRoleLabel, roleConfig } from "../auth.js";

const initialForm = {
  name: "",
  email: "",
  role: "reception",
  password: "Demo123!",
};

export default function AccessManagement({ users, currentUser, onCreateUser, onToggleUser }) {
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState("");

  function submit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      return;
    }

    const result = onCreateUser({
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
    });

    setNotice(result.message);
    if (result.ok) {
      setForm(initialForm);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(roleConfig).map(([role, config]) => (
          <article key={role} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">{config.label}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{config.description}</p>
            <p className="mt-4 text-2xl font-bold">{users.filter((user) => user.role === role && user.active).length}</p>
            <p className="text-xs text-slate-400">usuarios activos</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">Crear usuario</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Asigna un rol para limitar modulos y acciones.</p>

          <div className="mt-5 space-y-4">
            {[
              ["name", "Nombre", "Nombre completo", "text"],
              ["email", "Correo", "usuario@gimnasio.com", "email"],
              ["password", "Contrasena temporal", "Contrasena", "text"],
            ].map(([field, label, placeholder, type]) => (
              <label key={field} className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                <input
                  type={type}
                  value={form[field]}
                  onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder={placeholder}
                  required
                />
              </label>
            ))}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rol</span>
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                {Object.entries(roleConfig).map(([role, config]) => (
                  <option key={role} value={role}>{config.label}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{roleConfig[form.role].description}</p>
            </label>
          </div>

          {notice ? <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">{notice}</p> : null}

          <button type="submit" className="mt-5 h-11 w-full rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600">
            Crear acceso
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-lg font-bold">Usuarios y permisos</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Los cambios de estado se aplican al siguiente inicio de sesion.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-950/60">
                <tr>
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Permisos</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="max-w-xs px-5 py-4 text-xs text-slate-500">
                      {roleConfig[user.role].permissions.join(", ")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold ${user.active ? "text-emerald-600" : "text-rose-600"}`}>
                        {user.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={user.id === currentUser.id}
                        onClick={() => onToggleUser(user.id)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
                      >
                        {user.active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
