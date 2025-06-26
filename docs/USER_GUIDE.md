# User Guide

## Introduction

The OpenAI Content Moderator API provides a simple way to check text content for potentially harmful material using OpenAI's moderation technology. This guide will help you get started and use the API effectively.

## What is Content Moderation?

Content moderation helps identify potentially harmful content in text, including:

- **Sexual content**: Content meant to arouse sexual excitement
- **Hate speech**: Content that expresses or promotes hate based on identity
- **Harassment**: Content that may harass, threaten, or bully
- **Self-harm**: Content that promotes or depicts acts of self-harm
- **Violence**: Content depicting violence or physical injury

## Getting Started

### Prerequisites

Before using the API, you'll need:

1. The API endpoint URL (provided by your administrator)
2. Basic knowledge of making HTTP requests
3. A tool or programming language to make API calls

### Making Your First Request

The simplest way to test the API is using a web browser extension like Postman or a command-line tool like curl.

**Example Request:**

```bash
curl -X POST http://your-api-url/api/moderation/text \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test message"}'
```

## Understanding the Response

When you send text to the API, you'll receive a response with two main parts:

### 1. Results

The moderation results include:

- **flagged**: A simple true/false indicating if the content was flagged
- **categories**: Which types of harmful content were detected
- **category_scores**: Confidence scores (0 to 1) for each category

### 2. Metadata

Additional information about the request:

- **timestamp**: When the moderation was performed
- **textLength**: How many characters were in your text
- **model**: Which AI model was used

**Example Response:**

```json
{
  "results": {
    "flagged": false,
    "categories": {
      "sexual": false,
      "hate": false,
      "harassment": false,
      "self-harm": false,
      "violence": false
    },
    "category_scores": {
      "sexual": 0.00001,
      "hate": 0.00002,
      "harassment": 0.00001,
      "self-harm": 0.00001,
      "violence": 0.00003
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "textLength": 28,
    "model": "omni-moderation-latest"
  }
}
```

## Interpreting Results

### Flagged Content

If `flagged` is `true`, the content was identified as potentially harmful. Check the `categories` object to see which types of content were detected.

### Category Scores

The `category_scores` provide confidence levels:

- **0.0 - 0.3**: Low confidence
- **0.3 - 0.7**: Medium confidence  
- **0.7 - 1.0**: High confidence

Higher scores indicate stronger confidence that the content belongs to that category.

### Making Decisions

How you handle flagged content depends on your use case:

- **Strict moderation**: Block any flagged content
- **Review queue**: Flag content for human review
- **Warning system**: Warn users about potentially harmful content
- **Scoring system**: Use category scores for nuanced decisions

## Common Use Cases

### 1. Comment Moderation

Check user comments before posting:

```javascript
async function checkComment(comment) {
  const response = await fetch('/api/moderation/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: comment })
  });
  
  const result = await response.json();
  
  if (result.results.flagged) {
    return { allowed: false, reason: 'Content violates guidelines' };
  }
  
  return { allowed: true };
}
```

### 2. Chat Filtering

Real-time message filtering:

```python
def filter_message(message):
    response = moderate_text(message)
    
    if response['results']['flagged']:
        # Don't send the message
        return "Your message was blocked due to inappropriate content"
    
    # Send the message normally
    return None
```

### 3. Content Pre-screening

Check articles or posts before publication:

```javascript
function screenContent(title, body) {
  // Check both title and body
  const promises = [
    moderateText(title),
    moderateText(body)
  ];
  
  return Promise.all(promises).then(results => {
    const titleFlagged = results[0].results.flagged;
    const bodyFlagged = results[1].results.flagged;
    
    return {
      approved: !titleFlagged && !bodyFlagged,
      issues: {
        title: titleFlagged,
        body: bodyFlagged
      }
    };
  });
}
```

## Best Practices

### 1. Text Preparation

- Remove unnecessary whitespace
- Consider checking text in chunks if very long
- Be aware of the 32,768 character limit

### 2. Error Handling

Always handle potential errors:

```javascript
try {
  const result = await moderateText(content);
  // Process result
} catch (error) {
  console.error('Moderation failed:', error);
  // Fallback behavior
}
```

### 3. User Experience

- Provide clear feedback when content is blocked
- Explain why content was flagged
- Offer users a way to appeal or contact support

### 4. Privacy Considerations

- Don't log sensitive user content
- Inform users that content is being checked
- Follow data protection regulations

## Limitations

Be aware of these limitations:

1. **Language Support**: Best performance with English text
2. **Context**: May miss context-dependent issues
3. **False Positives**: Sometimes flags benign content
4. **False Negatives**: May miss some harmful content
5. **Text Only**: Doesn't analyze images or other media

## Troubleshooting

### Common Issues

#### 1. "Text is required" error

- Ensure you're sending a JSON body with a "text" field
- Check Content-Type header is set to "application/json"

#### 2. "Text too long" error

- Text exceeds 32,768 characters
- Split long text into smaller chunks

#### 3. Empty response

- Check the API endpoint URL
- Verify network connectivity
- Check for proxy or firewall issues

#### 4. Slow responses

- Normal response time is 1-3 seconds
- Consider implementing timeouts
- Check network latency

### Getting Help

If you encounter issues:

1. Check the error message in the response
2. Verify your request format matches the examples
3. Test with simple text first
4. Contact your API administrator

## Integration Examples

### WordPress Plugin

```php
function moderate_comment($comment_text) {
    $api_url = 'http://your-api/api/moderation/text';
    
    $response = wp_remote_post($api_url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode(array('text' => $comment_text)),
        'timeout' => 30
    ));
    
    if (is_wp_error($response)) {
        return array('error' => true);
    }
    
    $body = wp_remote_retrieve_body($response);
    return json_decode($body, true);
}
```

### React Component

```jsx
function CommentForm() {
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const moderation = await checkModeration(comment);
    
    if (moderation.results.flagged) {
      setError('Your comment contains inappropriate content');
      return;
    }
    
    // Submit comment
    await submitComment(comment);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea 
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Post Comment</button>
    </form>
  );
}
```

## FAQ

**Q: How accurate is the moderation?**
A: The API uses OpenAI's advanced models with high accuracy, but no system is perfect. Always consider implementing human review for critical content.

**Q: Can I customize the sensitivity?**
A: The API uses OpenAI's standard thresholds. You can implement custom logic based on the category scores for more control.

**Q: Is the content stored?**
A: The API doesn't store content. Check with your administrator about logging policies.

**Q: What languages are supported?**
A: The API works best with English but can handle many languages with varying accuracy.

**Q: How fast is the API?**
A: Typical response times are 1-3 seconds, depending on text length and server load.

## Conclusion

The OpenAI Content Moderator API provides a powerful tool for keeping your platform safe. By understanding how to interpret results and following best practices, you can effectively moderate content while maintaining a good user experience.

For technical details and advanced integration, refer to the [API Reference](./API_REFERENCE.md).
