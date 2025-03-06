export function convertFirestoreTimestamp(timestamp: { seconds: number; nanoseconds: number }): Date {
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
}
