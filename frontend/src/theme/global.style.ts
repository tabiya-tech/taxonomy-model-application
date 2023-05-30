import {makeStyles} from '@material-ui/styles';

export const useStyles = makeStyles({
  customStack: {
    margin: 5,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  fieldStack: {
    flexDirection: 'column',
    justifyContent: "space-evenly",
    alignItems: "flex-start"
  }
});