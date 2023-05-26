import React, {useEffect, useState, useMemo} from 'react';
import {InfoProps} from './info.types';
import InfoService from './info.service';
import {Box, CircularProgress, FormLabel, List, ListItem, ListItemText} from "@mui/material";


const uniqueId = "37d307ae-4f1e-4d8d-bafe-fd642f8af4dc"
export const DATA_TEST_ID = {
  VERSION_FRONT_ROOT: `version-frontend-${uniqueId}`,
  VERSION_BACKEND_ROOT: `version-backend-${uniqueId}`,
}

const Info = () => {
  const [version, setVersions] = useState<InfoProps[]>([]);
  const infoService = useMemo(() => new InfoService(), []);

  useEffect(() => {
    infoService.loadInfo().then((data) => setVersions(data));
  }, [infoService]);
  return (
    <div>
      <div id="frontend" data-testid={DATA_TEST_ID.VERSION_FRONT_ROOT}>
        {RenderVersion("Frontend", version[0])}
      </div>
      <div id="backend" data-testid={DATA_TEST_ID.VERSION_BACKEND_ROOT}>
        {RenderVersion("Backend", version[1])}
      </div>
    </div>
  );
};

export default Info;

const RenderVersion = (title: string, info: InfoProps) => {
  if (!info) {
    return <CircularProgress/>;
  }
  return <Box sx={{ width: 500}} component="fieldset">
    <legend><FormLabel>{title}</FormLabel></legend>
    <List dense={true}>
      <ListItem><FormLabel>Date: </FormLabel><ListItemText primary={`${info.date}`}/></ListItem>
      <ListItem><FormLabel>Branch: </FormLabel><ListItemText primary={`${info.branch}`}/></ListItem>
      <ListItem><FormLabel>Build Number: </FormLabel><ListItemText primary={`${info.buildNumber}`}/></ListItem>
      <ListItem><FormLabel>GIT SHA:</FormLabel><ListItemText primary={`${info.sha}`}/></ListItem>
    </List>
  </Box>;
};