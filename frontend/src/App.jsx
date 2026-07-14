import { useEffect, useMemo, useState } from "react";
import { getRoleLabel, hasPermission } from "./auth.js";
import { redeemInviteCode } from "./inviteCodeApi.js";
import AccessManagement from "./components/AccessManagement.jsx";
import AnalyticsDashboard from "./components/AnalyticsDashboard.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import CheckInDashboard from "./components/CheckInDashboard.jsx";
import ClassSchedule from "./components/ClassSchedule.jsx";
import ClientForm from "./components/ClientForm.jsx";
import FinancialDashboard from "./components/FinancialDashboard.jsx";
import GymSetup from "./components/GymSetup.jsx";
import InventoryDashboard from "./components/InventoryDashboard.jsx";
import MemberDetail from "./components/MemberDetail.jsx";
import MemberProgress from "./components/MemberProgress.jsx";
import MembersTable from "./components/MembersTable.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import OperationsDashboard from "./components/OperationsDashboard.jsx";
import Tabs from "./components/Tabs.jsx";

const dashboardSummary = {
  financialSummary: {
    currentMonthRevenue: 18450000,
    previousMonthRevenue: 15100000,
    currentMonthExpenses: 6350000,
    currentMonthPaidPayments: 128,
    monthlyRevenue: [
      { month: "Ene", revenue: 12600000, expenses: 4100000, users: 1 },
      { month: "Feb", revenue: 13900000, expenses: 4650000, users: 2 },
      { month: "Mar", revenue: 14250000, expenses: 4900000, users: 2 },
      { month: "Abr", revenue: 15800000, expenses: 5200000, users: 2 },
      { month: "May", revenue: 15100000, expenses: 5850000, users: 3 },
      { month: "Jun", revenue: 18450000, expenses: 6350000, users: 3 },
    ],
    accountsReceivable: [
      {
        receivableId: "rec-001",
        memberName: "Andres Silva",
        planName: "Mensual",
        amount: 95000,
        dueDate: "2026-05-01",
      },
      {
        receivableId: "rec-002",
        memberName: "Valentina Gomez",
        planName: "VIP",
        amount: 180000,
        dueDate: "2026-05-28",
      },
      {
        receivableId: "rec-003",
        memberName: "Miguel Torres",
        planName: "Anual",
        amount: 890000,
        dueDate: "2026-05-30",
      },
      {
        receivableId: "rec-004",
        memberName: "Daniela Ruiz",
        planName: "Mensual",
        amount: 95000,
        dueDate: "2026-06-02",
      },
    ],
    recentExpenses: [
      {
        expenseId: "exp-001",
        category: "Infraestructura",
        description: "Arriendo sede principal",
        amount: 3000000,
        expenseDate: "2026-06-01",
        paymentMethod: "Transferencia",
        provider: "Inmobiliaria Central",
        createdAt: "2026-06-01T13:00:00Z",
      },
      {
        expenseId: "exp-002",
        category: "Servicios",
        description: "Energia, agua e internet",
        amount: 1250000,
        expenseDate: "2026-06-03",
        paymentMethod: "Transferencia",
        provider: "Servicios publicos",
        createdAt: "2026-06-03T16:30:00Z",
      },
      {
        expenseId: "exp-003",
        category: "Maquinaria",
        description: "Mantenimiento de caminadoras",
        amount: 2100000,
        expenseDate: "2026-06-05",
        paymentMethod: "Tarjeta",
        provider: "Tecnifitness",
        createdAt: "2026-06-05T14:00:00Z",
      },
    ],
    recentPayments: [
      {
        paymentId: "pay-001",
        memberName: "Laura Mendoza",
        planName: "VIP",
        amount: 180000,
        currency: "COP",
        method: "Transferencia",
        status: "Paid",
        createdAt: "2026-06-03T14:10:00Z",
        paidAt: "2026-06-03T14:12:00Z",
      },
      {
        paymentId: "pay-002",
        memberName: "Carlos Rojas",
        planName: "Mensual",
        amount: 95000,
        currency: "COP",
        method: "Efectivo",
        status: "Pending",
        createdAt: "2026-06-03T13:40:00Z",
        paidAt: null,
      },
      {
        paymentId: "pay-003",
        memberName: "Natalia Perez",
        planName: "Anual",
        amount: 890000,
        currency: "COP",
        method: "Tarjeta",
        status: "Paid",
        createdAt: "2026-06-02T21:00:00Z",
        paidAt: "2026-06-02T21:01:00Z",
      },
    ],
  },
  members: [
    {
      memberId: "mem-001",
      fullName: "Laura Mendoza",
      email: "laura@example.com",
      phone: "+57 300 111 2233",
      gender: "female",
      planName: "VIP",
      startDate: "2026-05-20",
      endDate: "2026-07-20",
      daysToExpire: 47,
      status: "Active",
      visualColor: "Green",
      tailwindClass: "bg-green-100 text-green-800",
      bodyMetrics: {
        heightCm: 168,
        weightKg: 62,
        chestCm: 91,
        waistCm: 70,
        hipCm: 96,
      },
    },
    {
      memberId: "mem-002",
      fullName: "Carlos Rojas",
      email: "carlos@example.com",
      phone: "+57 301 555 4488",
      gender: "male",
      planName: "Mensual",
      startDate: "2026-05-09",
      endDate: "2026-06-07",
      daysToExpire: 4,
      status: "ExpiringSoon",
      visualColor: "Yellow",
      tailwindClass: "bg-yellow-100 text-yellow-800",
      bodyMetrics: {
        heightCm: 178,
        weightKg: 81,
        chestCm: 103,
        waistCm: 86,
        hipCm: 94,
      },
    },
    {
      memberId: "mem-003",
      fullName: "Andres Silva",
      email: "andres@example.com",
      phone: "+57 302 777 9911",
      gender: "male",
      planName: "Mensual",
      startDate: "2026-04-01",
      endDate: "2026-05-01",
      daysToExpire: -33,
      status: "Expired",
      visualColor: "Red",
      tailwindClass: "bg-red-100 text-red-800",
      bodyMetrics: {
        heightCm: 174,
        weightKg: 89,
        chestCm: 108,
        waistCm: 98,
        hipCm: 101,
      },
    },
  ],
};

const initialGymProfile = {
  gymName: "Power House Gym",
  city: "Bogota",
  adminName: "Maria Rodriguez",
  adminEmail: "admin@powerhousegym.com",
  adminPhone: "+57 300 000 0000",
  adminRole: "Propietario",
};

