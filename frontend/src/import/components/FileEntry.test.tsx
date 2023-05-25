import {screen} from "@storybook/testing-library";
import {render} from "@testing-library/react";
import {FileEntry} from "./FileEntry";
import {ImportFileTypes} from "api-specifications/import";

describe.skip("FileEntry tests only",()=>{
  it.todo("should render default state")
  it("Should render fileEntry", ()=>{
    // GIVEN an import fileType
    const givenFileType = ImportFileTypes.ESCO_OCCUPATION;
    const givenMockNotification = jest.fn();

    // WHEN fileEntry is called with no file
    render(<FileEntry fileType={givenFileType} notifySelectedFileChange={givenMockNotification}/>)
    const fileInput = screen.getByTestId("entry-test-id");

    // THEN expect fileInput to be in the document
    expect(fileInput).toBeInTheDocument()
  })


  it.todo("should render file selected state")

  it.todo("should remove selected file")

  it.todo("multiple components should have a unique id")

  it.todo("should correctly notify the notifySelectedFileChange handler")
})