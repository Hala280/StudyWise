using Microsoft.AspNetCore.Mvc;
using StudyWise.Application.DTOs.Topics;
using StudyWise.Application.Interfaces;
using StudyWise.Infrastructure.Parsing;
using System.Security.Claims;

namespace StudyWise.API.Controllers;

[Microsoft.AspNetCore.Authorization.Authorize]
[ApiController]
[Route("api/courses/{courseId}/syllabus")]
public class SyllabusController : ControllerBase
{
    private readonly GeminiSyllabusParser _parser;
    private readonly ITopicService _topicService;

    public SyllabusController(GeminiSyllabusParser parser, ITopicService topicService)
    {
        _parser = parser;
        _topicService = topicService;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("parse")]
    public async Task<IActionResult> ParseSyllabus(int courseId, IFormFile file)
    {
        // Validate file
        if (file is null || file.Length == 0)
            return BadRequest("No file uploaded.");

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File size must be under 10MB.");

        if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Only PDF files are allowed.");

        // Extract text from PDF
        string extractedText;
        using (var stream = file.OpenReadStream())
        {
            extractedText = PdfTextExtractor.ExtractText(stream);
        }

        if (string.IsNullOrWhiteSpace(extractedText))
            return BadRequest("Could not extract text from the PDF.");

        // Send to Gemini and get topics
        var parsedTopics = await _parser.ParseAsync(extractedText);

        if (parsedTopics.Count == 0)
            return BadRequest("No topics could be extracted from the syllabus.");

        // Save topics to database
        var savedTopics = new List<TopicDto>();
        foreach (var parsed in parsedTopics)
        {
            var dto = new CreateTopicDto
            {
                Title = parsed.Title,
                EstimatedHours = parsed.EstimatedHours,
                OrderIndex = parsed.OrderIndex
            };
            var saved = await _topicService.CreateAsync(courseId, dto, CurrentUserId);
            savedTopics.Add(saved);
        }

        return Ok(new
        {
            Message = $"Successfully extracted {savedTopics.Count} topics from the syllabus.",
            Topics = savedTopics
        });
    }
}
