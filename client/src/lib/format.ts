export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (inputDate.getTime() === today.getTime()) {
    return `Hari ini, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (inputDate.getTime() === yesterday.getTime()) {
    return `Kemarin, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    entertainment: '🎬',
    bills: '📱',
    other: '📦',
  };
  return emojis[category] || '📦';
}

export function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    food: 'Makan',
    transport: 'Transport',
    shopping: 'Belanja',
    entertainment: 'Hiburan',
    bills: 'Tagihan',
    other: 'Lain-lain',
  };
  return names[category] || 'Lain-lain';
}
