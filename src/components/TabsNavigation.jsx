import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';

const TabsNavigation = ({ onTabChange }) => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    onTabChange(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={value} onChange={handleChange} aria-label="tabs navigation">
        <Tab label="Tasks" />
        <Tab label="Notes" />
      </Tabs>
    </Box>
  );
};

export default TabsNavigation;

