import {render,screen} from "@testing-library/react";
import TaxonomyModelApp from "./TaxonomyModelApp";

describe("main taxonomy app test",()=>{
    it("should render main app",()=>{
        //WHEN the  app is rendered
        render(<TaxonomyModelApp/>);
        const app = screen.getByTestId("TaxonomyModelApp");
        //THEN expect the app to be in the document
        expect(app).toBeInTheDocument();
    });
});