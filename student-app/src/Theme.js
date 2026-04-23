import React, { createContext, useContext, useState } from 'react';

export const darkTheme = {
  bg: '#0e0f0e',
  bg2: '#181a18',
  bg3: '#1f221f',
  border: '#2e322e',
  border2: '#3a3f3a',
  text: '#e8ebe5',
  text2: '#9ea89e',
  text3: '#5a635a',
  accent: '#c8f135',
  accentDim: 'rgba(200,241,53,0.12)',
  red: '#ff4d4d',
  redDim: 'rgba(255,77,77,0.12)',
  green: '#4dff9b',
  greenDim: 'rgba(77,255,155,0.12)',
};

export const lightTheme = {
  bg: '#f8f9f8',
  bg2: '#ffffff',
  bg3: '#f0f2f0',
  border: '#dcdedc',
  border2: '#c4c6c4',
  text: '#111111',
  text2: '#444a44',
  text3: '#777d77',
  accent: '#6d8a00',
  accentDim: 'rgba(142,179,0,0.12)',
  red: '#e60000',
  redDim: 'rgba(230,0,0,0.12)',
  green: '#00b34a',
  greenDim: 'rgba(0,179,74,0.12)',
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isLight, setIsLight] = useState(false);
  const theme = isLight ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ Theme: theme, isLight, toggleTheme: () => setIsLight(!isLight) }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
