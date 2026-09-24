import { createContext, useContext } from 'react';

export const ModalContext = createContext<{ popoverLayer: HTMLElement | null }>({ popoverLayer: null });
export const useModalPopoverLayer = () => useContext(ModalContext).popoverLayer;
