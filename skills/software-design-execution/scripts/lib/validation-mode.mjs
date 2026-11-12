export function validationMode(value = "execution") {
  if (!["planning", "execution"].includes(value)) throw new Error("Unknown validation mode: " + value + "; use planning|execution.");
  return value;
}
