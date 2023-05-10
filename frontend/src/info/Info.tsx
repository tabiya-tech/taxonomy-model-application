import './info.style.css';
import React, {useEffect, useState, useMemo} from 'react';
import {InfoProps} from './info.types';
import InfoService from './info.service';


const uniqueId = "37d307ae-4f1e-4d8d-bafe-fd642f8af4dc"
export const DATA_TEST_ID = {
  VERSION_FRONT_ROOT:`version-frontend-${uniqueId}`,
  VERSION_BACKEND_ROOT:`version-backend-${uniqueId}`,
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
    return <div>loading ...</div>;
  }
  return <ul className='info'>
    <li className='title'><p>{title}</p></li>
    <li className='entry'><p>Date:</p> {info.date}</li>
    <li className='entry'><p>Branch:</p> {info.branch}</li>
    <li className='entry'><p>Build Number:</p>{info.buildNumber}</li>
    <li className='entry'><p>GIT SHA:</p> {info.sha}</li>
  </ul>;
};