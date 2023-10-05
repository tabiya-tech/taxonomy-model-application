import React, {useEffect, useState, useMemo} from 'react';
import {InfoProps} from './info.types';
import InfoService from './info.service';
import {Box, Skeleton, Typography} from "@mui/material";
import ContentTitle from "src/theme/ContentTitle";
import {styled} from "@mui/material/styles";


const uniqueId = "37d307ae-4f1e-4d8d-bafe-fd642f8af4dc"
export const DATA_TEST_ID = {
    INFO_ROOT: `version-${uniqueId}`,
    VERSION_FRONTEND_ROOT: `version-frontend-${uniqueId}`,
    VERSION_BACKEND_ROOT: `version-backend-${uniqueId}`,
};

const StyledContainer = styled(Box)`
  flex: 1;
  border-radius: 16px 16px 0 0;
  overflow-y: auto;
  background-color: ${({theme}) => theme.palette.containerBackground.light};
`;

const VersionInfoItem = ({ title, value, skeleton }: {title: string, value: string, skeleton?: boolean}) => {
    return (
      <Box>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body1">
          {skeleton ? <Skeleton>{value.replace(/./g,'\u00A0\u00A0')}</Skeleton> : value}
        </Typography>
      </Box>
    );
};

const VersionContainer = ({ dataTestId, title, info }: {dataTestId: string, title: string, info: InfoProps}) => {
    return (
        <Box display="flex" gap="30px" data-testid={dataTestId}>
            <Typography variant="h6">{title}</Typography>
            {info ? (
                <Box display="flex" flexDirection="column" gap="12px">
                    <VersionInfoItem title="Date" value={info.date} />
                    <VersionInfoItem title="Branch" value={info.branch} />
                    <VersionInfoItem title="Build Number" value={info.buildNumber} />
                    <VersionInfoItem title="GIT SHA" value={info.sha} />
                </Box>
            ) : (
                <Box display="flex" flexDirection="column" gap="12px">
                    <VersionInfoItem title="Date" value={"0000-00-00T00:00:00.000Z"} skeleton={true}/>
                    <VersionInfoItem title="Branch" value={"foo"} skeleton={true}/>
                    <VersionInfoItem title="Build Number" value={"000"} skeleton={true}/>
                    <VersionInfoItem title="GIT SHA" value={"foofoofoofoofoofoofoofoofoofoofoofoofoo"} skeleton={true}/>
                </Box>
            )}
        </Box>
    );
};

const Info = () => {
    const [version, setVersions] = useState<InfoProps[]>([]);
    const infoService = useMemo(() => new InfoService(), []);

    useEffect(() => {
        infoService.loadInfo().then((data) => setVersions(data));
    }, [infoService]);

    return (
        <StyledContainer data-testid={DATA_TEST_ID.INFO_ROOT} display="flex" flexDirection="column" gap="28px" sx={{padding: (theme) => theme.tabiyaSpacing.lg}}>
            <ContentTitle text="Info" />
            <Box display="flex" flexDirection="column" gap="40px">
                <VersionContainer title="Frontend" info={version[0]} dataTestId={DATA_TEST_ID.VERSION_FRONTEND_ROOT} />
                <VersionContainer title="Backend" info={version[1]} dataTestId={DATA_TEST_ID.VERSION_BACKEND_ROOT} />
            </Box>
        </StyledContainer>
    );
};

export default Info;