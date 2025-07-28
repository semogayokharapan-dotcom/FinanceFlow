export function generatePrivateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'SK-';
  
  // Generate 32 character secure key
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

export function validatePrivateKey(key: string): boolean {
  return key.startsWith('SK-') && key.length >= 35;
}
