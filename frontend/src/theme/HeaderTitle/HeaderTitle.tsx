export interface HeaderTitleProps {
  title: string;
}

/**
 * Reusable title component for Headers in the app.
 * Should use h2 variant of the mui typography
 * @param props gets data-testid for testing from parent
 * @constructor
 */
const HeaderTitle: React.FC<HeaderTitleProps> = ({ title, ...props }) => {
  return <></>;
};

export default HeaderTitle;
