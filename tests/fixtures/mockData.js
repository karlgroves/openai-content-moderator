// Mock data for tests
const mockOpenAIResponse = {
  results: [
    {
      flagged: false,
      categories: {
        sexual: false,
        hate: false,
        harassment: false,
        "self-harm": false,
        "sexual/minors": false,
        "hate/threatening": false,
        "violence/graphic": false,
        "self-harm/intent": false,
        "self-harm/instructions": false,
        "harassment/threatening": false,
        violence: false
      },
      category_scores: {
        sexual: 0.00001,
        hate: 0.00001,
        harassment: 0.00001,
        "self-harm": 0.00001,
        "sexual/minors": 0.00001,
        "hate/threatening": 0.00001,
        "violence/graphic": 0.00001,
        "self-harm/intent": 0.00001,
        "self-harm/instructions": 0.00001,
        "harassment/threatening": 0.00001,
        violence: 0.00001
      }
    }
  ]
};

const mockFlaggedResponse = {
  results: [
    {
      flagged: true,
      categories: {
        sexual: false,
        hate: true,
        harassment: false,
        "self-harm": false,
        "sexual/minors": false,
        "hate/threatening": false,
        "violence/graphic": false,
        "self-harm/intent": false,
        "self-harm/instructions": false,
        "harassment/threatening": false,
        violence: false
      },
      category_scores: {
        sexual: 0.00001,
        hate: 0.9,
        harassment: 0.00001,
        "self-harm": 0.00001,
        "sexual/minors": 0.00001,
        "hate/threatening": 0.00001,
        "violence/graphic": 0.00001,
        "self-harm/intent": 0.00001,
        "self-harm/instructions": 0.00001,
        "harassment/threatening": 0.00001,
        violence: 0.00001
      }
    }
  ]
};

const validTestCases = [
  {
    description: "normal text",
    input: { text: "This is a normal message" },
    expected: mockOpenAIResponse.results[0]
  },
  {
    description: "empty spaces",
    input: { text: "   Hello world   " },
    expected: mockOpenAIResponse.results[0]
  },
  {
    description: "long text",
    input: { text: "A".repeat(1000) },
    expected: mockOpenAIResponse.results[0]
  }
];

const invalidTestCases = [
  {
    description: "missing text field",
    input: {},
    expectedError: "Text content is required for moderation."
  },
  {
    description: "null text",
    input: { text: null },
    expectedError: "Text content is required for moderation."
  },
  {
    description: "empty string",
    input: { text: "" },
    expectedError: "Text content is required for moderation."
  },
  {
    description: "only whitespace",
    input: { text: "   " },
    expectedError: "Text content cannot be empty."
  },
  {
    description: "non-string text",
    input: { text: 123 },
    expectedError: "Text must be a string."
  },
  {
    description: "array text",
    input: { text: ["hello"] },
    expectedError: "Text must be a string."
  },
  {
    description: "text too long",
    input: { text: "A".repeat(32769) },
    expectedError: "Text content exceeds maximum length of 32,768 characters."
  }
];

module.exports = {
  mockOpenAIResponse,
  mockFlaggedResponse,
  validTestCases,
  invalidTestCases
};