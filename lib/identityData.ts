/**
 * 身份信息存储模块
 * 用于保存和管理生成的身份信息
 */

export interface SavedIdentity {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string;
  phone: string;
  password: string;
  email: string;
  countryCode: string;
  countryName: string;
  createdAt: number;
}

const STORAGE_KEY = 'saved_identities';

/**
 * 获取所有保存的身份信息
 */
export function getSavedIdentities(): SavedIdentity[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * 保存身份信息列表
 */
export function saveIdentities(identities: SavedIdentity[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identities));
  } catch (error) {
    console.error('Failed to save identities:', error);
  }
}

/**
 * 添加新的身份信息
 */
export function addIdentity(identity: Omit<SavedIdentity, 'id' | 'createdAt'>): SavedIdentity {
  const identities = getSavedIdentities();
  const newIdentity: SavedIdentity = {
    ...identity,
    id: `identity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };
  identities.unshift(newIdentity); // 新的放在最前面
  saveIdentities(identities);
  return newIdentity;
}

/**
 * 删除身份信息
 */
export function removeIdentity(id: string): void {
  const identities = getSavedIdentities();
  const filtered = identities.filter(item => item.id !== id);
  saveIdentities(filtered);
}

/**
 * 检查身份信息是否已保存（通过邮箱判断）
 */
export function isIdentitySaved(email: string): boolean {
  const identities = getSavedIdentities();
  return identities.some(item => item.email === email);
}

/**
 * 清空所有保存的身份信息
 */
export function clearAllIdentities(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear identities:', error);
  }
}
