import {Skeleton, TableCell, TableRow} from "@mui/material"

interface TableLoadingBodyProps {
  numberOfCols: number
}

const uniqueId= "d85242de-5f0d-4a38-b469-bde62e24f992";

export const DATA_TEST_ID = {
  SKELETON_ROW: `skeleton-row-${uniqueId}`,
  SKELETON_CELL: `skeleton-cell-${uniqueId}`
};

export default function TableLoadingBody(props: TableLoadingBodyProps) {
  
  return <>
    {Array.from({length: 10}, (_, i) => {
      return <TableRow key={i} data-testid={DATA_TEST_ID.SKELETON_ROW}>
        {
          Array.from({length: props.numberOfCols}, (_, i)  =>(
            <TableCell key={i} data-testid={DATA_TEST_ID.SKELETON_CELL}>
              <Skeleton variant="text" sx={{fontSize: '1rem'}}/>
            </TableCell>
          ))
        }
      </TableRow>
    })}
  </>
}