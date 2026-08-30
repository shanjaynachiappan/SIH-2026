import React, { createContext, useContext, useState, useEffect } from 'react';
import { MineInfo } from '../types/central';
import { centralApiService } from '../services/centralApiService';

interface MineContextType {
  mines: MineInfo[];
  selectedMineId: string;
  setSelectedMineId: (mineId: string) => void;
  selectedMine: MineInfo | undefined;
}

const MineContext = createContext<MineContextType | undefined>(undefined);

export const MineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mines, setMines] = useState<MineInfo[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('MINE-01');

  useEffect(() => {
    const loadMines = async () => {
      const list = await centralApiService.getMines();
      setMines(list);
    };
    loadMines();
  }, []);

  const selectedMine = mines.find(m => m.id === selectedMineId);

  return (
    <MineContext.Provider
      value={{
        mines,
        selectedMineId,
        setSelectedMineId,
        selectedMine,
      }}
    >
      {children}
    </MineContext.Provider>
  );
};

export const useMine = (): MineContextType => {
  const context = useContext(MineContext);
  if (!context) {
    throw new Error('useMine must be used within a MineProvider');
  }
  return context;
};
