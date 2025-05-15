import { useState, useCallback } from "react";

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * A hook for managing modal state
 * @returns Object with isOpen state and open/close/toggle functions
 */
export const useModal = (initialState = false): UseModalReturn => {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, open, close, toggle };
};

export default useModal;
