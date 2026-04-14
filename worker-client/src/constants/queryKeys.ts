

export const QUERY_KEYS = {
    categories:  ['categories'],
    workers:     ['workers'],
    bookings:    (userId: string) => ['bookings', userId],
    workerSlots: (workerId: string) => ['slots', workerId],
    chat:        (roomId: string) => ['chat', roomId],
  } as const