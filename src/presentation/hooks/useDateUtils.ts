import { useCallback } from 'react';

/**
 * Custom hook for date utilities
 * Provides common date operations for the standup application
 */
export function useDateUtils() {
  const VANCOUVER_TIMEZONE = 'America/Vancouver';

  /**
   * Get a date in Vancouver timezone as YYYY-MM-DD string
   */
  const getVancouverDate = useCallback((date: Date = new Date()) => {
    return date.toLocaleDateString('en-CA', {
      timeZone: VANCOUVER_TIMEZONE
    });
  }, []);

  /**
   * Get the previous business day date
   * - Monday → Friday (3 days back)
   * - Sunday → Friday (2 days back) 
   * - Other days → Yesterday (1 day back)
   */
  const getPreviousBusinessDay = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    let targetDate: Date;
    
    if (dayOfWeek === 1) { // Monday
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 3);
    } else if (dayOfWeek === 0) { // Sunday
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 2);
    } else { // Tuesday through Saturday
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 1);
    }
    
    return getVancouverDate(targetDate);
  }, [getVancouverDate]);

  /**
   * Get the start of current week (Monday) in Vancouver timezone
   */
  const getWeekStartDate = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    
    return getVancouverDate(monday);
  }, [getVancouverDate]);

  /**
   * Get the end of current week (Sunday) in Vancouver timezone
   */
  const getWeekEndDate = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + daysToSunday);
    
    return getVancouverDate(sunday);
  }, [getVancouverDate]);

  /**
   * Get the previous week's date range
   */
  const getPreviousWeekDates = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToMonday - 7);
    
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    
    return {
      weekStart: getVancouverDate(lastMonday),
      weekEnd: getVancouverDate(lastSunday)
    };
  }, [getVancouverDate]);

  /**
   * Get the current week's date range
   */
  const getCurrentWeekDates = useCallback(() => {
    return {
      weekStart: getWeekStartDate(),
      weekEnd: getWeekEndDate()
    };
  }, [getWeekStartDate, getWeekEndDate]);

  /**
   * Format a date string for display
   */
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  /**
   * Get today's date formatted for display
   */
  const getTodayFormatted = useCallback(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  /**
   * Check if a date is today
   */
  const isToday = useCallback((dateString: string) => {
    const today = getVancouverDate();
    return dateString === today;
  }, [getVancouverDate]);

  /**
   * Check if a date is yesterday
   */
  const isYesterday = useCallback((dateString: string) => {
    const yesterday = getPreviousBusinessDay();
    return dateString === yesterday;
  }, [getPreviousBusinessDay]);

  /**
   * Get the number of days between two dates
   */
  const getDaysBetween = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  /**
   * Get all dates in a week range
   */
  const getWeekDates = useCallback((weekStart: string, weekEnd: string) => {
    const dates: string[] = [];
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(getVancouverDate(date));
    }
    
    return dates;
  }, [getVancouverDate]);

  return {
    getVancouverDate,
    getPreviousBusinessDay,
    getWeekStartDate,
    getWeekEndDate,
    getPreviousWeekDates,
    getCurrentWeekDates,
    formatDate,
    getTodayFormatted,
    isToday,
    isYesterday,
    getDaysBetween,
    getWeekDates
  };
}
