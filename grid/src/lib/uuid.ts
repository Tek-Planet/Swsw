// lib/uuid.ts
export async function generateUUID() {
    const { v4 } = await import('uuid');
    return v4();
  }
  