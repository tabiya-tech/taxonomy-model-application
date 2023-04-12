import './info.style.css'
import React, {useEffect, useState, useMemo} from 'react';
import {InfoProps} from './info.types';
import InfoService from './info.service';

const Info = () => {
  const [version, setVersions] = useState<InfoProps[]>([]);
  const infoService = useMemo(() => new InfoService(), []);

  useEffect(() => {
    infoService.loadInfo().then((data) => setVersions(data));
  }, [infoService])
  return (
    <div>
      <div id="frontend" data-testid="frontend">
        {RenderVersion("Frontend", version[0])}
      </div>
      <div id="backend" data-testid="backend">
        {RenderVersion("Backend", version[1])}
      </div>
    </div>
  )
}

export default Info

const RenderVersion = (title: string, info: InfoProps) => {
  if (!info) {
    return <div>loading ...</div>
  }
  return <ul className='info'>
    <li className='title'><p>{title}</p></li>
    <li className='entry'><p>Date:</p> {info.date}</li>
    <li className='entry'><p>Branch:</p> {info.branch}</li>
    <li className='entry'><p>Build Number:</p>{info.buildNumber}</li>
    <li className='entry'><p>GIT SHA:</p> {info.sha}</li>
  </ul>
}