const emptyFinancialSummary = {
  currentMonthRevenue: 0,
  previousMonthRevenue: 0,
  currentMonthExpenses: 0,
  currentMonthPaidPayments: 0,
  monthlyRevenue: [],
  accountsReceivable: [],
  recentExpenses: [],
  recentPayments: [],
};

const initialPlans = [
  {
    id: "plan-001",
    name: "Mensual",
    price: 95000,
    durationDays: 30,
    maxClasses: null,
    description: "Acceso completo por 30 dias.",
  },
  {
    id: "plan-002",
    name: "VIP",
    price: 180000,
    durationDays: 30,
    maxClasses: null,
    description: "Acceso completo, clases grupales y seguimiento.",
  },
  {
    id: "plan-003",
    name: "Anual",
    price: 890000,
    durationDays: 365,
    maxClasses: null,
    description: "Pago anual con tarifa preferencial.",
  },
];

const initialAttendanceLogs = [
  {
    id: "att-001",
    memberId: "mem-001",
    fullName: "Laura Mendoza",
    planName: "VIP",
    accessGranted: true,
    checkedAt: "2026-06-05T12:18:00Z",
    checkedOutAt: "2026-06-05T13:26:00Z",
    reason: "Plan activo",
  },
  {
    id: "att-002",
    memberId: "mem-003",
    fullName: "Andres Silva",
    planName: "Mensual",
    accessGranted: false,
    checkedAt: "2026-06-05T12:02:00Z",
    checkedOutAt: null,
    reason: "Plan vencido",
  },
  {
    id: "att-003",
    memberId: "mem-002",
    fullName: "Carlos Rojas",
    planName: "Mensual",
    accessGranted: true,
    checkedAt: "2026-06-04T11:25:00Z",
    checkedOutAt: "2026-06-04T12:40:00Z",
    reason: "Plan por vencer",
  },
  {
    id: "att-004",
    memberId: "mem-001",
    fullName: "Laura Mendoza",
    planName: "VIP",
    accessGranted: true,
    checkedAt: "2026-06-04T22:10:00Z",
    checkedOutAt: "2026-06-04T23:20:00Z",
    reason: "Plan activo",
  },
  {
    id: "att-005",
    memberId: "mem-002",
    fullName: "Carlos Rojas",
    planName: "Mensual",
    accessGranted: true,
    checkedAt: "2026-06-03T23:05:00Z",
    checkedOutAt: "2026-06-04T00:15:00Z",
    reason: "Plan por vencer",
  },
  {
    id: "att-006",
    memberId: "mem-001",
    fullName: "Laura Mendoza",
    planName: "VIP",
    accessGranted: true,
    checkedAt: "2026-06-02T22:40:00Z",
    checkedOutAt: "2026-06-02T23:50:00Z",
    reason: "Plan activo",
  },
  {
    id: "att-007",
    memberId: "mem-001",
    fullName: "Laura Mendoza",
    planName: "VIP",
    accessGranted: true,
    checkedAt: "2026-06-01T15:30:00Z",
    checkedOutAt: "2026-06-01T16:45:00Z",
    reason: "Plan activo",
  },
];

const initialUsers = [
  {
    id: "usr-owner",
    gymId: "gym-demo",
    name: "Maria Rodriguez",
    email: "admin@powerhousegym.com",
    password: "Demo123!",
    role: "owner",
    active: true,
    isDemo: true,
  },
  {
    id: "usr-admin",
    gymId: "gym-demo",
    name: "Santiago Moreno",
    email: "gerencia@powerhousegym.com",
    password: "Demo123!",
    role: "admin",
    active: true,
    isDemo: true,
  },
  {
    id: "usr-reception",
    gymId: "gym-demo",
    name: "Camila Lopez",
    email: "recepcion@powerhousegym.com",
    password: "Demo123!",
    role: "reception",
    active: true,
    isDemo: true,
  },
  {
    id: "usr-trainer",
    gymId: "gym-demo",
    name: "Diego Martinez",
    email: "entrenador@powerhousegym.com",
    password: "Demo123!",
    role: "trainer",
    active: true,
    isDemo: true,
  },
];

const initialClasses = [
  {
    id: "class-001",
    name: "Spinning",
    coach: "Diego Martinez",
    date: "2026-06-11",
    time: "18:00",
    duration: 50,
    capacity: 12,
    room: "Salon cardio",
  },
  {
    id: "class-002",
    name: "Funcional",
    coach: "Paula Herrera",
    date: "2026-06-12",
    time: "07:00",
    duration: 60,
    capacity: 10,
    room: "Zona funcional",
  },
  {
    id: "class-003",
    name: "Yoga",
    coach: "Valeria Castro",
    date: "2026-06-13",
    time: "09:00",
    duration: 60,
    capacity: 15,
    room: "Salon principal",
  },
];

const initialClassCatalog = [
  {
    id: "class-template-001",
    name: "Spinning",
    coach: "Diego Martinez",
    duration: 50,
    capacity: 12,
    room: "Salon cardio",
  },
  {
    id: "class-template-002",
    name: "Funcional",
    coach: "Paula Herrera",
    duration: 60,
    capacity: 10,
    room: "Zona funcional",
  },
  {
    id: "class-template-003",
    name: "Yoga",
    coach: "Valeria Castro",
    duration: 60,
    capacity: 15,
    room: "Salon principal",
  },
];

const initialReservations = [
  {
    id: "reservation-001",
    classId: "class-001",
    memberId: "mem-001",
    status: "confirmed",
    createdAt: "2026-06-10T14:00:00Z",
  },
];

const initialBudgets = [
  { category: "Infraestructura", limit: 4200000, spent: 3000000 },
  { category: "Maquinaria", limit: 3000000, spent: 2100000 },
  { category: "Servicios", limit: 1800000, spent: 1250000 },
];

const initialEquipment = [
  { id: "eq-001", name: "Caminadora 01", category: "Cardio", status: "Operativo", nextMaintenance: "2026-07-05" },
  { id: "eq-002", name: "Bicicleta 03", category: "Cardio", status: "Mantenimiento", nextMaintenance: "2026-06-12" },
  { id: "eq-003", name: "Multiestacion", category: "Fuerza", status: "Operativo", nextMaintenance: "2026-07-20" },
];

const initialShifts = [
  { id: "shift-001", employee: "Diego Martinez", role: "Entrenador", date: "2026-06-11", start: "14:00", end: "22:00", commission: 85000 },
  { id: "shift-002", employee: "Camila Lopez", role: "Recepcion", date: "2026-06-11", start: "06:00", end: "14:00", commission: 0 },
];

