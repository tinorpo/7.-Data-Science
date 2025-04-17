import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ShiftCalendar = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await axios.get('/api/shifts/me');
        setShifts(res.data);
      } catch (err) {
        console.error('Error fetching shifts:', err);
        setError('Failed to load shifts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate shift duration in hours
  const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours.toFixed(1);
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Navigate to current month
  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Check if a day has shifts
  const hasShifts = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(year, month, day + 1);
    nextDate.setHours(0, 0, 0, 0);
    
    return shifts.some(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= date && shiftDate < nextDate;
    });
  };

  // Get shifts for a specific day
  const getShiftsForDay = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(year, month, day + 1);
    nextDate.setHours(0, 0, 0, 0);
    
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= date && shiftDate < nextDate;
    });
  };

  // Handle day click
  const handleDayClick = (day) => {
    const dayShifts = getShiftsForDay(day);
    if (dayShifts.length > 0) {
      setSelectedShift(dayShifts[0]);
    } else {
      setSelectedShift(null);
    }
  };

  // Render calendar
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    
    // Create array of day numbers (1-31)
    const days = [...Array(daysInMonth).keys()].map(i => i + 1);
    
    // Create array of empty cells for days before first day of month
    const emptyCells = [...Array(firstDayOfMonth).keys()].map(i => null);
    
    // Combine empty cells and days
    const allCells = [...emptyCells, ...days];
    
    // Create rows (weeks)
    const rows = [];
    let cells = [];
    
    allCells.forEach((day, i) => {
      if (i > 0 && i % 7 === 0) {
        rows.push(cells);
        cells = [];
      }
      cells.push(day);
    });
    
    // Add remaining cells
    if (cells.length > 0) {
      rows.push(cells);
    }
    
    // Get today's date
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const currentDay = today.getDate();
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {monthName} {year}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={prevMonth}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              &lt;
            </button>
            <button 
              onClick={goToToday}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Today
            </button>
            <button 
              onClick={nextMonth}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              &gt;
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-100 text-center py-2 font-semibold">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {rows.map((row, rowIndex) => (
              row.map((day, colIndex) => (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className={`bg-white min-h-[80px] p-2 ${
                    day === null ? 'bg-gray-50' : 
                    isCurrentMonth && day === currentDay ? 'bg-blue-50' : 
                    ''
                  } ${
                    hasShifts(day) ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => day !== null && handleDayClick(day)}
                >
                  {day !== null && (
                    <>
                      <div className={`text-right ${
                        isCurrentMonth && day === currentDay ? 'font-bold text-blue-600' : ''
                      }`}>
                        {day}
                      </div>
                      {hasShifts(day) && (
                        <div className="mt-1">
                          <div className="bg-blue-100 text-blue-800 text-xs rounded p-1">
                            {getShiftsForDay(day).length} shift(s)
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Shifts</h1>
      
      {error && (
        <div className="alert alert-danger mb-6">{error}</div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {renderCalendar()}
        </div>
        
        <div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Shift Details</h2>
            
            {selectedShift ? (
              <div>
                <div className="mb-4">
                  <p className="text-lg font-medium">{formatDate(selectedShift.startTime)}</p>
                  <p className="text-gray-600">
                    {formatTime(selectedShift.startTime)} - {formatTime(selectedShift.endTime)}
                  </p>
                  <p className="text-gray-600">
                    Duration: {calculateDuration(selectedShift.startTime, selectedShift.endTime)} hours
                  </p>
                </div>
                
                {selectedShift.notes && (
                  <div className="mb-4">
                    <h3 className="font-medium">Notes:</h3>
                    <p className="text-gray-600">{selectedShift.notes}</p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button className="btn btn-primary">
                    Request Exchange
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select a shift to view details</p>
            )}
          </div>
          
          <div className="card mt-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Shifts</h2>
            
            {shifts.length === 0 ? (
              <p className="text-gray-500">No upcoming shifts found.</p>
            ) : (
              <div className="space-y-4">
                {shifts
                  .filter(shift => new Date(shift.startTime) >= new Date())
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                  .slice(0, 5)
                  .map(shift => (
                    <div 
                      key={shift._id} 
                      className={`border rounded p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedShift && selectedShift._id === shift._id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedShift(shift)}
                    >
                      <p className="font-medium">{new Date(shift.startTime).toLocaleDateString()}</p>
                      <p className="text-gray-600">
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </p>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftCalendar;
