// mute the console
import "src/_test_utilities/consoleMock";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import ModelPropertiesDrawer, {
  CloseEventName,
  DATA_TEST_ID as MODEL_PROPERTIES_DRAWER_DATA_TEST_ID,
} from "./ModelPropertiesDrawer";
import ModelPropertiesHeader, {
  DATA_TEST_ID as MODEL_PROPERTIES_HEADER_DATA_TEST_ID,
} from "./components/ModelPropertiesHeader";
import ModelPropertiesContent, {
  DATA_TEST_ID as MODEL_PROPERTIES_CONTENT_DATA_TEST_ID,
} from "./components/ModelPropertiesContent";
import { render, screen, fireEvent } from "src/_test_utilities/test-utils";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { Drawer } from "@mui/material";

jest.mock("./components/ModelPropertiesHeader", () => {
  const actual = jest.requireActual("./components/ModelPropertiesHeader");
  const mockModelPropertiesHeader = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.MODEL_PROPERTIES_HEADER}> Model properties header</div>;
  });
  return {
    ...actual,
    __esModule: true,
    default: mockModelPropertiesHeader,
  };
});

jest.mock("./components/ModelPropertiesContent", () => {
  const actual = jest.requireActual("./components/ModelPropertiesContent");
  const mockModelPropertiesContent = jest.fn().mockImplementation(() => {
    return <div data-testid={actual.DATA_TEST_ID.MODEL_PROPERTIES_CONTENT}> Model properties content</div>;
  });
  return {
    ...actual,
    __esModule: true,
    default: mockModelPropertiesContent,
  };
});

