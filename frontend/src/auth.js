export const roleConfig = {
  owner: {
    label: "Propietario",
    description: "Acceso completo, usuarios, finanzas y configuracion.",
    permissions: ["finance", "analytics", "clients", "checkin", "membership", "progress", "classes", "inventory", "operations", "setup", "users"],
  },
  admin: {
    label: "Administrador",
    description: "Gestion operativa, financiera, comercial y seguimiento de clientes.",
    permissions: ["finance", "analytics", "clients", "checkin", "membership", "progress", "classes", "inventory", "operations", "setup"],
  },
  reception: {
    label: "Recepcion",
    description: "Clientes, mensualidades, reservas, inventario y control de acceso.",
    permissions: ["clients", "checkin", "membership", "classes", "inventory"],
  },
  trainer: {
    label: "Entrenador",
    description: "Consulta de clientes, progreso corporal y gestion de clases.",
    permissions: ["clients", "progress", "classes"],
  },
};

export function hasPermission(user, permission) {
  return Boolean(user?.active && roleConfig[user.role]?.permissions.includes(permission));
}

export function getRoleLabel(role) {
  return roleConfig[role]?.label || role;
}
