// NOT FOR GENERAL USE. Only works for positive values.
function pad2(i: number) {
  const s = String(i);
  return s.length >= 2 ? s : ("0" + s).slice(-2);
}

/**
 * Appropriate for filenames: yMMddHHmmss
 */
export function fmtYMDHMS(d: Date): string {
  return (
    d.getFullYear() +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds())
  );
}
