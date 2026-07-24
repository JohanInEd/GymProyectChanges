// Maps API DTOs onto the shapes the UI components already consume (the same shapes the local
// demo data uses), so the components themselves need no changes.

export function toMember(dto) {
  return {
    memberId: dto.memberId,
    fullName: dto.fullName,
    email: dto.email || "",
    phone: dto.phone || "",
    gender: dto.gender || "",
    age: dto.age ?? null,
    planId: dto.planId ?? null,
    planName: dto.planName || "",
    startDate: dto.startDate || "",
    endDate: dto.endDate || "",
    daysToExpire: dto.daysToExpire,
    status: dto.status,
    visualColor: dto.visualColor,
    tailwindClass: dto.tailwindClass,
    bodyMetrics: {
      heightCm: dto.bodyMetrics?.heightCm ?? null,
      weightKg: dto.bodyMetrics?.weightKg ?? null,
      chestCm: dto.bodyMetrics?.chestCm ?? null,
      armCm: dto.bodyMetrics?.armCm ?? null,
      waistCm: dto.bodyMetrics?.waistCm ?? null,
      hipCm: dto.bodyMetrics?.hipCm ?? null,
      legCm: dto.bodyMetrics?.legCm ?? null,
    },
  };
}

export function toPlan(dto) {
  return {
    id: dto.id,
    name: dto.name,
    price: dto.price,
    durationDays: dto.durationDays,
    maxClasses: dto.maxClasses ?? null,
    description: dto.description || "",
  };
}

export function toClassTemplate(dto) {
  return {
    id: dto.id,
    name: dto.name,
    coach: dto.coach || "",
    duration: dto.duration,
    capacity: dto.capacity,
    room: dto.room || "",
  };
}

export function toGymClass(dto) {
  return {
    id: dto.id,
    name: dto.name,
    coach: dto.coach || "",
    date: dto.date,
    time: dto.time,
    duration: dto.duration,
    capacity: dto.capacity,
    room: dto.room || "",
  };
}

// The API nests reservations inside each class; the UI keeps them in a flat list.
export function toReservations(classDtos) {
  return (classDtos || []).flatMap((gymClass) =>
    (gymClass.reservations || []).map((reservation) => ({
      id: reservation.id,
      classId: reservation.classId,
      memberId: reservation.memberId,
      status: reservation.status,
      createdAt: reservation.createdAt,
    })),
  );
}

export function toProduct(dto) {
  return {
    id: dto.id,
    sku: dto.sku,
    name: dto.name,
    category: dto.category || "",
    price: dto.price,
    stock: dto.stock,
    minimumStock: dto.minimumStock,
  };
}

export function toBudget(dto) {
  return { category: dto.category, limit: dto.monthlyLimit, spent: dto.spent };
}

export function toEquipment(dto) {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category || "",
    status: dto.status,
    nextMaintenance: dto.nextMaintenance || "",
  };
}

export function toShift(dto) {
  return {
    id: dto.id,
    employee: dto.employee,
    role: dto.role || "",
    date: dto.date,
    start: dto.startTime,
    end: dto.endTime,
    commission: dto.commission,
  };
}

export function toFinancialSummary(dto) {
  return {
    currentMonthRevenue: dto.currentMonthRevenue,
    previousMonthRevenue: dto.previousMonthRevenue,
    currentMonthExpenses: dto.currentMonthExpenses,
    currentMonthPaidPayments: dto.currentMonthPaidPayments,
    monthlyRevenue: dto.monthlyRevenue || [],
    // Serie completa desde el primer movimiento; alimenta el filtro por año del grafico.
    monthlyHistory: (dto.monthlyHistory || []).map((item) => ({
      year: item.year,
      monthNumber: item.month,
      month: item.monthLabel,
      revenue: item.revenue,
      expenses: item.expenses,
      users: item.users,
    })),
    accountsReceivable: (dto.accountsReceivable || []).map((item) => ({
      receivableId: item.receivableId,
      memberName: item.memberName,
      planName: item.planName || "",
      amount: item.amount,
      dueDate: item.dueDate || "",
    })),
    recentPayments: (dto.recentPayments || []).map((item) => ({
      paymentId: item.id,
      memberName: item.memberName,
      planName: item.planName || "",
      amount: item.amount,
      currency: item.currency,
      method: item.method,
      status: item.status,
      createdAt: item.createdAt,
      paidAt: item.paidAt,
    })),
    recentExpenses: (dto.recentExpenses || []).map((item) => ({
      expenseId: item.id,
      category: item.category,
      description: item.description || "",
      amount: item.amount,
      expenseDate: item.expenseDate,
      paymentMethod: item.paymentMethod || "",
      provider: item.provider || "",
      createdAt: item.createdAt,
    })),
  };
}

export function toAttendanceLog(dto) {
  return {
    id: dto.attendanceId,
    memberId: dto.memberId,
    fullName: dto.memberName,
    planName: dto.planName || "",
    accessGranted: dto.accessGranted,
    checkedAt: dto.checkedInAt,
    checkedOutAt: dto.checkedOutAt,
    // Cuando es true, checkedOutAt es el corte configurado, no una salida real.
    autoClosed: Boolean(dto.autoClosed),
    reason: dto.reason,
  };
}

export function toStaffUser(dto, gymId) {
  return {
    id: dto.id,
    gymId,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    active: dto.active,
    isDemo: false,
  };
}

export function toGymProfile(dto) {
  return {
    gymName: dto.gymName,
    country: dto.country || "",
    city: dto.city || "",
    adminName: dto.adminName,
    adminEmail: dto.adminEmail,
    adminPhone: dto.phone || "",
    adminRole: "Propietario",
  };
}
