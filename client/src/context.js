import React, { createContext, useContext, useState } from 'react';

// Create a context
const CustomContext = createContext();

// Create a custom hook to use the context
export const useCustomContext = () => {
  const context = useContext(CustomContext);
  if (!context) {
    throw new Error('useCustomContext must be used within a CustomContextProvider');
  }
  return context;
};

// Create a provider component
export const CustomContextProvider = ({ children }) => {
  const [contextValue, setContextValue] = useState(/* Initial context value */);

  // Function to update context value
  const updateContextValue = (newValue) => {
    setContextValue(newValue);
  };

  return (
    <CustomContext.Provider value={{ contextValue, updateContextValue }}>
      {children}
    </CustomContext.Provider>
  );
};
