import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Button, Checkbox, Container, Drawer, FormControlLabel, Grid, TextField, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Config from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { SimpleMarkerSymbol, SimpleLineSymbol, TextSymbol } from "@arcgis/core/symbols";
import { Point, Polyline } from "@arcgis/core/geometry";
import Graphic from "@arcgis/core/Graphic";
import { SimpleRenderer } from "@arcgis/core/renderers";
import LabelClass from "@arcgis/core/layers/support/LabelClass";
import SceneView from "@arcgis/core/views/SceneView";
import LineSymbol3D from "@arcgis/core/symbols/LineSymbol3D";
import * as turf from '@turf/turf'
import { Feature, LineString, Properties } from "@turf/turf";

Config.apiKey = 'AAPKf4355574c6ec45af92366cabec513c87g-A1XXtkcgxiB-V_C9S7F8p6ErGv4qtPP7TCGX7pKD_q3WXZH6H0tAyp-sXL3Ixa';


interface MapComponentProps {
  // Define any props needed for the map component
}
interface Airport {
  code: string;
  name: string;
  coords: [number, number];
}
type Route = {    
  origin: string;
  destination: string;
}

const MapComponent: React.FC<MapComponentProps> = () => {

  const mapDiv = useRef<HTMLDivElement>(null);

  const [map, setMap] = useState<Map>();
  const [mapView, setMapView] = useState<MapView>();
  const [sceneView, setSceneView] = useState<SceneView>();
  const [showNetwork, setShowNetwork] = useState<boolean>(false);  
  
  useEffect(() => {
    if (mapDiv.current) {
      const map = new Map({        
        basemap: "streets-navigation-vector",
      });
      setMap(map);

      const sceneView = new SceneView({
        container: mapDiv.current,
        map: map,
        center: [77.1025, 28.7041], // Center on India
        environment: {
          background: {
            // @ts-ignore
            type: "color",
            color: [65, 98, 136, 0.81]
          },
          lighting: {
            type: 'virtual',
          },
          atmosphereEnabled: true,
          starsEnabled: true
        }
      });
      setSceneView(sceneView);

    }
  }, [mapDiv]);

  const airports: Airport[] = [
    { code: "COK", name: "Cochin International Airport", coords: [76.4019, 10.152] },
    { code: "DEL", name: "Indira Gandhi International Airport", coords: [77.1025, 28.5562] }
  ];

  const airportsCoordinates = {
    "AAA": [-17.35510063, -145.5084991],
    "AAB": [-26.70000076, 141.0417023],
    "AAC": [31.07690048, 33.83409882]
  }
  const routesData = [
    { "origin": "COK", "destination": "DEL" },
    { "origin": "DEL", "destination": "COK" }
  ]
  const [selectedAirports, setSelectedAirports] = useState<string[]>([]);
  const handleAddAirports = () => {
    alert('Not Implemented');
  } 
  const enable3dGraphics = true;
  const handleChangeShowNetwork = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    draworRemoveNetwork(checked);    
  }
  const draworRemoveNetwork = (checked: boolean) => {
    if (checked) {  
      const color = [226, 119, 40];   
      const graphics: Graphic[][] = getGraphicsForRouteNetwork(routesData, enable3dGraphics);
      enable3dGraphics? create3DNetwork(graphics, color) : create2DNetwork(graphics, color); 
    } else {
      map?.remove(map.findLayerById("nwAirportLayer"));
      map?.remove(map.findLayerById("nwRouteLayer"));      
    }
    setShowNetwork(checked);
  }

  const create2DNetwork = (graphics: Graphic[][], routeColor: number[]): void => {
      
    const airportLayer = get2DAirportLayerObj(routeColor, graphics[0], "nwAirportLayer")
    //@ts-ignore
    map.add(airportLayer);

    const routeLayer = get2DRoutelayer(routeColor, graphics[1], "nwRouteLayer")
    //@ts-ignore
    map.add(routeLayer);
  }  

  const create3DNetwork = (graphics: Graphic[][], routeColor: number[]): void => { 
    const airportLayer = get3DAirportLayerObj(routeColor, graphics[0], "nwAirportLayer")
    //@ts-ignore
    map.add(airportLayer); 
    
    const routeLayer = get3DRoutelayer(routeColor, graphics[1], "nwRouteLayer");
    //@ts-ignore
    map.add(routeLayer);
  } 
  const getGraphicsForRouteNetwork = (routesData: Route[], enable3d: boolean ): Graphic[][] => {
    const airportGraphics: Graphic[] = [];
    const lineGraphics: Graphic[] = [];
    const renderedLabels = new Set<string>();
            
    for(var i = 0; i < routesData.length ; i++) { 
        if(!renderedLabels.has(routesData[i].origin)) {
            const originAirport = getAirportGraphic(routesData[i].origin);
            airportGraphics.push(originAirport);
        }
        if(!renderedLabels.has(routesData[i].destination)){ 
            const destAirport = getAirportGraphic(routesData[i].destination); 
            airportGraphics.push(destAirport);
        }
        const lineGraphic = getLineGraphic(routesData[i].origin, routesData[i].destination, enable3d);
        lineGraphics.push(lineGraphic);
    }
    return [airportGraphics, lineGraphics];
}
const getAirportGraphic = (airportCode: string): Graphic => {
    const coordinates = getAirportCoordinates(airportCode);
    return new Graphic({
        geometry: {
            // @ts-ignore
            type: "point",  // autocasts as new Point()
            longitude: coordinates[0],
            latitude:  coordinates[1]
        },
            attributes: {
            ObjectID: airportCode,
            Airport: airportCode
        }
    })
}
const getLineGraphic = (originAirport: string, destinationAirport: string, enable3d: boolean): Graphic => {
    const origin = getAirportCoordinates(originAirport);
    const destination = getAirportCoordinates(destinationAirport);
     
    return new Graphic({
        //@ts-ignore
        geometry: {  
            //@ts-ignore      
            type: "polyline",
            paths: getRoutePath(origin, destination, 1000, enable3d)
        },
            attributes: {
            ObjectId: originAirport+destinationAirport
        }
    });
}
const get3DAirportLayerObj = (routeColor: number[], graphics: Graphic[], id: string) => {
    let labelClass = new LabelClass({
        labelExpressionInfo: {
          expression: "$feature.Airport"  
        },
        symbol: {
          type: "label-3d",  // autocasts as new LabelSymbol3D()
          symbolLayers: [{
            // @ts-ignore
            type: "text",  // autocasts as new TextSymbol3DLayer()
            material: { color: "black", },
            size: 12,
            lineHeight: 1.3
          }]
        }
      });    
    let symbol3D = {
    type: "point-3d",  // autocasts as new PointSymbol3D()
    symbolLayers: [{
        type: "icon",  // autocasts as new IconSymbol3DLayer()
        size: 14,  // points
        resource: { primitive: "circle" },
        material: { color: routeColor },
        outline: { color: "white", size: 0.5 }
    }]
    };
    let airportLayer = new FeatureLayer({
    //@ts-ignore      
    source: graphics,  // autocast as a Collection of new Graphic()
    objectIdField: "ObjectId",
    fields: [
        { name: "ObjectId", type: "oid" },
        { name: "Airport", type: "string" }
    ],
    renderer: {
        //@ts-ignore
        type: "simple",
        symbol: symbol3D,
    },
    labelingInfo: [labelClass],
    id: id
    });
    return airportLayer;
}
const get2DAirportLayerObj = (routeColor: number[], graphics: Graphic[], id: string) => {
    let labelClass = new LabelClass({
        labelExpressionInfo: {
          expression: "$feature.Airport"  
        },
        symbol: {
          // @ts-ignore
          type: "text",  // autocasts as new LabelSymbol3D()
          color: "black",
          yoffset: -12        
        }
      });
      let airportLayer = new FeatureLayer({
        //@ts-ignore      
        source: graphics,  // autocast as a Collection of new Graphic()
        objectIdField: "ObjectId",
        fields: [
          { name: "ObjectId", type: "oid" },
          { name: "Airport", type: "string" }
        ],
        renderer: {
          //@ts-ignore
          type: "simple",
          symbol: {
            type: "simple-marker",
            style: "circle",
            color: routeColor,
            size: "12px",
            outline: {
              color: "white",
              width: 0.5,
            },
          },
        },
        labelingInfo: [labelClass],
        id: id
      });
    return airportLayer;
}
const get3DRoutelayer = (routeColor: number[], graphics: Graphic[], id: string) => {
    const lineSymbol = new LineSymbol3D({
        symbolLayers: [{
            type: "line",  // autocasts as new LineSymbol3DLayer()
            size: 2.5,
            material: { color: routeColor },
            cap: "round",
            join: "round",
        }]
    });
    const renderer = {
        type: "simple",
        symbol: lineSymbol
    };  
    let routeLayer = new FeatureLayer({
        //@ts-ignore      
        source: graphics,
        objectIdField: "ObjectId", 
        //@ts-ignore     
        renderer: renderer,
        id: id
    });
    return routeLayer;
}
const get2DRoutelayer = (routeColor: number[], graphics: Graphic[], id: string) => {
    const lineSymbol = {
        type: "simple-line",
        color: routeColor,
        width: 2.5
    };
    const renderer = {
        type: "simple",
        symbol: lineSymbol
    };
    let routeLayer = new FeatureLayer({
        //@ts-ignore      
        source: graphics,  // autocast as a Collection of new Graphic()
        objectIdField: "ObjectId", 
        //@ts-ignore     
        renderer: renderer, 
        id: id
      });
    return routeLayer;
}
const getAirportCoordinates = (code: string): [number, number] => {
  const airport = airports.find(airport => airport.code === code);
  return airport? airport.coords : [0,0];   
}
const getRoutePath = (startCoords: number[], endCoords: number[], steps: number, enable3d: boolean): number[][] => {
  const options: { units?: turf.Units } = {
    units: 'nauticalmiles'
  };
  const distance = turf.distance(endCoords, startCoords, options);
  const route: Feature<LineString, Properties> = {
    'type': 'Feature',
    'geometry': {
      'type': 'LineString',
      'coordinates': [startCoords, endCoords]
    },
    'properties': {
      distance: Math.ceil(distance)
    }
  };
  const lineDistance = turf.length(route);
  let prevLong: number = startCoords[0];
  const arc = [startCoords];
  for (let i = 0; i < lineDistance; i += lineDistance / steps) {
    const segment = turf.along(route, i);
    segment.geometry.coordinates[0] = correctLongitudeForRouteAcrossAntimeridian(
      segment.geometry.coordinates[0],
      prevLong
    );
    arc.push(segment.geometry.coordinates);
    prevLong = segment.geometry.coordinates[0];
  }
  const finalSegment = turf.along(route, lineDistance);
  finalSegment.geometry.coordinates[0] = correctLongitudeForRouteAcrossAntimeridian(
    finalSegment.geometry.coordinates[0],
    prevLong
  );
  arc.push(finalSegment.geometry.coordinates);
  const zForRoutes = 500;

  return enable3d ? arc.map(coords => [coords[0], coords[1], zForRoutes]) : arc;
}
const correctLongitudeForRouteAcrossAntimeridian = (long: number, prevLong: number): number => {
  return long - prevLong > 180 ?
    long - 360 : prevLong - long > 180 ?
      long + 360 : long;
}
 

  return (<>
    <Drawer
      sx={{
        '& .MuiDrawer-paper': {
          width: '15%',
          boxSizing: 'border-box',
          padding: 0,
        }
      }}
      variant="permanent"
      anchor="left"
    >
      <Grid container spacing={2} marginTop={0} marginLeft={"0px"}>         
        <Accordion disableGutters>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'whitesmoke'
            }}
          >
            <Typography>Insert Airports</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2} marginTop={0}>              
              <Grid item xs={12}>
                <Autocomplete
                    multiple
                    id="airports-autocomplete"
                    options={Object.keys(airportsCoordinates)}
                    getOptionLabel={(option) => option}            
                    filterSelectedOptions
                    onChange={(e, values) => setSelectedAirports(values)}
                    renderInput={(params) => (
                      <TextField
                        {...params}                
                        placeholder="Select Airports"                
                      />
                    )}
                  />
              </Grid>
              <Grid item xs={11}>
                <Button variant="contained" sx={{ margin: '10px' }} onClick={handleAddAirports}>Submit</Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion disableGutters>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'whitesmoke'
            }}
          >
            <Typography>Network</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2} marginTop={0}>
              <Grid item xs={12}>
                <FormControlLabel
                  label="Show Network"
                  control={
                    <Checkbox
                      checked={showNetwork}
                      onChange={handleChangeShowNetwork}
                    />
                  }
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

      </Grid>
    </Drawer>
    <div className="mapDiv" ref={mapDiv}></div>
  </>
  );  
};

export default MapComponent;
