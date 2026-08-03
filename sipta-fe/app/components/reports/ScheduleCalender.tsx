import React, { useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar';
import moment from 'moment';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { Schedule } from '@/src/domain/ReportEntity';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('id');
const localizer = momentLocalizer(moment);

interface CalendarEvent extends Event {
  resource: Schedule;
}

interface ScheduleCalendarProps {
  schedules: Schedule[];
  onSelectSchedule?: (schedule: Schedule) => void;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  schedules,
  onSelectSchedule,
}) => {
  const [currentView, setCurrentView] = useState<View>('month');

  const events: CalendarEvent[] = useMemo(() => {
    try {
      return schedules.map(schedule => {
        // Validasi date untuk menghindari error
        const startDate = schedule.start ? new Date(schedule.start) : new Date();
        const endDate = schedule.end ? new Date(schedule.end) : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 jam
        
        return {
          id: schedule.id || `event-${Math.random()}`,
          title: schedule.title || 'Jadwal',
          start: startDate,
          end: endDate,
          resource: schedule
        };
      });
    } catch (error) {
      console.error('Error processing schedule events:', error);
      return [];
    }
  }, [schedules]);

  const handleSelectEvent = (event: CalendarEvent) => {
    if (onSelectSchedule && event.resource) {
      onSelectSchedule(event.resource);
    }
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  const calendarStyle = {
    height: '100%',
    minHeight: '320px'
  };

  // Custom event styles
  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: '#2563eb',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        padding: '2px 6px',
        color: 'white',
        cursor: 'pointer'
      }
    };
  };

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <CalendarIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold">Kalender Jadwal</div>
          <div className="text-xs text-gray-500">Jadwal pembelajaran dan aktivitas</div>
        </div>
      </div>
      
      <div className="h-80 sm:h-96 min-h-[320px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          onView={handleViewChange}
          view={currentView}
          views={['month', 'week', 'day']}
          defaultView="month"
          popup
          style={calendarStyle}
          messages={{
            next: "Berikutnya",
            previous: "Sebelumnya",
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari",
            agenda: "Agenda",
            date: "Tanggal",
            time: "Waktu",
            event: "Acara",
            noEventsInRange: "Tidak ada jadwal dalam rentang ini"
          }}
          eventPropGetter={eventStyleGetter}
          step={60}
          showMultiDayTimes
          defaultDate={new Date()}
          // Untuk mobile responsiveness
          length={7}
        />
      </div>
    </div>
  );
};