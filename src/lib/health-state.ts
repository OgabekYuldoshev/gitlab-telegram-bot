export function createHealthState() {
  let error = false;
  return {
    hasError() {
      return error;
    },
    setError(value: boolean) {
      error = value;
    },
  };
}
