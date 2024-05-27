import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BasicMapComponent from './BasicMapComponent';
import MapComponent from './MapComponent';

const App: React.FC = () => {  

  return (
    <BrowserRouter>
    <div>
      <p>ArcGIS Demo</p>
      <Routes>
        <Route index element={<MapComponent/>} />
        <Route path='/basic' element={<BasicMapComponent/>} />
      </Routes>
    </div>

    </BrowserRouter>
  );  
};

export default App;
