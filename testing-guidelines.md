# How we make our BDD tests readable at Tabiya

At [Tabiya](https://tabiya.tech/), we are convinced that writing clear and concise tests is vital for the maintainability and scalability of our
codebase. Here, we'll explain the rules we follow to enhance the readability of our Behavior-Driven-Development (BDD)
tests. We follow a simple yet effective pattern and maintain consistent formatting to ensure our tests read like natural
sentences. This approach makes them easily understandable for both developers and stakeholders. Let's dive in!

## 1. The description should give a short summary of the test

Each test has a description that provides a brief summary of the test's purpose. This allows developers to quickly grasp
what the test is trying to achieve without delving into the code immediately. Short and concise summaries keep the focus
on the essential aspects of the test.

For example:

```javascript
describe("test the /order endpoint", () => {
  test("on POST respond with status CREATED and the new order in the response body")
  test("on POST respond with status BAD REQUEST and the error details in the response body, when the order could not be created")
})
```

Additionally, besides making the test easier to understand, is help us quickly define the scope of the requirements a
feature should fulfill. It allows us to understand the feature at a level of detail that enables us to estimate and
plan our work, before writing new code.

## 2. We use Gherkin

Gherkin provides us with a clear and concise syntax to describe our tests. We follow the BDD pattern and make use of the
keywords (`GIVEN`, `WHEN`, `THEN`, etc). Learn more about Gherkin [here](https://cucumber.io/docs/gherkin/).

## 3. Description of the test steps should be human-readable

To ensure the readability of our tests, we focus on crafting human-readable descriptions for the details of each test
case. Our goal is to make the tests read like a complete story, avoiding technical jargon whenever possible, using as
much as possible the domain language.

We avoid describing the test steps in terms of the implementation details of the system. Instead, we focus on describing
the behavior of the system from the perspective of the user, api-consumer, partner system, etc.

For example, we avoid describing a test in this way:

```javascript
// clear cookies
// setup mock login api
// set username and password textfields
// click button
// user status text is set to logged in
// cookies have been set
```

We prefer to describe it in this way:

```javascript
// GIVEN that the user is not logged in 
// AND that the user can succefully login 
// WHEN the user provides their username 
// AND the password 
// AND clicks on the "Login" button
// THEN expect the user to be succefully logged in
```

## 4. Grammar and Clarity

We pay close attention to grammatical correctness in description and the step of the test. By using proper
sentence structure and clear language, we eliminate any ambiguity and ensure that the intent of the test is crystal
clear.

## 5. We use inline comments to explain the tests

Our approach combines the AAA pattern (Arrange-Act-Assert) and the Gherkin syntax.
We use `GIVEN` to express the "**Arrange**" section, `WHEN` to express the "**Act**" section, and `THEN` to express
the "**Assert**" section.

We use inline comments to describe the test steps. Each step starts with an inline comment that begins with one of the
Gherkin keywords mentioned above, and continues with the code of the test. This approach helps us organize the test into parts
that are easier to understand and makes the test flow clear. Let's see an example:

Using inline comments with Gherkin keywords :

```javascript
// GIVEN that the user is not logged in 
clearAuthCookies();
// AND that the user can succefully login 
setupMockLoginApi();

// WHEN the user provides their username 
fillUsernameInputField("username");
// AND the password 
fillPasswordInputField("password");
// AND clicks on the "Login" button
clickLoginButton();

// THEN expect the user to be succefully logged in
expect(userStatusText).toBe('logged in');
// AND expect username in the cookies to be set to the username provided
expectUserInAuthCookiestoBeSet("username");
```

## 6. Value conventions

We refer to values used in the test code using constants and variables.

```javascript
// we avoid to do this
foo("bar");

// we preffer to do this
const givenBar = "bar";
foo(givenBar);
```

We use constants and variables to store values used in the test code, for several reasons:

- to avoid repetition when the value is used at multiple parts of the test function.
- to abstract the value from the test code and imply that the value is not important to the test.
- to make it easier to change the value when needed
- to give the value a name that describes its purpose in the test.
- to make the test code more readable.
- to denote the relationship between two parts of the code that use the same value.
- to make the test code easier to understand especially when the value is a complex object, or it is used in a different
  segment that it is defined.

We name the constants and variables following a specific pattern to ensure consistency and clarity.

### GIVEN

Constants and variables in the `GIVEN` section should start with `given`.

```javascript
// GIVEN a foo
const givenFoo = "foo";
// AND a bar
const givenBar = "bar";
```

### WHEN

Constants and variables in the `WHEN` section should start with `actual`.

```javascript
// WHEN the foo function is called
const actualFooResult = foo();
// AND the bar function is called
const actualBarPromise = bar();
```

### THEN

Constants and variables in the `THEN` section should start with `expected`.

```javascript
// THEN the expected foo value
const expectedFooOutcome = "foo";
// AND the expected bar value
const expectedBarOutcome = "bar";
```

## 7. Consistent style and format

We try to maintain the same style and format across all our tests. This makes it easier for developers to understand them.

Here is an example to demonstrate what we mean by it, with respect to the description of the tests:

```js
// The descriptions of these two tests don't follow the same pattern
it("should respond with status CREATED and body with new order on POST");
test("on POST respond with status CREATED and the new order in the response body")
```

The consistency of style and format is not limited only to the description, but extends to every aspect of the tests,
e.g. the phrasing of the `GIVEN`, `WHEN`, `THEN` inline comments, the constant and variable names, and the values
used in the tests, just to name a few.

The bottom line is that we treat the tests as a piece of code that needs to be well written, just like any other code in
the project.

It is important to note that there is certain effort associated with maintaining the style and format of the tests, so
we follow a pragmatic approach and try to maintain the style and format as much as possible, but we don't obsess over
it.

Like every other codebase the tests will evolve over time, and we will have to refactor them to keep them up to date
with the changes in the project. This is a good opportunity to improve the style and format of the tests.

# Putting it all together

Here is an example of the process our team follows to write tests while applying the rules mentioned above:

First, we start by writing the description of the tests:

```javascript
describe("test login() function", () => {
  it.todo("should return status OK and a token and the username on successful login");
  it.todo("should return status UNAUTHORIZED on failed login");
})
```

These become the acceptance criteria for the feature we will build (in this example the `login()`) function.

Then, we describe the test steps in detail using the Gherkin syntax:

```javascript
describe("test login() function", () => {
  it("should return status OK and a token and the username on successful login", async () => {
    // GIVEN a username
    // AND a password
    // AND the user will successfully login
 
    // WHEN the login function is called with the given username and password
 
    // THEN expect a response with the status OK
    // AND the response body to contain a token
    // AND to also contain the given username 
  });

  it("should return status UNAUTHORIZED on failed login", async () => {
    // GIVEN a username
    // AND a password
    // AND the user will faile to login
 
    // WHEN the login function is called with the given username and password
 
    // THEN expect a response with the status UNAUTHORIZED
    // AND the response body to be empty
  });
})
```

Finally, we implement the tests:

```javascript
describe("test login() function", () => {
  it("should return status OK and a token and the username on successful login", async () => {
    // GIVEN a username
    const givenUsername = "someUserName";
    // AND a password
    const givenPassword = "somePassword";
    // AND the user will successfully login
    setupMockLoginApi(true); // <-- true indicates that the login will succeed

    // WHEN the login function is called with the given username and password
    const actualResponse = await login(givenUsername, givenPassword);

    // THEN expect a response with the status OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND the response body to contain a token
    expect(actualResponse.body.token).toBeDefined();
    // AND to also contain the given username 
    expect(actualResponse.body.username).toEqual(givenUsername);
  });

  it("should return status UNAUTHORIZED on failed login", async () => {
    // GIVEN a username
    const givenUsername = "someUserName";
    // AND a password
    const givenPassword = "somePassword";
    // AND the user will faile to login
    setupMockLoginApi(false); // <-- false indicates that the login will fail

    // WHEN the login function is called with the given username and password
    const actualResponse = await login(givenUsername, givenPassword);

    // THEN expect a response with the status UNAUTHORIZED
    expect(actualResponse.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
    // AND the response body to be empty
    expect(actualResponse.body).toEqual({});
  });
})
```

One important point we would like to point out is that while we implement the tests, we also implement the functional code (the `login()` function in this case). We follow this approach across all architectural layers and components of the application.

# Conclusion

By structuring our test scenarios in this manner, we ensure that all aspects of the test case are clearly defined and  documented, making it easier to understand and maintain.

Looking at the bigger pictures, we think that TDD/BDD allows us to iterate fast, parallelize work  and deliver with confidence, therefore the effort associated with this approach is well worth it.

We are open to suggestions and feedback, so feel free to reach out to us with your thoughts.