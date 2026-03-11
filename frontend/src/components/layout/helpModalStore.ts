export const HELP_LS_KEY = 'sprintlab-help-dismissed';

export function isHelpDismissed() {
  return localStorage.getItem(HELP_LS_KEY) === '1';
}

export function dismissHelp() {
  localStorage.setItem(HELP_LS_KEY, '1');
}

export function undismissHelp() {
  localStorage.removeItem(HELP_LS_KEY);
}
