// ##############################
// Setup import.service mock
// ##############################
import ImportService from "./import.service";

jest.mock("./import.service", () => {
    const {default: importServiceALike} = jest.requireActual('./import.service');
    //to get all instances of import service
    // @ts-ignore
    importServiceALike.prototype.createModel = jest.fn().mockResolvedValue("foo_model_id");
    return importServiceALike;
});

import {render, screen, fireEvent} from "@testing-library/react";
import ImportModel, {DATA_TEST_ID} from "./ImportModel";
import {getTestString} from "src/_test_utilities/specialCharacters";
import {ILocale} from "api-specifications/modelInfo"

describe("ImportModel dialog render tests", () => {
    it("should render import modal", () => {
        render(<ImportModel/>);
        const modalElement = screen.getByTestId(DATA_TEST_ID.DIALOG_ROOT);
        expect(modalElement).toBeInTheDocument();
    });

    it("should render the name input field ", () => {
        //GIVEN the dialog is visible
        render(<ImportModel/>);
        const nameInputElement = screen.getByTestId(DATA_TEST_ID.NAME_INPUT);

        //THEN expect nameInput to exist
        expect(nameInputElement).toBeInTheDocument();
    });

    it("should render the description field ", () => {
        //GIVEN the dialog is visible
        render(<ImportModel/>);
        const descInputElement = screen.getByTestId(DATA_TEST_ID.DESC_INPUT);

        //THEN expect description field to exist
        expect(descInputElement).toBeInTheDocument();
    });

    it("should render the import button", () => {
        //GIVEN the dialog is visible
        render(<ImportModel/>);
        const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);

        //THEN expect button to exist
        expect(importButton).toBeInTheDocument();
    });
});

describe("ImportModel dialog action tests", () => {
    it("should be able to type into the name input", () => {
        // GIVEN some text
        const givenText = getTestString(256);
        // AND dialog is visible
        render(<ImportModel/>);

        // WHEN the user enters that into the input element
        const nameInputElement = screen.getByTestId(DATA_TEST_ID.NAME_INPUT);
        fireEvent.change(nameInputElement, {target: {value: givenText}});

        // THEN expect the value of the input field equal to the given text
        // @ts-ignore
        expect(nameInputElement.value).toBe(givenText);
    });

    it("should be able to type into the description input", () => {
        // GIVEN some text
        const givenText = getTestString(256);
        // AND dialog is visible
        render(<ImportModel/>);

        // WHEN the user enters that into the description element
        const descriptionInputElement = screen.getByTestId(DATA_TEST_ID.DESC_INPUT);
        fireEvent.change(descriptionInputElement, {target: {value: givenText}});

        // THEN expect the value of the input field equal to the given text
        // @ts-ignore
        expect(descriptionInputElement.value).toBe(givenText);
    });

    it("import button should correctly import a model", async () => {
        // GIVEN dialog is visible
        const service = new ImportService("/path/to/api");

        // AND the users has entered a name
        render(<ImportModel/>);
        const givenName = getTestString(256);
        const nameInputElement = screen.getByTestId(DATA_TEST_ID.NAME_INPUT);
        fireEvent.change(nameInputElement, {target: {value: givenName}});

        // AND a description
        const givenDescription = getTestString(8000);
        const descriptionInputElement = screen.getByTestId(DATA_TEST_ID.DESC_INPUT);
        fireEvent.change(descriptionInputElement, {target: {value: givenDescription}});

        // AND a locale
        const givenDemoLocale : ILocale = {
            name: "South Africa",
            shortCode: "ZA",
            UUID: "8e763c32-4c21-449c-94ee-7ddeb379369a"
        };

        // WHEN pressing the import button
        const importButton = screen.getByTestId(DATA_TEST_ID.IMPORT_BUTTON);
        fireEvent.click(importButton);

        // THEN expected to call the createModel function with the given values from the input fields
        expect(service.createModel).toHaveBeenCalledWith({
            name: givenName,
            description: givenDescription,
            locale: givenDemoLocale
        });
    });
});
