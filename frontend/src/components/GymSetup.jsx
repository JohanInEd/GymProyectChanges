import { useEffect, useState } from "react";

const inputClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-50 dark:focus:border-gray-200 dark:focus:ring-gray-700";

const textAreaClass =
  "min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-50 dark:focus:border-gray-200 dark:focus:ring-gray-700";

const initialPlanForm = {
  id: "",
  name: "",
  price: "",
  durationDays: "30",
  maxClasses: "",
  description: "",
};

const initialClassTemplateForm = {
  id: "",
  name: "",
  coach: "",
  duration: "60",
  capacity: "12",
  room: "",
};

const featureSuggestions = [
  {
    title: "Recordatorios automaticos",
    description: "Enviar avisos antes del vencimiento por WhatsApp, correo o SMS.",
  },
  {
    title: "Control de acceso avanzado",
    description: "Conectar torniquetes, QR o tarjetas al registro de entrada.",
  },
  {
    title: "Pagos y cartera",
    description: "Ver pagos pendientes, comprobantes, abonos y recaudo por plan.",
  },
  {
    title: "Progreso del cliente",
    description: "Guardar medidas, peso, fotos y rutinas para ver evolucion mensual.",
  },
];

function Field({ label, children }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  );
}

function PencilIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4.243.707.707-4.243L16.862 4.487Z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function GymSetup({
  gymProfile,
  plans,
  classCatalog = [],
  onboarding,
  onSaveGymProfile,
  onCreatePlan,
  onDeletePlan,
  onSaveClassTemplate,
  onDeleteClassTemplate,
}) {
  const [profileForm, setProfileForm] = useState(gymProfile);
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [classTemplateForm, setClassTemplateForm] = useState(initialClassTemplateForm);
  const [classToDelete, setClassToDelete] = useState(null);

  useEffect(() => {
    if (!planToDelete && !classToDelete) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setPlanToDelete(null);
        setClassToDelete(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [planToDelete, classToDelete]);

  function editPlan(plan) {
    setPlanForm({
      id: plan.id,
      name: plan.name,
      price: String(plan.price),
      durationDays: String(plan.durationDays),
      maxClasses: plan.maxClasses === null || plan.maxClasses === undefined ? "" : String(plan.maxClasses),
      description: plan.description || "",
    });
  }

  function deletePlan(plan) {
    setPlanToDelete(plan);
  }

  function confirmDeletePlan() {
    onDeletePlan(planToDelete.id);
    if (planForm.id === planToDelete.id) {
      setPlanForm(initialPlanForm);
    }
    setPlanToDelete(null);
  }

  function editClassTemplate(template) {
    setClassTemplateForm({
      id: template.id,
      name: template.name,
      coach: template.coach,
      duration: String(template.duration),
      capacity: String(template.capacity),
      room: template.room,
    });
  }

  function confirmDeleteClassTemplate() {
    onDeleteClassTemplate(classToDelete.id);
    if (classTemplateForm.id === classToDelete.id) {
      setClassTemplateForm(initialClassTemplateForm);
    }
    setClassToDelete(null);
  }

  function updateClassTemplateField(field, value) {
    setClassTemplateForm((current) => ({ ...current, [field]: value }));
  }

  function handleClassTemplateSubmit(event) {
    event.preventDefault();

    if (
      !classTemplateForm.name.trim() ||
      !classTemplateForm.coach.trim() ||
      !classTemplateForm.room.trim() ||
      !classTemplateForm.duration ||
      !classTemplateForm.capacity
    ) {
      return;
    }

    onSaveClassTemplate({
      id: classTemplateForm.id || crypto.randomUUID(),
      name: classTemplateForm.name.trim(),
      coach: classTemplateForm.coach.trim(),
      duration: Number(classTemplateForm.duration),
      capacity: Number(classTemplateForm.capacity),
      room: classTemplateForm.room.trim(),
    });

    setClassTemplateForm(initialClassTemplateForm);
  }

  function updateProfileField(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function updatePlanField(field, value) {
    setPlanForm((current) => ({ ...current, [field]: value }));
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    if (!profileForm.gymName.trim() || !profileForm.adminName.trim() || !profileForm.adminEmail.trim()) {
      return;
    }

    onSaveGymProfile({
      ...profileForm,
      gymName: profileForm.gymName.trim(),
      adminName: profileForm.adminName.trim(),
      adminEmail: profileForm.adminEmail.trim().toLowerCase(),
      adminPhone: profileForm.adminPhone.trim(),
      city: profileForm.city.trim(),
    });
  }

  function handlePlanSubmit(event) {
    event.preventDefault();

    if (!planForm.name.trim() || !planForm.price || !planForm.durationDays) {
      return;
    }

    onCreatePlan({
      id: planForm.id || crypto.randomUUID(),
      name: planForm.name.trim(),
      price: Number(planForm.price),
      durationDays: Number(planForm.durationDays),
      maxClasses: planForm.maxClasses.trim() === "" ? 0 : Number(planForm.maxClasses),
      description: planForm.description.trim(),
    });

    setPlanForm(initialPlanForm);
  }

  return (
    <>
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex flex-col gap-3 border-b border-gray-200 pb-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-950 dark:text-white">Datos del gimnasio</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nombre comercial y usuario administrador.</p>
            </div>
            <button
              type="submit"
              className="h-10 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600"
            >
              Guardar gimnasio
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Nombre del gimnasio">
              <input
                className={inputClass}
                value={profileForm.gymName}
                onChange={(event) => updateProfileField("gymName", event.target.value)}
                placeholder="Power House Gym"
                required
              />
            </Field>

            <Field label="Ciudad">
              <input
                className={inputClass}
                value={profileForm.city}
                onChange={(event) => updateProfileField("city", event.target.value)}
                placeholder="Bogota"
              />
            </Field>

            <Field label="Nombre del usuario">
              <input
                className={inputClass}
                value={profileForm.adminName}
                onChange={(event) => updateProfileField("adminName", event.target.value)}
                placeholder="Administrador principal"
                required
              />
            </Field>

            <Field label="Correo del usuario">
              <input
                className={inputClass}
                type="email"
                value={profileForm.adminEmail}
                onChange={(event) => updateProfileField("adminEmail", event.target.value)}
                placeholder="admin@gimnasio.com"
                required
              />
            </Field>

            <Field label="Telefono">
              <input
                className={inputClass}
                value={profileForm.adminPhone}
                onChange={(event) => updateProfileField("adminPhone", event.target.value)}
                placeholder="+57 300 000 0000"
              />
            </Field>

            <Field label="Rol">
              <select
                className={inputClass}
                value={profileForm.adminRole}
                onChange={(event) => updateProfileField("adminRole", event.target.value)}
              >
                <option>Propietario</option>
                <option>Administrador</option>
                <option>Recepcion</option>
              </select>
            </Field>
          </div>
        </form>

        <form
          onSubmit={handlePlanSubmit}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex flex-col gap-3 border-b border-gray-200 pb-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-950 dark:text-white">
                {planForm.id ? "Editar plan" : "Registrar plan"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Crea planes que luego puedes asignar a clientes.</p>
            </div>
            <div className="flex gap-2">
              {planForm.id ? (
                <button
                  type="button"
                  onClick={() => setPlanForm(initialPlanForm)}
                  className="h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              ) : null}
              <button
                type="submit"
                className="h-10 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600"
              >
                {planForm.id ? "Guardar cambios" : "Agregar plan"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Nombre del plan">
              <input
                className={inputClass}
                value={planForm.name}
                onChange={(event) => updatePlanField("name", event.target.value)}
                placeholder="Mensual Plus"
                required
              />
            </Field>

            <Field label="Precio COP">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={planForm.price}
                onChange={(event) => updatePlanField("price", event.target.value)}
                placeholder="95000"
                required
              />
            </Field>

            <Field label="Duracion dias">
              <input
                className={inputClass}
                type="number"
                min="1"
                value={planForm.durationDays}
                onChange={(event) => updatePlanField("durationDays", event.target.value)}
                required
              />
            </Field>

            <Field label="Clases incluidas">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={planForm.maxClasses}
                onChange={(event) => updatePlanField("maxClasses", event.target.value)}
                placeholder="Sin clases"
              />
              <span className="block text-xs font-normal text-gray-400">Vacio o 0 = sin clases incluidas.</span>
            </Field>

            <div className="md:col-span-2 xl:col-span-4">
              <Field label="Descripcion">
                <textarea
                  className={textAreaClass}
                  value={planForm.description}
                  onChange={(event) => updatePlanField("description", event.target.value)}
                  placeholder="Acceso a zona de pesas, cardio y clases grupales."
                />
              </Field>
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">Planes registrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-900/70 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Duracion</th>
                  <th className="px-4 py-3">Clases</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {plans.map((plan) => (
                  <tr key={plan.id} className="bg-white dark:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-950 dark:text-white">{plan.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{plan.description || "Sin descripcion"}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatCurrency(plan.price)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{plan.durationDays} dias</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {plan.maxClasses === null || plan.maxClasses === undefined
                        ? "Ilimitadas"
                        : plan.maxClasses === 0
                          ? "Sin clases"
                          : plan.maxClasses}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => editPlan(plan)}
                        aria-label="Editar plan"
                        title="Editar plan"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sky-600 transition hover:bg-sky-50 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/40"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePlan(plan)}
                        aria-label="Eliminar plan"
                        title="Eliminar plan"
                        className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form
          onSubmit={handleClassTemplateSubmit}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex flex-col gap-3 border-b border-gray-200 pb-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-950 dark:text-white">
                {classTemplateForm.id ? "Editar clase" : "Registrar clase"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Las clases registradas aparecen automaticamente al programar una clase.
              </p>
            </div>
            <div className="flex gap-2">
              {classTemplateForm.id ? (
                <button
                  type="button"
                  onClick={() => setClassTemplateForm(initialClassTemplateForm)}
                  className="h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
              ) : null}
              <button
                type="submit"
                className="h-10 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600"
              >
                {classTemplateForm.id ? "Guardar cambios" : "Agregar clase"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Nombre de la clase">
              <input
                className={inputClass}
                value={classTemplateForm.name}
                onChange={(event) => updateClassTemplateField("name", event.target.value)}
                placeholder="Spinning"
                required
              />
            </Field>

            <Field label="Entrenador">
              <input
                className={inputClass}
                value={classTemplateForm.coach}
                onChange={(event) => updateClassTemplateField("coach", event.target.value)}
                placeholder="Nombre del entrenador"
                required
              />
            </Field>

            <Field label="Duracion (min)">
              <input
                className={inputClass}
                type="number"
                min="1"
                value={classTemplateForm.duration}
                onChange={(event) => updateClassTemplateField("duration", event.target.value)}
                required
              />
            </Field>

            <Field label="Capacidad">
              <input
                className={inputClass}
                type="number"
                min="1"
                value={classTemplateForm.capacity}
                onChange={(event) => updateClassTemplateField("capacity", event.target.value)}
                required
              />
            </Field>

            <div className="md:col-span-2 xl:col-span-4">
              <Field label="Salon o espacio">
                <input
                  className={inputClass}
                  value={classTemplateForm.room}
                  onChange={(event) => updateClassTemplateField("room", event.target.value)}
                  placeholder="Salon principal"
                  required
                />
              </Field>
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">Registro de clases</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-900/70 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">Clase</th>
                  <th className="px-4 py-3">Entrenador</th>
                  <th className="px-4 py-3">Duracion</th>
                  <th className="px-4 py-3">Capacidad</th>
                  <th className="px-4 py-3">Espacio</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {classCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      Aun no hay clases registradas.
                    </td>
                  </tr>
                ) : (
                  classCatalog.map((template) => (
                    <tr key={template.id} className="bg-white dark:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-950 dark:text-white">{template.name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{template.coach}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{template.duration} min</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{template.capacity} cupos</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{template.room}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => editClassTemplate(template)}
                          aria-label="Editar clase"
                          title="Editar clase"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sky-600 transition hover:bg-sky-50 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/40"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setClassToDelete(template)}
                          aria-label="Eliminar clase"
                          title="Eliminar clase"
                          className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        {onboarding ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-amber-950 dark:text-amber-100">Estado de la cuenta</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                onboarding.status === "active"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
              }`}>
                {onboarding.status === "active" ? "Activa" : "Pendiente"}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-amber-900 dark:text-amber-200">
              <p>Plan: {onboarding.subscriptionPlan === "demo" ? "Demo" : onboarding.subscriptionPlan}</p>
              <p>Correo: {onboarding.emailVerified ? "Verificado" : "Pendiente de verificacion"}</p>
              {onboarding.trialEndsAt ? (
                <p>
                  Fin de prueba:{" "}
                  {new Intl.DateTimeFormat("es-CO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(onboarding.trialEndsAt))}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">{gymProfile.gymName}</h2>
          <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>{gymProfile.city || "Ciudad pendiente"}</p>
            <p>{gymProfile.adminName}</p>
            <p>{gymProfile.adminEmail}</p>
            <p>{gymProfile.adminRole}</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-base font-semibold text-gray-950 dark:text-white">Sugerencias de funciones</h2>
          <div className="mt-4 space-y-3">
            {featureSuggestions.map((feature) => (
              <div key={feature.title} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{feature.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>

    {planToDelete ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
        onClick={() => setPlanToDelete(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-plan-title"
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <TrashIcon className="h-5 w-5" />
            </div>
            <h2 id="delete-plan-title" className="text-base font-semibold text-gray-950 dark:text-white">
              Eliminar plan
            </h2>
          </div>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Seguro que deseas eliminar el plan{" "}
            <span className="font-semibold text-gray-950 dark:text-white">{planToDelete.name}</span>? Esta accion no
            se puede deshacer.
          </p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPlanToDelete(null)}
              className="h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDeletePlan}
              className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    ) : null}

    {classToDelete ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
        onClick={() => setClassToDelete(null)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-class-title"
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <TrashIcon className="h-5 w-5" />
            </div>
            <h2 id="delete-class-title" className="text-base font-semibold text-gray-950 dark:text-white">
              Eliminar clase
            </h2>
          </div>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Seguro que deseas eliminar la clase{" "}
            <span className="font-semibold text-gray-950 dark:text-white">{classToDelete.name}</span>? Esta accion no
            se puede deshacer.
          </p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setClassToDelete(null)}
              className="h-10 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDeleteClassTemplate}
              className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
