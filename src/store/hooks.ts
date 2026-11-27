import { useDispatch } from 'react-redux';
import type { AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();