import { create } from 'zustand';
import { format, subDays } from 'date-fns';

export const CATEGORIES = [
  'fashion',
  'electronics',
  'bags',
  'footwear',
  'groceries',
  'beauty',
  'wellness',
  'jewellery',
];

export const useAdminFiltersStore = create((set) => ({
  dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  dateTo: format(new Date(), 'yyyy-MM-dd'),
  category: '',
  season: '',
  setFilters: (patch) => set(patch),
}));
