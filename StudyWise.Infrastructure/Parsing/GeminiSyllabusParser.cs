using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace StudyWise.Infrastructure.Parsing;

public class ParsedTopic
{
    public string Title { get; set; } = string.Empty;
    public int EstimatedHours { get; set; }
    public int OrderIndex { get; set; }
}

public class GeminiSyllabusParser
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;

    public GeminiSyllabusParser(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"]!;
        _model = configuration["Gemini:Model"]!;
    }

    public async Task<List<ParsedTopic>> ParseAsync(string syllabusText)
    {
        var prompt = $"""
            You are a study planner assistant. Extract all topics/chapters from this syllabus.
            Return ONLY a valid JSON array with no extra text, no markdown, no code blocks.
            Each item must have: title (string), estimatedHours (int), orderIndex (int starting from 1).
            
            Syllabus:
            {syllabusText}
            """;

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
        var response = await _httpClient.PostAsJsonAsync(url, requestBody);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(result);

        var rawText = json
            .RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "[]";

        // Clean any accidental markdown fences
        rawText = rawText.Trim().TrimStart('`');
        if (rawText.StartsWith("json")) rawText = rawText[4..];
        rawText = rawText.TrimEnd('`').Trim();

        return JsonSerializer.Deserialize<List<ParsedTopic>>(rawText, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new List<ParsedTopic>();
    }
}