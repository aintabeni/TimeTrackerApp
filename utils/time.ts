
import { MINUTES_IN_DAY } from '../constants';

export const minutesToPercent = (minutes: number): number => {
  return (minutes / MINUTES_IN_DAY) * 100;
};

export const formatTime = (minutes: number): string => {
  let h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  
  h = h % 12;
  h = h ? h : 12; // the hour '0' should be '12'
  
  const mins = m < 10 ? `0${m}` : `${m}`;
  
  return `${h}:${mins} ${ampm}`;
};
