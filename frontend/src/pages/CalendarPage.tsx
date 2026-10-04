import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CalendarView } from '../components/calendar/CalendarView';

/**
 * CalendarPage — calendar & appointments view.
 * Route: /calendar
 */
export const CalendarPage: React.FC = () => {
  const { handleSelectProject } = useAppContext();

  return <CalendarView onSelectProject={handleSelectProject} />;
};
