// Reglas de contrasena para el registro de gimnasios.
//
// El backend solo exige 8 caracteres (AuthController.RegisterGym). Esto es mas estricto del lado
// del cliente: sirve para guiar a quien crea la cuenta, no como control de seguridad. La validacion
// que cuenta es la del servidor, y quien quiera saltarse esto puede llamar a la API directamente.

export const MIN_LENGTH = 8;

// Rechaza lo que primero prueba cualquier ataque de diccionario, aunque cumpla las demas reglas.
const COMMON = [
  "12345678", "123456789", "1234567890", "password", "password1", "contrasena", "contraseña",
  "qwerty123", "iloveyou", "admin123", "gimnasio", "gymgymgym", "abc12345", "11111111",
];

export const RULES = [
  { id: "length", label: `Al menos ${MIN_LENGTH} caracteres`, test: (v) => v.length >= MIN_LENGTH },
  { id: "lower", label: "Una letra minuscula", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "Una letra mayuscula", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "Un numero", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "Un simbolo (!, @, #, ...)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/**
 * Evalua una contrasena y devuelve el detalle por regla mas un puntaje 0-4 para la barra.
 * El puntaje no es solo "reglas cumplidas": la longitud pesa, y una contrasena comun se hunde
 * aunque tenga de todo, porque "Password1!" cumple las cinco reglas y sigue siendo mala.
 */
export function evaluatePassword(password) {
  const value = password || "";
  const results = RULES.map((rule) => ({ ...rule, passed: rule.test(value) }));
  const passedCount = results.filter((rule) => rule.passed).length;
  const isCommon = COMMON.some((entry) => value.toLowerCase().includes(entry));

  // Valida = cumple todas las reglas y no es una contrasena obvia.
  const isValid = passedCount === RULES.length && !isCommon;

  let score = 0;
  if (value.length > 0) {
    score = Math.max(0, passedCount - 1); // 0-4
    if (value.length >= 12 && passedCount >= 4) score = 4;
    if (value.length < MIN_LENGTH) score = Math.min(score, 1);
    if (isCommon) score = Math.min(score, 1);
  }

  const labels = ["Muy debil", "Debil", "Aceptable", "Fuerte", "Muy fuerte"];

  return {
    rules: results,
    score,
    label: value ? labels[score] : "",
    isCommon,
    isValid,
  };
}

export const STRENGTH_STYLES = [
  { bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", width: "20%" },
  { bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", width: "35%" },
  { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", width: "60%" },
  { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", width: "85%" },
  { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", width: "100%" },
];
