import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CanvasInteractionContextType {
  isDraggingItem: boolean;
  setIsDraggingItem: (value: boolean) => void;
}

const CanvasInteractionContext = createContext<CanvasInteractionContextType | undefined>(undefined);

export const CanvasInteractionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDraggingItem, setIsDraggingItem] = useState(false);

  return (
    <CanvasInteractionContext.Provider value={{ isDraggingItem, setIsDraggingItem }}>
      {children}
    </CanvasInteractionContext.Provider>
  );
};

export const useCanvasInteraction = () => {
  const context = useContext(CanvasInteractionContext);
  if (!context) {
    throw new Error('useCanvasInteraction must be used within CanvasInteractionProvider');
  }
  return context;
};