const testModel: ModelInfoTypes.ModelInfo = {
  name: "foo",
  description: "",
  id: "",
  UUID: "",
  UUIDHistory: [],
  released: false,
  releaseNotes: "",
  version: "",
  locale: {
    UUID: "bar",
    shortCode: "bar",
    name: "bar",
  },
  path: "",
  tabiyaPath: "",
  exportProcessState: [],
  importProcessState: {
    id: "",
    status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
    result: {
      errored: false,
      parsingErrors: false,
      parsingWarnings: false,
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ModelPropertiesDrawer component render tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should render the drawer when 'isOpen' is true", () => {
    // GIVEN the ModelPropertiesDrawer is called with the 'isOpen' prop as true
    // WHEN the ModelPropertiesDrawer component is rendered
    render(<ModelPropertiesDrawer model={testModel} isOpen={true} notifyOnClose={jest.fn()} />);
    // THEN the drawer should be in the document
    const modelPropertiesDrawerComponent = screen.getByTestId(
      MODEL_PROPERTIES_DRAWER_DATA_TEST_ID.MODEL_PROPERTIES_DRAWER
    );
    expect(modelPropertiesDrawerComponent).toBeInTheDocument();
    // AND the header should be in the document
    const modelPropertiesHeaderComponent = screen.getByTestId(
      MODEL_PROPERTIES_HEADER_DATA_TEST_ID.MODEL_PROPERTIES_HEADER
    );
    expect(modelPropertiesHeaderComponent).toBeInTheDocument();
    // AND the content should be in the document
    const modelPropertiesContentComponent = screen.getByTestId(
      MODEL_PROPERTIES_CONTENT_DATA_TEST_ID.MODEL_PROPERTIES_CONTENT
    );
    expect(modelPropertiesContentComponent).toBeInTheDocument();
    // AND it should match the snapshot
    expect(modelPropertiesDrawerComponent).toMatchSnapshot();
    // AND no errors are logged to the console
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should not render the drawer when 'isOpen' is false", () => {
    // GIVEN the ModelPropertiesDrawer is called with the 'isOpen' prop as false
    // WHEN the ModelPropertiesDrawer component is rendered
    render(<ModelPropertiesDrawer model={testModel} isOpen={false} notifyOnClose={jest.fn()} />);
    // THEN the drawer should not be in the document
    const modelPropertiesDrawerComponent = screen.queryByTestId(
      MODEL_PROPERTIES_DRAWER_DATA_TEST_ID.MODEL_PROPERTIES_DRAWER
    );
    expect(modelPropertiesDrawerComponent).not.toBeInTheDocument();
    // AND no errors are logged to the console
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should call the header component with the appropriate props", () => {
    // GIVEN the ModelPropertiesDrawer is called with the 'isOpen' prop as true
    // WHEN the ModelPropertiesDrawer component is rendered
    render(<ModelPropertiesDrawer model={testModel} isOpen={true} notifyOnClose={jest.fn()} />);
    // THEN the header should have been called with the expected props
    const modelPropertiesHeaderComponent = screen.getByTestId(
      MODEL_PROPERTIES_HEADER_DATA_TEST_ID.MODEL_PROPERTIES_HEADER
    );
    expect(modelPropertiesHeaderComponent).toBeInTheDocument();
    expect(ModelPropertiesHeader).toHaveBeenCalledWith(
      {
        title: `${testModel.name} : ${testModel.locale.name}`,
        notifyOnClose: expect.any(Function),
      },
      {}
    );
    // AND no errors are logged to the console
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should call the content component with the model", () => {
    // GIVEN the ModelPropertiesDrawer is called with the 'isOpen' prop as true
    // WHEN the ModelPropertiesDrawer component is rendered
    render(<ModelPropertiesDrawer model={testModel} isOpen={true} notifyOnClose={jest.fn()} />);
    // THEN the content should have been called with the given model
    const modelPropertiesContentComponent = screen.getByTestId(
      MODEL_PROPERTIES_CONTENT_DATA_TEST_ID.MODEL_PROPERTIES_CONTENT
    );
    expect(modelPropertiesContentComponent).toBeInTheDocument();
    expect(ModelPropertiesContent).toHaveBeenCalledWith({ model: testModel }, {});
    // AND no errors are logged to the console
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe("ModelPropertiesDrawer component action tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should call the parent's notifyOnClose with DISMISS when the drawer closes", () => {
    // GIVEN the drawer is open
    const notifyOnCloseHandler = jest.fn();
    // @ts-ignore
    const renderSpy: jest.Mock = jest.spyOn(Drawer, "render");
    render(<ModelPropertiesDrawer model={testModel} isOpen={true} notifyOnClose={notifyOnCloseHandler} />);
    // WHEN the drawer is closed
    renderSpy.mock.calls[0][0].onClose();
    // THEN 'notifyOnClose' should be called with { name: "DISMISS" }
    expect(notifyOnCloseHandler).toHaveBeenCalledWith({ name: CloseEventName.DISMISS });
    expect(notifyOnCloseHandler).toHaveBeenCalledTimes(1);
  });

  test("should call parent's notifyOnClose with DISMISS when the header close button is clicked", () => {
    // GIVEN the drawer is open
    const notifyOnCloseHandler = jest.fn();
    render(<ModelPropertiesDrawer model={testModel} isOpen={true} notifyOnClose={notifyOnCloseHandler} />);
    // WHEN the header close button is clicked
    (ModelPropertiesHeader as jest.Mock).mock.calls[0][0].notifyOnClose();
    // THEN 'notifyOnClose' should be called with { name: "DISMISS" }
    expect(notifyOnCloseHandler).toHaveBeenCalledWith({ name: CloseEventName.DISMISS });
    expect(notifyOnCloseHandler).toHaveBeenCalledTimes(1);
  });

  test("should call parent's notifyOnClose with DISMISS when the 'Escape' key is pressed", () => {
    // GIVEN the drawer is open
    const notifyOnCloseHandler = jest.fn();
    render(<ModelPropertiesDrawer model={testModel} isOpen={true} notifyOnClose={notifyOnCloseHandler} />);
    // WHEN the 'Escape' key is pressed
    fireEvent.keyDown(screen.getByTestId(MODEL_PROPERTIES_DRAWER_DATA_TEST_ID.MODEL_PROPERTIES_DRAWER), {
      key: "Escape",
    });
    // THEN 'notifyOnClose' should be called with { name: "DISMISS" }
    expect(notifyOnCloseHandler).toHaveBeenCalledWith({ name: CloseEventName.DISMISS });
    expect(notifyOnCloseHandler).toHaveBeenCalledTimes(1);
  });
});
