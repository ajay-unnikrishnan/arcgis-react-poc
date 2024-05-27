import React, { useEffect } from 'react';
import './App.css';
import ReactDOM from "react-dom/client";
import { ArcgisMap, ArcgisSearch, ArcgisLegend } from "@arcgis/map-components-react"
// import defineCustomElements to register custom elements with the custom elements registry
import { defineCustomElements as defineMapElements } from "@arcgis/map-components/dist/loader";
import { Container, Grid } from '@mui/material';

// Register custom elements
defineMapElements(window, {
  resourcesUrl: "https://js.arcgis.com/map-components/4.29/assets",
});
interface BasicMapComponentProps {
    // Define any props needed for the map component
  }

const BasicMapComponent: React.FC<BasicMapComponentProps> = () => {
  useEffect(() => {
    // Any additional JavaScript needed after components are mounted
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={2}>
        <div style={{ background: '#f0f0f0', padding: '20px' }}>          
          <ArcgisSearch position="top-right"></ArcgisSearch>
        </div></Grid>
      <Grid item xs={8} style={{ height: '600px' }}>
        <ArcgisLegend></ArcgisLegend>
        <ArcgisMap          
          style={{ height: '100%', width: '100%' }}
          onArcgisViewReadyChange={(event: any) => {
            console.log('MapView ready', event);
          }}
        ><ArcgisSearch position="top-right"></ArcgisSearch>
        </ArcgisMap>
      </Grid>
    </Grid>
  );  
};

export default BasicMapComponent;
