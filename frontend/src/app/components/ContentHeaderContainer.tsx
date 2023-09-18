import { useAppLayout } from '../AppLayoutProvider';

export const ContentHeaderContainer = () => {
    const {contentHeader}  = useAppLayout()
    return <>{contentHeader}</>
};