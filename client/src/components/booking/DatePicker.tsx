import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  onDateChange: (startDate: Date, endDate: Date) => void;
}

export default function DatePicker({ onDateChange }: DatePickerProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (selectedDate > startDate) {
      setEndDate(selectedDate);
      onDateChange(startDate, selectedDate);
    } else {
      setStartDate(selectedDate);
      setEndDate(null);
    }
  };

  const days = [];
  const blanks = firstDayOfMonth(currentMonth);
  const daysCount = daysInMonth(currentMonth);

  for (let i = 0; i < blanks; i++) {
    days.push(<div key={`blank-${i}`} />);
  }

  for (let i = 1; i <= daysCount; i++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
    const isSelected =
      (startDate && startDate.toDateString() === date.toDateString()) ||
      (endDate && endDate.toDateString() === date.toDateString());
    const isInRange =
      startDate &&
      endDate &&
      date > startDate &&
      date < endDate;

    days.push(
      <button
        key={i}
        onClick={() => handleDateClick(i)}
        className={`p-2 rounded-lg text-sm font-semibold transition-colors ${
          isSelected
            ? 'bg-accent text-accent-foreground'
            : isInRange
            ? 'bg-accent/15 text-accent'
            : 'hover:bg-white/10 text-foreground'
        }`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif text-xl">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-1.5 rounded-full hover:bg-white/10 hover:text-accent transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-1.5 rounded-full hover:bg-white/10 hover:text-accent transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center label-caps !text-[9px] !text-muted-foreground p-2">
            {day}
          </div>
        ))}
        {days}
      </div>

      {startDate && endDate && (
        <div className="mt-5 p-3 rounded-lg border border-accent/30 bg-accent/5 text-sm">
          <p className="text-foreground">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
