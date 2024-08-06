import React, { useState } from 'react';
import { Tabs, Tab, Box, useTheme } from '@mui/material';

const TabsNavigation = ({ onTabChange }) => {
  const [value, setValue] = useState(0);
  const theme = useTheme();

  const handleChange = (event, newValue) => {
    setValue(newValue);
    onTabChange(newValue);
  };

  return (
    <Box sx={{ bgcolor: 'white' }}> // Removed border properties
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="tabs navigation"
        textColor="primary"
        indicatorColor="primary"
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
          },
          '& .MuiTab-root': {
            color: theme.palette.text.primary,
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
        }}
      >
        <Tab label="Tasks" />
        <Tab label="Notes" />
      </Tabs>
    </Box>
  );
};

export default TabsNavigation;