const initialProducts = [
  { id: "product-001", sku: "BEB-001", name: "Agua mineral", category: "Bebidas", price: 4000, stock: 28, minimumStock: 8 },
  { id: "product-002", sku: "BEB-002", name: "Bebida hidratante", category: "Bebidas", price: 7000, stock: 14, minimumStock: 6 },
  { id: "product-003", sku: "SNK-001", name: "Barra de proteina", category: "Snacks", price: 8500, stock: 5, minimumStock: 5 },
  { id: "product-004", sku: "SUP-001", name: "Proteina whey 2 lb", category: "Suplementos", price: 145000, stock: 3, minimumStock: 2 },
  { id: "product-005", sku: "ACC-001", name: "Toalla deportiva", category: "Accesorios", price: 25000, stock: 9, minimumStock: 4 },
];

const initialProgressRecords = [
  { id: "progress-001", memberId: "mem-001", date: "2026-03-20", weightKg: 66.2, chestCm: 92, waistCm: 74, hipCm: 98, bodyFatPercentage: 26.5, recordedBy: "Diego Martinez" },
  { id: "progress-002", memberId: "mem-001", date: "2026-04-20", weightKg: 64.8, chestCm: 92, waistCm: 72, hipCm: 97, bodyFatPercentage: 25.1, recordedBy: "Diego Martinez" },
  { id: "progress-003", memberId: "mem-001", date: "2026-05-20", weightKg: 63.4, chestCm: 91, waistCm: 71, hipCm: 96, bodyFatPercentage: 23.9, recordedBy: "Diego Martinez" },
  { id: "progress-004", memberId: "mem-001", date: "2026-06-10", weightKg: 62, chestCm: 91, waistCm: 70, hipCm: 96, bodyFatPercentage: 22.8, recordedBy: "Diego Martinez" },
  { id: "progress-005", memberId: "mem-002", date: "2026-04-09", weightKg: 84, chestCm: 104, waistCm: 90, hipCm: 96, bodyFatPercentage: 24.2, recordedBy: "Diego Martinez" },
  { id: "progress-006", memberId: "mem-002", date: "2026-06-07", weightKg: 81, chestCm: 103, waistCm: 86, hipCm: 94, bodyFatPercentage: 21.7, recordedBy: "Diego Martinez" },
];

const initialProgressGoals = [
  { id: "goal-001", memberId: "mem-001", title: "Llegar a 60 kg", targetValue: 60, unit: "kg", targetDate: "2026-08-20", completed: false, createdAt: "2026-05-20T14:00:00Z" },
  { id: "goal-002", memberId: "mem-001", title: "Reducir cintura", targetValue: 68, unit: "cm", targetDate: "2026-07-31", completed: false, createdAt: "2026-05-20T14:05:00Z" },
  { id: "goal-003", memberId: "mem-002", title: "Completar 12 sesiones", targetValue: 12, unit: "sesiones", targetDate: "2026-07-15", completed: false, createdAt: "2026-06-01T10:00:00Z" },
];

const initialProgressNotes = [
  { id: "note-001", memberId: "mem-001", text: "Buena adherencia al plan. Aumentar progresivamente el trabajo de fuerza en tren inferior.", author: "Diego Martinez", createdAt: "2026-06-10T15:30:00Z" },
  { id: "note-002", memberId: "mem-002", text: "Mejoro la resistencia cardiovascular. Mantener tecnica en sentadilla antes de subir carga.", author: "Diego Martinez", createdAt: "2026-06-07T13:20:00Z" },
];

const registeredGymsStorageKey = "gymflow-registered-gyms";

