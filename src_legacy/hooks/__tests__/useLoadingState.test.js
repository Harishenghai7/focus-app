/**
 * Unit Tests for useLoadingState Hook
 */

import { renderHook, act } from '@testing-library/react';
import {
  useLoadingState,
  useMultipleLoadingStates,
  useDebouncedLoading,
  useMinimumLoadingTime,
  useAsyncOperation
} from '../useLoadingState';

describe('useLoadingState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLoadingState());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('should initialize with custom initial state', () => {
    const { result } = renderHook(() => useLoadingState(true));
    expect(result.current.isLoading).toBe(true);
  });

  it('should start loading', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.startLoading();
    });
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should stop loading', () => {
    const { result } = renderHook(() => useLoadingState(true));
    
    act(() => {
      result.current.stopLoading();
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should set success state', () => {
    const { result } = renderHook(() => useLoadingState());
    const testData = { id: 1, name: 'Test' };
    
    act(() => {
      result.current.setSuccess(testData);
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toEqual(testData);
  });

  it('should set failure state', () => {
    const { result } = renderHook(() => useLoadingState());
    const testError = new Error('Test error');
    
    act(() => {
      result.current.setFailure(testError);
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(testError);
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useLoadingState());
    
    act(() => {
      result.current.setSuccess({ data: 'test' });
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('should execute async function successfully', async () => {
    const { result } = renderHook(() => useLoadingState());
    const asyncFn = jest.fn().mockResolvedValue('success');
    
    await act(async () => {
      const res = await result.current.execute(asyncFn);
      expect(res).toBe('success');
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe('success');
    expect(result.current.error).toBe(null);
  });

  it('should handle async function errors', async () => {
    const { result } = renderHook(() => useLoadingState());
    const testError = new Error('Async error');
    const asyncFn = jest.fn().mockRejectedValue(testError);
    
    await act(async () => {
      try {
        await result.current.execute(asyncFn);
      } catch (error) {
        expect(error).toEqual(testError);
      }
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(testError);
  });
});

describe('useMultipleLoadingStates', () => {
  it('should initialize with all states false', () => {
    const { result } = renderHook(() => 
      useMultipleLoadingStates(['action1', 'action2', 'action3'])
    );
    
    expect(result.current.loadingStates.action1).toBe(false);
    expect(result.current.loadingStates.action2).toBe(false);
    expect(result.current.loadingStates.action3).toBe(false);
    expect(result.current.isAnyLoading).toBe(false);
    expect(result.current.isAllLoading).toBe(false);
  });

  it('should set individual loading states', () => {
    const { result } = renderHook(() => 
      useMultipleLoadingStates(['action1', 'action2'])
    );
    
    act(() => {
      result.current.setLoading('action1', true);
    });
    
    expect(result.current.loadingStates.action1).toBe(true);
    expect(result.current.loadingStates.action2).toBe(false);
    expect(result.current.isAnyLoading).toBe(true);
    expect(result.current.isAllLoading).toBe(false);
  });

  it('should detect when all are loading', () => {
    const { result } = renderHook(() => 
      useMultipleLoadingStates(['action1', 'action2'])
    );
    
    act(() => {
      result.current.setLoading('action1', true);
      result.current.setLoading('action2', true);
    });
    
    expect(result.current.isAnyLoading).toBe(true);
    expect(result.current.isAllLoading).toBe(true);
  });
});

describe('useDebouncedLoading', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should delay showing loading state', () => {
    const { result } = renderHook(() => useDebouncedLoading(300));
    const [showLoading, setIsLoading] = result.current;
    
    expect(showLoading).toBe(false);
    
    act(() => {
      setIsLoading(true);
    });
    
    // Should not show immediately
    expect(result.current[0]).toBe(false);
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should now show loading
    expect(result.current[0]).toBe(true);
  });

  it('should hide loading immediately', () => {
    const { result } = renderHook(() => useDebouncedLoading(300));
    
    act(() => {
      result.current[1](true);
    });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(result.current[0]).toBe(true);
    
    act(() => {
      result.current[1](false);
    });
    
    // Should hide immediately
    expect(result.current[0]).toBe(false);
  });
});

describe('useMinimumLoadingTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should enforce minimum loading time', async () => {
    const { result } = renderHook(() => useMinimumLoadingTime(500));
    const [isLoading, startLoading, stopLoading] = result.current;
    
    expect(isLoading).toBe(false);
    
    act(() => {
      startLoading();
    });
    
    expect(result.current[0]).toBe(true);
    
    // Try to stop immediately
    await act(async () => {
      const stopPromise = stopLoading();
      jest.advanceTimersByTime(500);
      await stopPromise;
    });
    
    expect(result.current[0]).toBe(false);
  });
});

describe('useAsyncOperation', () => {
  it('should execute async operation successfully', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const asyncFn = jest.fn().mockResolvedValue('success');
    const onSuccess = jest.fn();
    
    await act(async () => {
      await result.current.execute(asyncFn, { onSuccess });
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe('success');
    expect(result.current.error).toBe(null);
    expect(onSuccess).toHaveBeenCalledWith('success');
  });

  it('should handle async operation errors', async () => {
    const { result } = renderHook(() => useAsyncOperation());
    const testError = new Error('Test error');
    const asyncFn = jest.fn().mockRejectedValue(testError);
    const onError = jest.fn();
    
    await act(async () => {
      try {
        await result.current.execute(asyncFn, { onError });
      } catch (error) {
        expect(error).toEqual(testError);
      }
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(testError);
    expect(onError).toHaveBeenCalledWith(testError);
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useAsyncOperation());
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });
});
