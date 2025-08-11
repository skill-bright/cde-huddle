export function getPreviousBusinessDay(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  if (dayOfWeek === 1) { // Monday
    return 'Friday';
  } else if (dayOfWeek === 0) { // Sunday (shouldn't happen in business context, but handle it)
    return 'Friday';
  } else {
    return 'yesterday';
  }
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