function loadRegisteredGyms() {
  try {
    const stored = JSON.parse(localStorage.getItem(registeredGymsStorageKey) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveRegisteredGyms(gyms) {
  localStorage.setItem(registeredGymsStorageKey, JSON.stringify(gyms));
}

function getTrialEndDate() {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  return trialEnd.toISOString();
}

export default function App() {
  const [registeredGyms, setRegisteredGyms] = useState(loadRegisteredGyms);
  const [users, setUsers] = useState(() => [
    ...initialUsers,
    ...loadRegisteredGyms().map((gym) => gym.owner),
  ]);
  const [currentUser, setCurrentUser] = useState(null);
  const [workspaceId, setWorkspaceId] = useState("gym-demo");
  const [onboarding, setOnboarding] = useState({
    status: "active",
    subscriptionPlan: "demo",
    emailVerified: true,
    registeredAt: null,
    trialEndsAt: null,
  });
  const [members, setMembers] = useState(dashboardSummary.members);
  const [financialSummary, setFinancialSummary] = useState(dashboardSummary.financialSummary);
  const [selectedMemberId, setSelectedMemberId] = useState(dashboardSummary.members[0]?.memberId);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [activeTab, setActiveTab] = useState("clients");
  const [financeIntent, setFinanceIntent] = useState(null);
  const [isSettingsView, setIsSettingsView] = useState(false);
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [theme, setTheme] = useState(() => localStorage.getItem("gym-theme") || "light");
  const [gymProfile, setGymProfile] = useState(initialGymProfile);
  const [plans, setPlans] = useState(initialPlans);
  const [attendanceLogs, setAttendanceLogs] = useState(initialAttendanceLogs);
  const [classes, setClasses] = useState(initialClasses);
  const [classCatalog, setClassCatalog] = useState(initialClassCatalog);
  const [reservations, setReservations] = useState(initialReservations);
  const [budgets, setBudgets] = useState(initialBudgets);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [shifts, setShifts] = useState(initialShifts);
  const [products, setProducts] = useState(initialProducts);
  const [progressRecords, setProgressRecords] = useState(initialProgressRecords);
  const [progressGoals, setProgressGoals] = useState(initialProgressGoals);
  const [progressNotes, setProgressNotes] = useState(initialProgressNotes);
  const isDarkMode = theme === "dark";
  const navigationItems = useMemo(
    () =>
      [
        { id: "finance", label: "Finanzas", permission: "finance" },
        { id: "analytics", label: "Analitica", permission: "analytics" },
        { id: "checkin", label: "Check-in", permission: "checkin" },
        { id: "clients", label: "Registro", permission: "clients" },
        { id: "membership", label: "Clientes", permission: "membership" },
        { id: "progress", label: "Progreso", permission: "progress" },
        { id: "classes", label: "Clases", permission: "classes" },
        { id: "inventory", label: "Inventario", permission: "inventory" },
        { id: "operations", label: "Operaciones", permission: "operations" },
      ].filter((item) => hasPermission(currentUser, item.permission)),
    [currentUser],
  );
  const settingsNavigationItems = useMemo(
    () =>
      [
        { id: "setup", label: "Configuracion", permission: "setup" },
        { id: "access", label: "Usuarios", permission: "users" },
      ].filter((item) => hasPermission(currentUser, item.permission)),
    [currentUser],
  );
  const pageMeta = {
    finance: {
      eyebrow: "Vista general",
      title: "Panel financiero",
      description: "Controla el rendimiento y los movimientos de tu negocio.",
    },
    analytics: {
      eyebrow: "Inteligencia del negocio",
      title: "Analitica avanzada",
      description: "Entiende crecimiento, retencion, ingresos y patrones de asistencia.",
    },
    clients: {
      eyebrow: "Comunidad",
      title: "Registro de clientes",
      description: "Administra perfiles, planes y progreso de tus miembros.",
    },
    checkin: {
      eyebrow: "Control de acceso",
      title: "Check-in",
      description: "Valida entradas y monitorea la ocupacion del gimnasio.",
    },
    membership: {
      eyebrow: "Suscripciones",
      title: "Clientes",
      description: "Revisa vencimientos y actualiza periodos de servicio.",
    },
    progress: {
      eyebrow: "Evolucion del cliente",
      title: "Seguimiento de progreso",
      description: "Registra medidas, objetivos y observaciones de entrenamiento.",
    },
    classes: {
      eyebrow: "Agenda y capacidad",
      title: "Clases y reservas",
      description: "Programa sesiones y reserva cupos para los clientes.",
    },
    inventory: {
      eyebrow: "Productos y ventas",
      title: "Inventario",
      description: "Controla productos, precios, existencias y alertas de reposicion.",
    },
    operations: {
      eyebrow: "Administracion interna",
      title: "Operaciones",
      description: "Controla presupuestos, equipos, mantenimiento y personal.",
    },
    setup: {
      eyebrow: "Configuracion",
      title: "Tu gimnasio",
      description: "Personaliza la informacion comercial y los planes.",
    },
    access: {
      eyebrow: "Seguridad",
      title: "Usuarios y permisos",
      description: "Administra accesos y responsabilidades por rol.",
    },
  }[activeTab];

  const selectedMember = useMemo(
    () => members.find((member) => member.memberId === selectedMemberId) || members[0],
    [members, selectedMemberId],
  );

  const editingMember = useMemo(
    () => members.find((member) => member.memberId === editingMemberId) || null,
    [members, editingMemberId],
  );

  const filteredMembers = useMemo(() => {
    if (membershipFilter === "all") {
      return members;
    }

    return members.filter((member) => member.status === membershipFilter);
  }, [members, membershipFilter]);

  const expiringMembers = useMemo(
    () =>
      members
        .filter((member) => member.daysToExpire >= 0 && member.daysToExpire <= 5)
        .sort((a, b) => a.daysToExpire - b.daysToExpire),
    [members],
  );

  function reviewExpiringMember(memberId) {
    setMembershipFilter("ExpiringSoon");
    setSelectedMemberId(memberId);
    setActiveTab("membership");
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("gym-theme", theme);
  }, [isDarkMode, theme]);

  useEffect(() => {
    const reachableTabs = [...navigationItems, ...settingsNavigationItems];
    if (currentUser && !reachableTabs.some((item) => item.id === activeTab)) {
      setActiveTab(navigationItems[0]?.id || "clients");
    }
  }, [activeTab, currentUser, navigationItems, settingsNavigationItems]);

  function loadWorkspace(user, registeredGymOverride = null) {
    if (user.gymId === "gym-demo") {
      setGymProfile(initialGymProfile);
      setOnboarding({
        status: "active",
        subscriptionPlan: "demo",
        emailVerified: true,
        registeredAt: null,
        trialEndsAt: null,
      });
      setMembers(dashboardSummary.members);
      setFinancialSummary(dashboardSummary.financialSummary);
      setSelectedMemberId(dashboardSummary.members[0]?.memberId);
      setPlans(initialPlans);
      setAttendanceLogs(initialAttendanceLogs);
      setClasses(initialClasses);
      setClassCatalog(initialClassCatalog);
      setReservations(initialReservations);
      setBudgets(initialBudgets);
      setEquipment(initialEquipment);
      setShifts(initialShifts);
      setProducts(initialProducts);
      setProgressRecords(initialProgressRecords);
      setProgressGoals(initialProgressGoals);
      setProgressNotes(initialProgressNotes);
    } else {
      const registeredGym =
        registeredGymOverride || registeredGyms.find((gym) => gym.id === user.gymId);

      if (registeredGym) {
        setGymProfile(registeredGym.profile);
        setOnboarding(registeredGym.onboarding);
      }

      setMembers([]);
      setFinancialSummary(emptyFinancialSummary);
      setSelectedMemberId(undefined);
      setPlans([]);
      setAttendanceLogs([]);
      setClasses([]);
      setClassCatalog([]);
      setReservations([]);
      setBudgets([]);
      setEquipment([]);
      setShifts([]);
      setProducts([]);
      setProgressRecords([]);
      setProgressGoals([]);
      setProgressNotes([]);
    }

    setWorkspaceId(user.gymId);
  }

  function handleLogin(email, password) {
    const user = users.find((item) => item.email === email);

    if (!user || user.password !== password) {
      return { ok: false, message: "Correo o contrasena incorrectos." };
    }

    if (!user.active) {
      return { ok: false, message: "Este usuario esta inactivo. Contacta al propietario." };
    }

    if (workspaceId !== user.gymId) {
      loadWorkspace(user);
    }

    setCurrentUser(user);
    const firstTab = [
      { id: "finance", permission: "finance" },
      { id: "clients", permission: "clients" },
    ].find((item) => hasPermission(user, item.permission));
    setActiveTab(firstTab?.id || "clients");
    return { ok: true };
  }

  async function handleRegisterGym(form, code) {
    const email = form.email.trim().toLowerCase();

    if (users.some((user) => user.email === email)) {
      return { ok: false, message: "Ya existe una cuenta con este correo." };
    }

    if (form.password.length < 8) {
      return { ok: false, message: "La contrasena debe tener al menos 8 caracteres." };
    }

    if (!form.acceptTerms) {
      return { ok: false, message: "Debes aceptar los terminos para continuar." };
    }

    if (!code) {
      return { ok: false, message: "Falta el codigo de invitacion." };
    }

    let redemption;
    try {
      redemption = await redeemInviteCode(code);
    } catch {
      return { ok: false, message: "No se pudo validar el codigo de invitacion. Intenta de nuevo." };
    }

    if (!redemption.success) {
      return { ok: false, message: redemption.message || "El codigo de invitacion no es valido." };
    }

    const gymId = crypto.randomUUID();
    const owner = {
      id: crypto.randomUUID(),
      gymId,
      name: form.ownerName.trim(),
      email,
      password: form.password,
      role: "owner",
      active: true,
      isDemo: false,
    };
    const registeredGym = {
      id: gymId,
      profile: {
        gymName: form.gymName.trim(),
        city: form.city.trim(),
        adminName: owner.name,
        adminEmail: owner.email,
        adminPhone: form.phone.trim(),
        adminRole: "Propietario",
      },
      onboarding: {
        status: "pending_approval",
        subscriptionPlan: form.subscriptionPlan,
        emailVerified: false,
        registeredAt: new Date().toISOString(),
        trialEndsAt: getTrialEndDate(),
      },
      owner,
    };
    const updatedGyms = [...registeredGyms, registeredGym];

    setRegisteredGyms(updatedGyms);
    saveRegisteredGyms(updatedGyms);
    setUsers((current) => [...current, owner]);
    loadWorkspace(owner, registeredGym);
    setCurrentUser(owner);
    setActiveTab("setup");

    return { ok: true };
  }

  function handleCreateUser(user) {
    if (!hasPermission(currentUser, "users")) {
      return { ok: false, message: "No tienes permiso para crear usuarios." };
    }

    if (users.some((item) => item.email === user.email)) {
      return { ok: false, message: "Ya existe un usuario con este correo." };
    }

    setUsers((current) => [
      { id: crypto.randomUUID(), ...user, gymId: currentUser.gymId, active: true, isDemo: false },
      ...current,
    ]);
    return { ok: true, message: "Usuario creado correctamente." };
  }

  function handleToggleUser(userId) {
    if (!hasPermission(currentUser, "users") || userId === currentUser.id) {
      return;
    }

    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, active: !user.active } : user)),
    );
  }

  function handleCreateClassWithReservation(gymClass, memberId) {
    if (!["owner", "admin", "trainer"].includes(currentUser.role)) {
      return { ok: false, message: "No tienes permiso para programar clases." };
    }

    const member = members.find((item) => item.memberId === memberId);

    if (!member) {
      return { ok: false, message: "Selecciona un miembro para confirmar la reserva." };
    }

    if (member.status === "Suspended") {
      return { ok: false, message: "La mensualidad del cliente esta suspendida." };
    }

    if (member.status === "Expired" || member.daysToExpire < 0) {
      return { ok: false, message: "La mensualidad del cliente esta vencida." };
    }

    setClasses((current) => [gymClass, ...current]);
    setReservations((current) => [
      {
        id: crypto.randomUUID(),
        classId: gymClass.id,
        memberId,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);

    return { ok: true, message: `Clase creada y reserva confirmada para ${member.fullName}.` };
  }

  function handleReserveClass(classId, memberId) {
    if (!hasPermission(currentUser, "classes")) {
      return { ok: false, message: "No tienes permiso para reservar clases." };
    }

    const gymClass = classes.find((item) => item.id === classId);
    const member = members.find((item) => item.memberId === memberId);

    if (!gymClass || !member) {
      return { ok: false, message: "Selecciona una clase y un cliente validos." };
    }

    if (member.status === "Suspended") {
      return { ok: false, message: "La mensualidad del cliente esta suspendida." };
    }

    if (member.status === "Expired" || member.daysToExpire < 0) {
      return { ok: false, message: "La mensualidad del cliente esta vencida." };
    }

    const activeReservations = reservations.filter(
      (item) => item.classId === classId && item.status === "confirmed",
    );

    if (activeReservations.some((item) => item.memberId === memberId)) {
      return { ok: false, message: "El cliente ya tiene un cupo en esta clase." };
    }

    if (activeReservations.length >= gymClass.capacity) {
      return { ok: false, message: "La clase ya no tiene cupos disponibles." };
    }

    setReservations((current) => [
      {
        id: crypto.randomUUID(),
        classId,
        memberId,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    return { ok: true, message: `Reserva confirmada para ${member.fullName}.` };
  }

  function handleCancelReservation(reservationId) {
    if (!hasPermission(currentUser, "classes")) {
      return;
    }

    setReservations((current) =>
      current.map((item) => (item.id === reservationId ? { ...item, status: "cancelled" } : item)),
    );
  }

  function handleUpdateBudget(category, limit) {
    if (!hasPermission(currentUser, "operations")) return;
    setBudgets((current) =>
      current.map((budget) => (budget.category === category ? { ...budget, limit } : budget)),
    );
  }

  function handleCreateEquipment(item) {
    if (hasPermission(currentUser, "operations")) {
      setEquipment((current) => [item, ...current]);
    }
  }

  function handleUpdateEquipmentStatus(equipmentId, status) {
    if (!hasPermission(currentUser, "operations")) return;
    setEquipment((current) =>
      current.map((item) => (item.id === equipmentId ? { ...item, status } : item)),
    );
  }

  function handleCreateShift(shift) {
    if (hasPermission(currentUser, "operations")) {
      setShifts((current) => [shift, ...current]);
    }
  }

  function handleSaveProduct(product) {
    if (!["owner", "admin"].includes(currentUser.role)) {
      return { ok: false, message: "No tienes permiso para administrar productos." };
    }

    if (!product.name || !product.sku || !product.category || product.price < 0) {
      return { ok: false, message: "Completa los datos obligatorios del producto." };
    }

    const duplicate = products.find(
      (item) => item.id !== product.id && item.sku.toLowerCase() === product.sku.toLowerCase(),
    );
    if (duplicate) {
      return { ok: false, message: "Ya existe un producto con este codigo SKU." };
    }

    if (product.id) {
      setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
      return { ok: true, message: "Producto actualizado correctamente." };
    }

    setProducts((current) => [{ ...product, id: crypto.randomUUID() }, ...current]);
    return { ok: true, message: "Producto agregado al inventario." };
  }

  function handleDeleteProduct(productId) {
    if (!["owner", "admin"].includes(currentUser.role)) {
      return;
    }

    setProducts((current) => current.filter((product) => product.id !== productId));
  }

  function handleUpdateProductStock(productId, stock) {
    if (!hasPermission(currentUser, "inventory")) {
      return;
    }

    const nextStock = Math.max(0, Math.floor(Number(stock) || 0));
    setProducts((current) =>
      current.map((product) => (product.id === productId ? { ...product, stock: nextStock } : product)),
    );
  }

  function handleAddProgressMeasurement(record) {
    if (!hasPermission(currentUser, "progress")) return;

    setProgressRecords((current) => [...current, record]);
    setMembers((current) =>
      current.map((member) =>
        member.memberId === record.memberId
          ? {
              ...member,
              bodyMetrics: {
                ...member.bodyMetrics,
                weightKg: record.weightKg ?? member.bodyMetrics?.weightKg,
                chestCm: record.chestCm ?? member.bodyMetrics?.chestCm,
                waistCm: record.waistCm ?? member.bodyMetrics?.waistCm,
                hipCm: record.hipCm ?? member.bodyMetrics?.hipCm,
              },
            }
          : member,
      ),
    );
  }

  function handleAddProgressGoal(goal) {
    if (hasPermission(currentUser, "progress")) {
      setProgressGoals((current) => [goal, ...current]);
    }
  }

  function handleToggleProgressGoal(goalId) {
    if (!hasPermission(currentUser, "progress")) return;
    setProgressGoals((current) =>
      current.map((goal) => (goal.id === goalId ? { ...goal, completed: !goal.completed } : goal)),
    );
  }

  function handleAddProgressNote(note) {
    if (hasPermission(currentUser, "progress")) {
      setProgressNotes((current) => [note, ...current]);
    }
  }

  function handleCreateMember(member) {
    setMembers((current) => [member, ...current]);
    setSelectedMemberId(member.memberId);
    setActiveTab("membership");
  }

  function handleEditMember(member) {
    setEditingMemberId(member.memberId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEditMember() {
    setEditingMemberId(null);
  }

  function handleUpdateMember(updatedFields) {
    setMembers((current) =>
      current.map((member) =>
        member.memberId === updatedFields.memberId ? { ...member, ...updatedFields } : member,
      ),
    );
    setEditingMemberId(null);
  }

  function handleDeleteMember(memberId) {
    setMembers((current) => current.filter((member) => member.memberId !== memberId));
    if (selectedMemberId === memberId) {
      setSelectedMemberId(undefined);
    }
    if (editingMemberId === memberId) {
      setEditingMemberId(null);
    }
  }

  function handleCreatePlan(plan) {
    setPlans((current) => {
      const existingById = current.find((item) => item.id === plan.id);

      if (existingById) {
        return current.map((item) => (item.id === plan.id ? plan : item));
      }

      const existingByName = current.find((item) => item.name.toLowerCase() === plan.name.toLowerCase());

      if (!existingByName) {
        return [plan, ...current];
      }

      return current.map((item) => (item.id === existingByName.id ? { ...plan, id: existingByName.id } : item));
    });
  }

  function handleDeletePlan(planId) {
    setPlans((current) => current.filter((plan) => plan.id !== planId));
  }

  function handleSaveClassTemplate(template) {
    setClassCatalog((current) => {
      const existingById = current.find((item) => item.id === template.id);

      if (existingById) {
        return current.map((item) => (item.id === template.id ? template : item));
      }

      const existingByName = current.find((item) => item.name.toLowerCase() === template.name.toLowerCase());

      if (!existingByName) {
        return [template, ...current];
      }

      return current.map((item) => (item.id === existingByName.id ? { ...template, id: existingByName.id } : item));
    });
  }

  function handleDeleteClassTemplate(templateId) {
    setClassCatalog((current) => current.filter((template) => template.id !== templateId));
  }

  function handleSaveGymProfile(profile) {
    setGymProfile(profile);

    if (currentUser.gymId === "gym-demo") {
      return;
    }

    setRegisteredGyms((current) => {
      const updated = current.map((gym) =>
        gym.id === currentUser.gymId ? { ...gym, profile } : gym,
      );
      saveRegisteredGyms(updated);
      return updated;
    });
  }

  function calculateMembershipState(endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(`${endDate}T00:00:00`);
    const daysToExpire = Math.ceil((end - today) / 86400000);

    if (daysToExpire < 0) {
      return {
        daysToExpire,
        status: "Expired",
        visualColor: "Red",
        tailwindClass: "bg-red-100 text-red-800",
      };
    }

    if (daysToExpire <= 5) {
      return {
        daysToExpire,
        status: "ExpiringSoon",
        visualColor: "Yellow",
        tailwindClass: "bg-yellow-100 text-yellow-800",
      };
    }

    return {
      daysToExpire,
      status: "Active",
      visualColor: "Green",
      tailwindClass: "bg-green-100 text-green-800",
    };
  }

  function handleUpdateMembership(memberId, dates) {
    setMembers((current) =>
      current.map((member) =>
        member.memberId === memberId
          ? {
              ...member,
              ...dates,
              ...calculateMembershipState(dates.endDate),
            }
          : member,
      ),
    );
  }

  function handleCheckIn(memberId) {
    const member = members.find((item) => item.memberId === memberId);

    if (!member) {
      return null;
    }

    const openAttendance = attendanceLogs.find(
      (log) => log.memberId === memberId && log.accessGranted && !log.checkedOutAt,
    );

    if (openAttendance) {
      return {
        ...openAttendance,
        action: "duplicate",
        reason: "Este cliente ya tiene una entrada activa. Valida la salida antes de registrar otro ingreso.",
      };
    }

    const isSuspended = member.status === "Suspended";
    const isBlocked = isSuspended || member.status === "Expired" || member.daysToExpire < 0;
    const log = {
      id: crypto.randomUUID(),
      memberId: member.memberId,
      fullName: member.fullName,
      planName: member.planName,
      accessGranted: !isBlocked,
      checkedAt: new Date().toISOString(),
      checkedOutAt: null,
      action: "check-in",
      reason: isBlocked
        ? isSuspended
          ? "Plan suspendido"
          : "Plan vencido"
        : member.status === "ExpiringSoon"
          ? "Plan por vencer"
          : "Plan activo",
    };

    setAttendanceLogs((current) => [log, ...current]);
    return log;
  }

  function handleCheckOut(memberId) {
    const checkedOutAt = new Date().toISOString();
    const openAttendance = attendanceLogs.find(
      (log) => log.memberId === memberId && log.accessGranted && !log.checkedOutAt,
    );

    if (!openAttendance) {
      return null;
    }

    setAttendanceLogs((current) =>
      current.map((log) => (log.id === openAttendance.id ? { ...log, checkedOutAt } : log)),
    );

    return {
      ...openAttendance,
      checkedOutAt,
      action: "check-out",
      reason: "Salida registrada correctamente.",
    };
  }

  function handleRegisterPayment(payment) {
    setFinancialSummary((current) => {
      const updatedRevenue = current.currentMonthRevenue + payment.amount;
      const updatedReceivables = current.accountsReceivable
        .map((receivable) =>
          receivable.receivableId === payment.receivableId
            ? { ...receivable, amount: Math.max(0, receivable.amount - payment.amount) }
            : receivable,
        )
        .filter((receivable) => receivable.amount > 0);
      const updatedMonthlyRevenue = current.monthlyRevenue.map((item, index) =>
        index === current.monthlyRevenue.length - 1 ? { ...item, revenue: updatedRevenue } : item,
      );

      return {
        ...current,
        currentMonthRevenue: updatedRevenue,
        currentMonthPaidPayments: current.currentMonthPaidPayments + 1,
        monthlyRevenue: updatedMonthlyRevenue,
        accountsReceivable: updatedReceivables,
        recentPayments: [
          {
            paymentId: crypto.randomUUID(),
            memberName: payment.memberName,
            planName: payment.planName,
            amount: payment.amount,
            currency: "COP",
            method: payment.method,
            status: "Paid",
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
          },
          ...current.recentPayments,
        ],
      };
    });
  }

  function handleRenewMembership(memberId, method, startDateOverride, planNameOverride) {
    const member = members.find((item) => item.memberId === memberId);

    if (!member) {
      return;
    }

    const planChanged = Boolean(planNameOverride) && planNameOverride !== member.planName;
    const plan = plans.find((item) => item.name === (planNameOverride || member.planName));
    const durationDays = plan?.durationDays || 30;
    const startDate = startDateOverride ? new Date(`${startDateOverride}T00:00:00`) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);
    const amount = planChanged ? plan?.price || 0 : member.subscriptionValue || plan?.price || 0;

    handleUpdateMembership(memberId, {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      planName: plan?.name || member.planName,
      subscriptionValue: amount,
    });

    handleRegisterPayment({
      memberName: member.fullName,
      planName: plan?.name || member.planName,
      amount,
      method,
    });
  }

  function handleToggleSuspend(memberId) {
    setMembers((current) =>
      current.map((member) => {
        if (member.memberId !== memberId) {
          return member;
        }

        if (member.status === "Suspended") {
          return { ...member, ...calculateMembershipState(member.endDate) };
        }

        return { ...member, status: "Suspended", tailwindClass: "bg-gray-100 text-gray-800" };
      }),
    );
  }

  function handleRegisterExpense(expense) {
    setBudgets((current) =>
      current.map((budget) =>
        budget.category === expense.category
          ? { ...budget, spent: budget.spent + expense.amount }
          : budget,
      ),
    );

    setFinancialSummary((current) => {
      const updatedExpenses = current.currentMonthExpenses + expense.amount;
      const updatedMonthlyRevenue = current.monthlyRevenue.map((item, index) =>
        index === current.monthlyRevenue.length - 1 ? { ...item, expenses: updatedExpenses } : item,
      );

      return {
        ...current,
        currentMonthExpenses: updatedExpenses,
        monthlyRevenue: updatedMonthlyRevenue,
        recentExpenses: [
          {
            expenseId: crypto.randomUUID(),
            ...expense,
            createdAt: new Date().toISOString(),
          },
          ...current.recentExpenses,
        ],
      };
    });
  }

  if (!currentUser) {
    return <AuthScreen users={users} onLogin={handleLogin} onRegisterGym={handleRegisterGym} />;
  }

  return (
    <main className="app-shell min-h-screen text-slate-950 transition-colors dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-48 h-[32rem] w-[32rem] animate-float-slow rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/10" />
        <div className="absolute -bottom-64 left-1/3 h-[34rem] w-[34rem] animate-float rounded-full bg-cyan-100/40 blur-3xl dark:bg-cyan-950/10" />
      </div>

      <div className="relative mx-auto min-h-screen max-w-[1600px] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200/80 bg-white/80 px-4 py-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M6 7v10M3.5 9.5v5M18 7v10M20.5 9.5v5M6 12h12" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-slate-950 dark:text-white">GymFlow</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">Management suite</p>
            </div>
          </div>

          <div className="mt-8 px-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {isSettingsView ? "Configuracion" : "Workspace"}
            </p>
          </div>
          {isSettingsView ? (
            <button
              type="button"
              onClick={() => {
                setIsSettingsView(false);
                setActiveTab(navigationItems[0]?.id || "clients");
              }}
              className="mb-1 mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver
            </button>
          ) : null}
          <Tabs
            tabs={isSettingsView ? settingsNavigationItems : navigationItems}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="sidebar"
          />

          <div className="mt-auto space-y-3">
            <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-xl shadow-slate-950/10 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <p className="text-xs font-semibold text-emerald-300">Sistema operativo</p>
              </div>
              <p className="mt-2 text-sm font-semibold">{gymProfile.gymName}</p>
              <p className="mt-1 text-xs text-slate-400">{members.length} miembros registrados</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {currentUser.name.split(" ").map((name) => name[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{currentUser.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{getRoleLabel(currentUser.role)}</p>
              </div>
              <button
                type="button"
                onClick={() => setTheme(isDarkMode ? "light" : "dark")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
                aria-pressed={isDarkMode}
              >
                {isDarkMode ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCurrentUser(null)}
              className="h-10 w-full rounded-xl text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
            >
              Cerrar sesion
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M6 7v10M3.5 9.5v5M18 7v10M20.5 9.5v5M6 12h12" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">GymFlow</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{gymProfile.gymName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTheme(isDarkMode ? "light" : "dark")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
                >
                {isDarkMode ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" strokeLinejoin="round" />
                  </svg>
                )}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentUser(null)}
                  className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Salir
                </button>
              </div>
            </div>
          </header>

          <div className="flex items-center gap-2 border-b border-slate-200/70 bg-white/60 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60 lg:hidden">
            {isSettingsView ? (
              <button
                type="button"
                onClick={() => {
                  setIsSettingsView(false);
                  setActiveTab(navigationItems[0]?.id || "clients");
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                aria-label="Volver al menu principal"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
            <Tabs
              tabs={isSettingsView ? settingsNavigationItems : navigationItems}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="mobile"
            />
          </div>

          <div key={activeTab} className="app-content px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
            <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  {pageMeta.eyebrow}
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                  {pageMeta.title}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pageMeta.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  {hasPermission(currentUser, "membership") ? (
                    <NotificationBell expiringMembers={expiringMembers} onReviewMember={reviewExpiringMember} />
                  ) : null}
                  {hasPermission(currentUser, "setup") ? (
                    <button
                      type="button"
                      onClick={() =>
                        setIsSettingsView((current) => {
                          const next = !current;
                          setActiveTab(next ? "setup" : navigationItems[0]?.id || "clients");
                          return next;
                        })
                      }
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-emerald-600 active:translate-y-0 active:scale-95 ${
                        isSettingsView ? "ring-2 ring-emerald-300 ring-offset-2 ring-offset-white dark:ring-offset-slate-950" : ""
                      }`}
                      aria-label="Configuracion"
                      aria-pressed={isSettingsView}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.39.36.74.67 1 .31.27.7.41 1.11.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 sm:flex">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Datos sincronizados
                  </div>
                  <div className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                    {new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date())}
                  </div>
                </div>
              </div>
            </header>

            {onboarding.status === "pending_approval" ? (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold">Registro recibido, aprobacion pendiente</p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    Tu espacio ya esta disponible durante la prueba. Confirma tu correo y espera la validacion del equipo.
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold dark:bg-slate-950/40">
                  Prueba hasta{" "}
                  {new Intl.DateTimeFormat("es-CO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(onboarding.trialEndsAt))}
                </div>
              </div>
            ) : null}

            <div className="mt-6">
        {activeTab === "finance" ? (
          <FinancialDashboard
            summary={financialSummary}
            currency="COP"
            memberCount={members.length}
            members={members}
            plans={plans}
            onRegisterExpense={handleRegisterExpense}
            onRenewMembership={handleRenewMembership}
            onToggleSuspend={handleToggleSuspend}
            initialAction={financeIntent?.action || null}
            initialPaymentQuery={financeIntent?.memberName || ""}
            onInitialActionConsumed={() => setFinanceIntent(null)}
          />
        ) : null}

        {activeTab === "analytics" ? (
          <AnalyticsDashboard
            members={members}
            financialSummary={financialSummary}
            attendanceLogs={attendanceLogs}
            plans={plans}
          />
        ) : null}

        {activeTab === "clients" ? (
          <section className="space-y-6">
            {currentUser.role !== "trainer" ? (
              <ClientForm
                onCreate={handleCreateMember}
                onUpdate={handleUpdateMember}
                onCancelEdit={handleCancelEditMember}
                editingMember={editingMember}
                plans={plans}
              />
            ) : (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                Tu rol de entrenador permite consultar clientes. La creacion y las mensualidades estan reservadas para recepcion y administracion.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Base de datos</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Haz click en un usuario para seleccionarlo.</p>
              </div>
              <MembersTable
                members={members}
                selectedMemberId={selectedMember?.memberId}
                membershipFilter={membershipFilter}
                onMembershipFilterChange={setMembershipFilter}
                onSelectMember={(member) => {
                  setSelectedMemberId(member.memberId);
                  if (hasPermission(currentUser, "membership")) {
                    setActiveTab("membership");
                  } else if (hasPermission(currentUser, "progress")) {
                    setActiveTab("progress");
                  }
                }}
                onEditMember={currentUser.role !== "trainer" ? handleEditMember : undefined}
                onDeleteMember={currentUser.role !== "trainer" ? handleDeleteMember : undefined}
              />
            </div>
          </section>
        ) : null}

        {activeTab === "membership" ? (
          <div className="space-y-6">
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Clientes</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Selecciona un cliente para revisar fechas, estado y dias restantes.
                </p>
              </div>
              <MembersTable
                members={filteredMembers}
                selectedMemberId={selectedMember?.memberId}
                membershipFilter={membershipFilter}
                onMembershipFilterChange={setMembershipFilter}
                onSelectMember={(member) => setSelectedMemberId(member.memberId)}
              />
            </section>

            <MemberDetail member={selectedMember} onUpdateMembership={handleUpdateMembership} />
          </div>
        ) : null}

        {activeTab === "progress" ? (
          <section className="space-y-6">
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Seleccionar cliente</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  El historial, los objetivos y las notas se guardan por cliente.
                </p>
              </div>
              <MembersTable
                members={members}
                selectedMemberId={selectedMember?.memberId}
                onSelectMember={(member) => setSelectedMemberId(member.memberId)}
              />
            </div>

            <MemberProgress
              member={selectedMember}
              records={progressRecords}
              goals={progressGoals}
              notes={progressNotes}
              canEdit={["owner", "admin", "trainer"].includes(currentUser.role)}
              currentUser={currentUser}
              onAddMeasurement={handleAddProgressMeasurement}
              onAddGoal={handleAddProgressGoal}
              onToggleGoal={handleToggleProgressGoal}
              onAddNote={handleAddProgressNote}
            />
          </section>
        ) : null}

        {activeTab === "checkin" ? (
          <CheckInDashboard
            members={members}
            attendanceLogs={attendanceLogs}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            canReviewPayment={hasPermission(currentUser, "finance")}
            onReviewPayment={(memberId) => {
              const member = members.find((item) => item.memberId === memberId);
              setSelectedMemberId(memberId);
              setFinanceIntent({ action: "payment", memberName: member?.fullName || "" });
              setActiveTab("finance");
            }}
          />
        ) : null}

        {activeTab === "classes" ? (
          <ClassSchedule
            classes={classes}
            classCatalog={classCatalog}
            members={members}
            reservations={reservations}
            currentUser={currentUser}
            canManageClasses={["owner", "admin", "trainer"].includes(currentUser.role)}
            onCreateClassWithReservation={handleCreateClassWithReservation}
            onReserve={handleReserveClass}
            onCancelReservation={handleCancelReservation}
          />
        ) : null}

        {activeTab === "inventory" ? (
          <InventoryDashboard
            products={products}
            canManageProducts={["owner", "admin"].includes(currentUser.role)}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateStock={handleUpdateProductStock}
          />
        ) : null}

        {activeTab === "operations" ? (
          <OperationsDashboard
            budgets={budgets}
            equipment={equipment}
            shifts={shifts}
            onUpdateBudget={handleUpdateBudget}
            onCreateEquipment={handleCreateEquipment}
            onUpdateEquipmentStatus={handleUpdateEquipmentStatus}
            onCreateShift={handleCreateShift}
          />
        ) : null}

        {activeTab === "setup" ? (
          <GymSetup
            gymProfile={gymProfile}
            plans={plans}
            classCatalog={classCatalog}
            onboarding={onboarding}
            onSaveGymProfile={handleSaveGymProfile}
            onCreatePlan={handleCreatePlan}
            onDeletePlan={handleDeletePlan}
            onSaveClassTemplate={handleSaveClassTemplate}
            onDeleteClassTemplate={handleDeleteClassTemplate}
          />
        ) : null}

        {activeTab === "access" ? (
          <AccessManagement
            users={users.filter((user) => user.gymId === currentUser.gymId)}
            currentUser={currentUser}
            onCreateUser={handleCreateUser}
            onToggleUser={handleToggleUser}
          />
        ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
