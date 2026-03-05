import { useUIStore } from '@/stores/uiStore';

/**
 * Centralized error handling hook with toast notifications
 * Provides consistent error handling across the application
 */
export function useErrorHandler() {
  const { success: showSuccess, error: showError } = useUIStore();

  return {
    /**
     * Handle errors with user-friendly toast notifications
     * @param error - The error object or unknown error
     * @param fallbackMessage - Message to show if error cannot be parsed
     */
    handleError: (error: unknown, fallbackMessage: string) => {
      const message = error instanceof Error
        ? error.message
        : fallbackMessage;
      showError(message);
      console.error('Error:', error);
    },

    /**
     * Show success toast notification
     * @param message - Success message to display
     */
    handleSuccess: (message: string) => {
      showSuccess(message);
    },
  };
}
