const VANCOUVER_TIMEZONE = 'America/Vancouver';

/**
 * Get a date in Vancouver timezone as YYYY-MM-DD string
 */
const getVancouverDate = (date: Date = new Date()) => {
  return date.toLocaleDateString('en-CA', {
    timeZone: VANCOUVER_TIMEZONE
  });
};

export function getPreviousBusinessDay(): string {
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
}

export function getTodayLabel(): string {
  return 'today';
}

export function getPreviousBusinessDayLabel(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  if (dayOfWeek === 1) { // Monday
    return 'What did you do on Friday?';
  } else {
    return 'What did you do yesterday?';
  }
}

export function getTodayPlanLabel(): string {
  return 'What will you do today?';
}