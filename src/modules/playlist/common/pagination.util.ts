export function getOffsetAndLimit(page: number, per: number = 8) {
  const offset = (page - 1) * per;
  const limit = per;

  return { offset, limit };
}
