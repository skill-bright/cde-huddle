import { useState, useEffect, useMemo } from 'react';
import { StandupEntry } from '@/domain/entities/StandupEntry';
import { DateRange } from '@/domain/value-objects/DateRange';
import { DateFormatter } from '@/domain/services/DateFormatter';
import { GetStandupHistoryUseCase } from '@/application/use-cases/GetStandupHistoryUseCase';
import { SupabaseStandupRepository } from '@/infrastructure/repositories/SupabaseStandupRepository';

/**
 * Custom hook for managing standup history
 * Follows clean architecture by using use cases
 */
export function useStandupHistory() {
  const [history, setHistory] = useState<StandupEntry[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthDisplayNames, setMonthDisplayNames] = useState<Record<string, string>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize use case
  const getStandupHistoryUseCase = useMemo(
    () => new GetStandupHistoryUseCase(new SupabaseStandupRepository()),
    []
  );

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [historyData, months, displayNames] = await Promise.all([
          getStandupHistoryUseCase.getAllHistory(),
          getStandupHistoryUseCase.getAvailableMonths(),
          getStandupHistoryUseCase.getMonthDisplayNames()
        ]);

        setHistory(historyData);
        setAvailableMonths(months);
        setMonthDisplayNames(displayNames);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getStandupHistoryUseCase]);

  // Filter history based on selected month
  const filteredHistory = useMemo(() => {
    if (selectedMonth === 'all') {
      return history;
    }

    const dateRange = DateRange.forMonth(
      parseInt(selectedMonth.split('-')[0]),
      parseInt(selectedMonth.split('-')[1])
    );

    return history.filter(entry => dateRange.contains(entry.date));
  }, [history, selectedMonth]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    return DateFormatter.formatStandupDate(dateString);
  };

  // Format creation date for display
  const formatCreationDate = (dateString: string): string => {
    return DateFormatter.formatCreationDate(dateString);
  };

  // Get month display name
  const getMonthDisplayName = (monthKey: string): string => {
    return monthDisplayNames[monthKey] || monthKey;
  };

  return {
    history: filteredHistory,
    availableMonths,
    monthDisplayNames,
    selectedMonth,
    loading,
    error,
    setSelectedMonth,
    formatDate,
    formatCreationDate,
    getMonthDisplayName
  };
}
