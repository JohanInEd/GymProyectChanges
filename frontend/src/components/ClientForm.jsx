import { useEffect, useState } from "react";
import BirthDatePicker from "./BirthDatePicker.jsx";

const initialForm = {
  fullName: "",
  gender: "female",
  birthDate: "",
  weightKg: "",
  heightCm: "",
  phone: "",
  email: "",
  chestCm: "",
  armCm: "",
  waistCm: "",
  hipCm: "",
  legCm: "",
  planId: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function calculateAge(birthDateValue) {
  if (!birthDateValue) {
    return null;
  }

  const [year, month, day] = birthDateValue.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function Field({ label, children }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium uppercase text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({ title, subtitle, icon }) {
  return (
    <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
      <h3 className="flex items-center gap-2.5 text-base font-bold uppercase text-emerald-600 dark:text-emerald-400">
        {icon}
        {title}
      </h3>
      {subtitle ? <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
    </div>
  );
}

function SectionIcon({ children }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
      {children}
    </span>
  );
}

function UserPlusIcon() {
  return (
    <SectionIcon>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v6m3-3h-6m-3.75-2.25a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.32 12.32 0 0 1 9.375 21c-2.331 0-4.512-.645-6.375-1.766Z" />
      </svg>
    </SectionIcon>
  );
}

function PulseIcon() {
  return (
    <SectionIcon>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3.5l2-6.5L12 18l2.5-6H21" />
      </svg>
    </SectionIcon>
  );
}

function IdCardIcon() {
  return (
    <SectionIcon>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75h5.25M14.25 12.75h5.25M14.25 15.75h3.75" />
        <circle cx="8.25" cy="11.25" r="1.875" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 17.25c1.15-1.75 2.65-2.625 4.5-2.625s3.35.875 4.5 2.625" />
      </svg>
    </SectionIcon>
  );
}

function getInputClass(hasValue, withIcon = false) {
  return [
    "h-10 w-full rounded-md border border-gray-300 !bg-gray-100 text-sm text-gray-950 outline-none transition",
    withIcon ? "pl-9 pr-3" : "px-3",
    "focus:border-gray-900 focus:!bg-white focus:ring-2 focus:ring-gray-200",
    "dark:border-gray-600 dark:!bg-gray-800 dark:text-gray-50 dark:focus:border-gray-200 dark:focus:!bg-gray-900 dark:focus:ring-gray-700",
    hasValue
      ? "shadow-[0_0_0_1.5px_rgba(16,185,129,0.55),0_8px_18px_-8px_rgba(16,185,129,0.4)] dark:shadow-[0_0_0_1.5px_rgba(52,211,153,0.45),0_8px_18px_-8px_rgba(16,185,129,0.35)]"
      : "",
  ].join(" ");
}

function InputIcon({ children }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
      {children}
    </span>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}


export default function ClientForm({ onCreate, onUpdate, onCancelEdit, editingMember = null, plans = [] }) {
  const [form, setForm] = useState(initialForm);
  const isEditing = Boolean(editingMember);
  const selectedPlan = plans.find((plan) => plan.id === form.planId) ?? null;
  const computedAge = calculateAge(form.birthDate);

  useEffect(() => {
    setForm((current) =>
      plans.some((plan) => plan.id === current.planId)
        ? current
        : { ...current, planId: plans[0]?.id ?? "" },
    );
  }, [plans]);

  useEffect(() => {
    if (!editingMember) {
      return;
    }

    const matchingPlan = plans.find((plan) => plan.name === editingMember.planName);

    setForm({
      fullName: editingMember.fullName || "",
      gender: editingMember.gender || "female",
      birthDate: editingMember.birthDate || "",
      weightKg: editingMember.bodyMetrics?.weightKg != null ? String(editingMember.bodyMetrics.weightKg) : "",
      heightCm: editingMember.bodyMetrics?.heightCm != null ? String(editingMember.bodyMetrics.heightCm) : "",
      phone: editingMember.phone || "",
      email: editingMember.email || "",
      chestCm: editingMember.bodyMetrics?.chestCm != null ? String(editingMember.bodyMetrics.chestCm) : "",
      armCm: editingMember.bodyMetrics?.armCm != null ? String(editingMember.bodyMetrics.armCm) : "",
      waistCm: editingMember.bodyMetrics?.waistCm != null ? String(editingMember.bodyMetrics.waistCm) : "",
      hipCm: editingMember.bodyMetrics?.hipCm != null ? String(editingMember.bodyMetrics.hipCm) : "",
      legCm: editingMember.bodyMetrics?.legCm != null ? String(editingMember.bodyMetrics.legCm) : "",
      planId: matchingPlan?.id ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingMember?.memberId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.fullName.trim() || !selectedPlan) {
      return;
    }

    if (isEditing) {
      onUpdate({
        memberId: editingMember.memberId,
        fullName: form.fullName.trim(),
        email: form.email.trim() ? form.email.trim().toLowerCase() : "",
        phone: form.phone.trim(),
        gender: form.gender,
        birthDate: form.birthDate || null,
        age: calculateAge(form.birthDate),
        bodyMetrics: {
          heightCm: Number(form.heightCm) || null,
          weightKg: Number(form.weightKg) || null,
          chestCm: Number(form.chestCm) || null,
          armCm: Number(form.armCm) || null,
          waistCm: Number(form.waistCm) || null,
          hipCm: Number(form.hipCm) || null,
          legCm: Number(form.legCm) || null,
        },
      });
      setForm({ ...initialForm, planId: selectedPlan.id });
      return;
    }

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (selectedPlan.durationDays || 30));

    onCreate({
      memberId: crypto.randomUUID(),
      fullName: form.fullName.trim(),
      email: form.email.trim() ? form.email.trim().toLowerCase() : "",
      phone: form.phone.trim(),
      gender: form.gender,
      birthDate: form.birthDate || null,
      age: calculateAge(form.birthDate),
      planName: selectedPlan.name,
      subscriptionValue: selectedPlan.price || 0,
      startDate: today.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      daysToExpire: selectedPlan.durationDays || 30,
      status: "Active",
      visualColor: "Green",
      tailwindClass: "bg-green-100 text-green-800",
      bodyMetrics: {
        heightCm: Number(form.heightCm) || null,
        weightKg: Number(form.weightKg) || null,
        chestCm: Number(form.chestCm) || null,
        armCm: Number(form.armCm) || null,
        waistCm: Number(form.waistCm) || null,
        hipCm: Number(form.hipCm) || null,
        legCm: Number(form.legCm) || null,
      },
    });

    setForm({ ...initialForm, planId: selectedPlan.id });
  }

  function handleCancel() {
    onCancelEdit?.();
    setForm((current) => ({ ...initialForm, planId: current.planId }));
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 border-l-4 border-l-emerald-500 bg-white p-5 shadow-lg shadow-emerald-500/10 dark:border-slate-800 dark:border-l-emerald-400 dark:bg-slate-900 dark:shadow-emerald-900/30">
      <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
        <h2 className="flex items-center gap-2.5 text-base font-bold uppercase text-emerald-600 dark:text-emerald-400">
          <UserPlusIcon />
          {isEditing ? "Editar cliente" : "Crear cliente"}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isEditing ? `Actualiza los datos de ${editingMember.fullName}.` : "Datos basicos."}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nombre">
            <div className="relative">
              <InputIcon>
                <UserIcon />
              </InputIcon>
              <input
                className={getInputClass(form.fullName !== "", true)}
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="Nombre completo"
                required
              />
            </div>
          </Field>

          <Field label="Genero">
            <select
              className={getInputClass(form.gender !== "")}
              value={form.gender}
              onChange={(event) => updateField("gender", event.target.value)}
            >
              <option value="female">Mujer</option>
              <option value="male">Hombre</option>
            </select>
          </Field>

          <Field label="Fecha de nacimiento">
            <BirthDatePicker
              value={form.birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(value) => updateField("birthDate", value)}
            />
          </Field>

          <Field label="Edad">
            <div
              className={`flex h-10 w-full items-center rounded-md border border-gray-300 bg-gray-100 px-3 text-sm dark:border-gray-600 dark:bg-gray-800 ${
                computedAge != null ? "text-gray-950 dark:text-gray-50" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {computedAge != null ? `${computedAge} años` : "Se calcula sola"}
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Peso kg">
            <input
              className={getInputClass(form.weightKg !== "")}
              type="number"
              min="0"
              step="0.1"
              value={form.weightKg}
              onChange={(event) => updateField("weightKg", event.target.value)}
              placeholder="68.5"
            />
          </Field>

          <Field label="Altura cm">
            <input
              className={getInputClass(form.heightCm !== "")}
              type="number"
              min="0"
              value={form.heightCm}
              onChange={(event) => updateField("heightCm", event.target.value)}
              placeholder="170"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefono">
            <div className="relative">
              <InputIcon>
                <PhoneIcon />
              </InputIcon>
              <input
                className={getInputClass(form.phone !== "", true)}
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+57 300 000 0000"
              />
            </div>
          </Field>

          <Field label="Correo (opcional)">
            <div className="relative">
              <InputIcon>
                <MailIcon />
              </InputIcon>
              <input
                className={getInputClass(form.email !== "", true)}
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="cliente@gym.com"
              />
            </div>
          </Field>
        </div>
      </div>

      <SectionHeading title="Biometria" subtitle="Medidas corporales del cliente." icon={<PulseIcon />} />
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="Pecho cm">
          <input
            className={getInputClass(form.chestCm !== "")}
            type="number"
            min="0"
            value={form.chestCm}
            onChange={(event) => updateField("chestCm", event.target.value)}
            placeholder="96"
          />
        </Field>

        <Field label="Brazo cm">
          <input
            className={getInputClass(form.armCm !== "")}
            type="number"
            min="0"
            value={form.armCm}
            onChange={(event) => updateField("armCm", event.target.value)}
            placeholder="32"
          />
        </Field>

        <Field label="Cintura cm">
          <input
            className={getInputClass(form.waistCm !== "")}
            type="number"
            min="0"
            value={form.waistCm}
            onChange={(event) => updateField("waistCm", event.target.value)}
            placeholder="78"
          />
        </Field>

        <Field label="Cadera cm">
          <input
            className={getInputClass(form.hipCm !== "")}
            type="number"
            min="0"
            value={form.hipCm}
            onChange={(event) => updateField("hipCm", event.target.value)}
            placeholder="98"
          />
        </Field>

        <Field label="Pierna cm">
          <input
            className={getInputClass(form.legCm !== "")}
            type="number"
            min="0"
            value={form.legCm}
            onChange={(event) => updateField("legCm", event.target.value)}
            placeholder="55"
          />
        </Field>
      </div>

      <SectionHeading
        title="Membresia"
        subtitle={isEditing ? "El plan no se puede modificar desde aqui." : "Selecciona el plan del cliente."}
        icon={<IdCardIcon />}
      />
      {plans.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          No hay planes registrados. Crea uno en Configuracion para poder asignarlo aqui.
        </p>
      ) : (
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {plans.map((plan) => {
            const isSelected = form.planId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                disabled={isEditing}
                onClick={() => updateField("planId", plan.id)}
                className={`h-10 rounded-full border px-4 text-sm font-medium transition ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                } ${isEditing ? "cursor-not-allowed opacity-60 hover:border-gray-300 dark:hover:border-gray-600" : ""}`}
              >
                {plan.name}
              </button>
            );
          })}
        </div>

        {selectedPlan ? (
          <div className="text-sm sm:text-right">
            <span className="block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Valor de la suscripcion
            </span>
            <span className="text-base font-semibold text-gray-950 dark:text-white">
              {formatCurrency(selectedPlan.price)}
            </span>
          </div>
        ) : null}
      </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {isEditing ? (
          <button
            type="button"
            onClick={handleCancel}
            className="h-10 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          className="shine-btn h-10 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30"
        >
          {isEditing ? "Guardar cambios" : "Finalizar registro"}
        </button>
      </div>
    </form>
  );
}
