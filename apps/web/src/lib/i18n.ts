// All UI strings are externalised (REQ-NFR-04). Content text comes from the governed content store.
import en from '../i18n/en.json';

type Dict = { [k: string]: string | Dict };
const dicts: Record<string, Dict> = { en };
let current: Dict = en;

export function setLocale(locale: string): void { current = dicts[locale] ?? en; }

export function t(key: string, vars: Record<string, string | number> = {}): string {
  const value = key.split('.').reduce<string | Dict | undefined>((d, k) => (typeof d === 'object' ? d[k] : undefined), current);
  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (_, v: string) => String(vars[v] ?? `{${v}}`));
}
