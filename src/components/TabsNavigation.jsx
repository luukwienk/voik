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
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="tabs navigation"
        textColor="inherit"
        indicatorColor="primary"
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.mode === 'dark' ? '#fff' : '#000',
          },
          '& .MuiTab-root': {
            color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            '&.Mui-selected': {
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
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
