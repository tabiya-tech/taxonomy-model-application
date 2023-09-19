import Box from "@mui/material/Box";
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VerticalSplitOutlinedIcon from '@mui/icons-material/VerticalSplitOutlined';
import {Typography} from "@mui/material";
import {useState} from "react";

const iconData = [
    {
        icon: <FolderOutlinedIcon sx={{ width: '24px', height: '24px' }} />,
        label: 'Directory',
    },
    {
        icon: <VerticalSplitOutlinedIcon sx={{ width: '24px', height: '24px' }} />,
        label: 'Explore',
    },
    {
        icon: <EditOutlinedIcon sx={{ width: '24px', height: '24px' }} />,
        label: 'Model',
    },
    {
        icon: <PermIdentityIcon sx={{ width: '24px', height: '24px' }} />,
        label: 'Users',
    },
    {
        icon: <SettingsIcon sx={{ width: '24px', height: '24px' }} />,
        label: 'Settings',
    },
];


const AppSidebar = () => {
    const [isActive, setIsActive] =  useState(0)

    return (
        <Box display="flex" flexDirection="column" alignItems="center" paddingX="16px" marginTop="44px" gap="16px">
            {iconData.map((item, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1} flexDirection="column">
                    <Box
                        padding="4px 14px"
                        borderRadius="16px"
                        display="flex"
                        justifyContent="center"
                        bgcolor={isActive === index ? "#5CFF9F": ""}
                        onClick={() => setIsActive(index)}
                        sx={{
                            '&:hover': {
                                backgroundColor: '#5CFF9F',
                                cursor: 'pointer',
                            },
                        }}
                    >
                        {item.icon}
                    </Box>
                    <Typography sx={{ fontSize: '12px' }}>{item.label}</Typography>
                </Box>
            ))}
        </Box>
    )
};
export default AppSidebar;