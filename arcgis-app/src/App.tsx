import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import MapComponent from './MapComponent';

const App: React.FC = () => {  

  return (
    <BrowserRouter>
    <div>     
      <Routes>
        <Route index element={<MapComponent/>} />
      </Routes>
    </div>

    </BrowserRouter>
  );  
};

export default App;
